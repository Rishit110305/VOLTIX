import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: false,
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
