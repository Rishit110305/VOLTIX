import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (!socket) {
    // Connect DIRECTLY to backend (port 5005) in dev to bypass Next.js internal proxy ECONNREFUSED / socket drop XHR errors
    const url = process.env.NODE_ENV === "development" ? "http://localhost:5005" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000");
    socket = io(url, {
      withCredentials: true,
      autoConnect: true,
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      console.error("Socket connection error details:", error.message, error.name, error.stack);
    });

    socket.on("connect", () => {
      console.log("Socket connected successfully to backend");
      console.log("Socket ID:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        console.log("Server initiated disconnect, attempting to reconnect...");
        socket?.connect();
      }
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Attempting to reconnect socket (attempt ${attemptNumber})...`);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`Socket reconnected successfully after ${attemptNumber} attempts.`);
    });

    socket.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error);
    });

    socket.on("reconnect_failed", () => {
      console.error("Socket failed to reconnect after multiple attempts.");
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
