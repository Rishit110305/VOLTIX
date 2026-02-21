'use client';
import { useEffect, useState } from 'react';
import { connectSocket } from '@/app/config/socket';

export const useVoltixData = () => {
    const [liveState, setLiveState] = useState({
        mechanic: { health: "Normal", risk: 0.02 },
        traffic: { queue: 0, load: 45 },
        energy: { efficiency: 98 }
    });

    useEffect(() => {
        const socket = connectSocket();

        const handleStateUpdate = (data: any) => setLiveState(data);
        socket.on("station_state_update", handleStateUpdate);

        return () => {
            socket.off("station_state_update", handleStateUpdate);
        };
    }, []);

    return liveState;
};
