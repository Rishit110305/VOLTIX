'use client';
import { useEffect, useState } from 'react';
import { getStationData, StationData, DEFAULT_DATA } from '@/lib/stationStore';

/**
 * Hook for the USER panel (or admin preview).
 * Polls the backend every 4 seconds to stay in sync.
 */
export const useStationStore = (): StationData => {
    const [data, setData] = useState<StationData>(DEFAULT_DATA);

    const refresh = async () => {
        const latest = await getStationData('ST001');
        setData(latest);
    };

    useEffect(() => {
        refresh(); // immediate on mount

        // Poll every 4 seconds
        const interval = setInterval(refresh, 4000);

        // Also react to local admin saves (same browser, instant feedback)
        window.addEventListener('voltix_data_updated', refresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener('voltix_data_updated', refresh);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return data;
};
