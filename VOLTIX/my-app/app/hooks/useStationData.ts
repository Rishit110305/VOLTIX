'use client';
import { useEffect, useState } from 'react';

export interface StationData {
    batteryPercentage: number;       // average battery % across all units
    batteriesAvailable: number;      // how many fully charged batteries ready
    queueCount: number;              // people waiting
    isActive: boolean;               // station online or not
    lastUpdated: Date;
}

const randomBetween = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const generateMockData = (): StationData => ({
    batteryPercentage: randomBetween(42, 97),
    batteriesAvailable: randomBetween(2, 18),
    queueCount: randomBetween(0, 14),
    isActive: Math.random() > 0.1, // 90% chance active
    lastUpdated: new Date(),
});

export const useStationData = () => {
    const [data, setData] = useState<StationData>(generateMockData());

    useEffect(() => {
        // Refresh every 3 seconds to simulate live feed
        const interval = setInterval(() => {
            setData(generateMockData());
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return data;
};
