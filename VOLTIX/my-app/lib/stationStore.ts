// lib/stationStore.ts
// ---------------------------------------------------------------------------
// Shared data layer.
// Admin panel POSTs to the backend → backend stores in memory (→ MongoDB later)
// Main VOLTIX site GETs from same backend endpoint.
// ---------------------------------------------------------------------------

export interface StationData {
    batteryPercentage: number;
    batteriesAvailable: number;
    queueCount: number;
    isActive: boolean;
    lastUpdatedBy: string;
}

export const DEFAULT_DATA: StationData = {
    batteryPercentage: 80,
    batteriesAvailable: 10,
    queueCount: 0,
    isActive: true,
    lastUpdatedBy: 'Not yet set by admin',
};

// Uses the Next.js rewrite proxy — requests go to the same origin
// and Next.js forwards them to the backend server
const ENDPOINT = '/api/stations/admin-status';

/** Read current station data from the backend */
export async function getStationData(): Promise<StationData> {
    try {
        const res = await fetch(ENDPOINT, { cache: 'no-store' });
        const json = await res.json();
        if (json.success) return json.data as StationData;
    } catch (err) {
        console.warn('[stationStore] Backend unreachable, returning defaults:', err);
    }
    return DEFAULT_DATA;
}

/** Persist station data set by admin → sends to Express backend */
export async function setStationData(data: StationData): Promise<void> {
    try {
        await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        // Also fire a local event so the user panel (if open on same browser) reacts instantly
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('voltix_data_updated'));
        }
    } catch (err) {
        console.error('[stationStore] Failed to save to backend:', err);
    }
}
