import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import webpush from "web-push";

import connectDB from "./config/db.js";
import { initSocket } from "./config/socket.js";
import eventProcessor from "./services/eventProcessor.js";
import blockchainService from "./services/blockchainService.js";
import agentBus from "./eventBus/agentBus.js";
import auditReportRoutes from "./routes/auditReport.js";
import { WebSocketServer } from "ws";

//routes
import mlRoutes from "./routes/ml.js";
import authRoutes from "./routes/auth.js";
import auditRoutes from "./routes/audit.js";
import notificationRoutes from "./routes/notification.js";
import pushRoutes from "./routes/push.js";
import dataRoutes from "./routes/data.js";
import agentRoutes from "./routes/agents.js";
import blockchainRoutes from "./routes/blockchain.js";
import chatRoutes from "./routes/chat.js";
import systemRoutes from "./routes/system.js";
import testRoutes from "./routes/test.js";
import decisionsRoutes from "./routes/decisions.js";
import stationsRoutes from "./routes/stations.js";
import trafficRoutes from "./routes/traffic.js";
import demoRoutes from "./routes/demo.js";
import adminAuthRoutes from "./routes/adminAuth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// CORS Configuration - Support multiple origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:4000",
  process.env.CLIENT_URL,
  // Add your Vercel URLs here
].filter(Boolean);

// If CLIENT_URL contains multiple URLs (comma-separated), split them
if (process.env.CLIENT_URL && process.env.CLIENT_URL.includes(',')) {
  const urls = process.env.CLIENT_URL.split(',').map(url => url.trim());
  allowedOrigins.push(...urls);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          console.warn(`CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    message: "Voltix Backend API is running",
    status: "healthy",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      stations: "/api/stations",
      decisions: "/api/decisions"
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/test", (req, res) => {
  res.json({ message: "Server is running" });
});

await connectDB();

// Initialize Blockchain Service
console.log("Initializing blockchain service...");
const blockchainInit = await blockchainService.initialize();
if (blockchainInit.success) {
  console.log("Blockchain service initialized successfully");
  console.log(`Contract: ${blockchainInit.contractAddress}`);
  console.log(`Wallet: ${blockchainInit.walletAddress}`);
} else {
  console.warn(
    "Blockchain service failed to initialize:",
    blockchainInit.error,
  );
  console.warn(
    "Continuing without blockchain - audit logs will be database-only",
  );
}

app.use((err, req, res, next) => {
  const status = typeof err.status === "number" ? err.status : 500;
  const message = err.message || "Internal Server Error";
  if (res.headersSent) return next(err);
  res.status(status).json({ message });
});

app.use("/api/ml", mlRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/test", testRoutes);
app.use("/api/decisions", decisionsRoutes);
app.use("/api/stations", stationsRoutes);
app.use("/api/traffic", trafficRoutes);
app.use("/api/demo", demoRoutes);
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/audit-report", auditReportRoutes);

// 404 handler for API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Error handling middleware (MUST be after routes)
app.use((err, req, res, next) => {
  const status = typeof err.status === "number" ? err.status : 500;

  // Don't clutter the terminal with normal expected errors like 401 or 404
  if (status >= 500) {
    console.error(`❌ Server Error at ${req.originalUrl}:`, err);
  }

  const message = err.message || "Internal Server Error";
  if (res.headersSent) return next(err);
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

// Make io available globally for notification dispatch
app.set("io", io);

// ==========================================
// 🔌 NEXT-GEN: OCPP 1.6J SERVER INTEGRATION
// ==========================================
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  if (request.url.startsWith('/ocpp')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', (ws, req) => {
  const stationId = req.url.split('/').pop();
  console.log(`[OCPP] 🔌 Station connected via WebSocket: ${stationId}`);

  ws.on('message', (message) => {
    try {
      const payload = JSON.parse(message);
      // OCPP format: [MessageTypeId, UniqueId, Action, Payload]
      const [typeId, uniqueId, action, data] = payload;

      console.log(`[OCPP] 📩 Received ${action} from ${stationId}:`, data);

      io.emit("ocpp-log", {
        direction: "IN",
        stationId: stationId,
        action: action,
        payload: data,
        timestamp: new Date().toISOString()
      });

      // Send hardware telemetry directly to Admin Panel via Socket.IO
      if (action === "MeterValues") {
        io.emit("station-metrics-update", {
          stationId: stationId,
          status: "operational",
          health: {
            batteryLevel: data.meterValue[0].sampledValue[0].value,
            temperature: "32°C",
            voltage: "400V"
          }
        });
      }

      // Automatically construct OCPP CallResult acknowledgement
      const response = [
        3, // CallResult Type
        uniqueId,
        action === 'BootNotification' ? { status: 'Accepted', currentTime: new Date().toISOString(), interval: 300 } :
          action === 'Heartbeat' ? { currentTime: new Date().toISOString() } :
            action === 'StatusNotification' ? {} :
              action === 'MeterValues' ? {} : {}
      ];

      ws.send(JSON.stringify(response));

      io.emit("ocpp-log", {
        direction: "OUT",
        stationId: stationId,
        action: "CallResult",
        payload: response[2],
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error("[OCPP] ❌ Invalid payload:", err);
    }
  });

  ws.on('close', () => {
    console.log(`[OCPP] 🔌 Station disconnected: ${stationId}`);
  });
});
// ==========================================

// Start Event Processor (THE BRAIN)
eventProcessor.start(io);
console.log("Event Processor started - Ready to process live data!");

// Start Agent Bus (AGENT COORDINATION)
await agentBus.start(io);
console.log("Agent Bus started - Ready to coordinate agents!");

// console.log(webpush.generateVAPIDKeys());
if (process.env.PUBLIC_VAPID_KEY && process.env.PRIVATE_VAPID_KEY) {
  webpush.setVapidDetails(
    "mailto:guptakaran.port@gmail.com",
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY,
  );
}

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Run this to free it:  kill -9 $(lsof -ti :${PORT})`);
    console.error(`   Then restart:         npm run dev\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
