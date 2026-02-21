"use client";

import { useEffect, useState } from "react";
import { connectSocket, getSocket } from "@/app/config/socket";
import type { Socket } from "socket.io-client";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Rely on the robust singleton socket instance
    const socketInstance = connectSocket();

    const handleConnect = () => console.log("useSocket connected to single instance:", socketInstance.id);
    const handleDisconnect = () => console.log("useSocket disconnected");
    const handleConnectError = (error: any) => console.error("useSocket connection error:", error);

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("connect_error", handleConnectError);

    setTimeout(() => {
      setSocket(socketInstance);
    }, 0);

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketInstance.off("connect_error", handleConnectError);
      // We don't disconnect the singleton on unmount!
    };
  }, []);

  return socket;
}
