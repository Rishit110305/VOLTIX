import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { addUser, removeUser } from "../utils/socketRegistry.js";

// socket handlers
import stationHandler from "../socket/stationHandler.js";
import mlAgentHandler from "../socket/mlAgentHandler.js";
import notificationHandler from "../socket/notificationHandler.js";
import dataIngestionHandler from "../socket/dataIngestionHandler.js";

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  /* auth middleware */
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) {
        // do not block polling
        return next();
      }

      const cookies = cookie.parse(cookieHeader);
      const token = cookies.accessToken;
      if (!token) return next();

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      socket.userId = decoded.userId || decoded.id || decoded._id;
      socket.role = decoded.role || 'user';
      next();
    } catch (err) {
      console.error("Socket auth error:", err.message);
      next(); // do not block connection
    }
  });

  // socket connection
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    if (socket.userId) {
      addUser(socket.userId, socket.id);
      socket.join(socket.userId.toString());
      
      // All users join general notification rooms
      socket.join('general_users');
      socket.join('agent:traffic'); // All users get traffic notifications (incentives)
      
      console.log(`User ${socket.userId} joined general rooms`);
    } else {
      console.warn("Unauthenticated socket:", socket.id);
    }

    // handlers
    stationHandler(io, socket);
    mlAgentHandler(io, socket);
    notificationHandler(io, socket);
    dataIngestionHandler(io, socket);

    socket.on("disconnect", () => {
      removeUser(socket.userId);
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};