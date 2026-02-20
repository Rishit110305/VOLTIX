'use client';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useVoltixData = () => {
    const [liveState, setLiveState] = useState({
        mechanic: { health: "Normal", risk: 0.02 },
        traffic: { queue: 0, load: 45 },
        energy: { efficiency: 98 }
    });

    useEffect(() => {
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6000';
        const socket = io(BACKEND_URL);
        socket.on("station_state_update", (data) => setLiveState(data));
        return () => { socket.disconnect(); };
    }, []);

    return liveState;
};
