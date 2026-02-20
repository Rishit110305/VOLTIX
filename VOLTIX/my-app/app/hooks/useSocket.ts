import { useEffect, useState } from 'react';
import { connectSocket, getSocket } from '../config/socket';
import type { Socket } from 'socket.io-client';

export function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to socket
    const socketInstance = connectSocket();
    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return socket;
}