"use client";

import { useEffect, useState } from "react";

interface AdminStationData {
    batteryPercentage: number;
    batteriesAvailable: number;
    queueCount: number;
    isActive: boolean;
    lastUpdatedBy: string;
}


/**
 * StationStatusWidget
 * Reads admin-set station data from /api/stations/admin-status
 * and renders a live status bar on the main VOLTIX dashboard.
 */
export function StationStatusWidget() {
    const [data, setData] = useState<AdminStationData | null>(null);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/stations/admin-status`, {
                cache: "no-store",
            });
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch {
            // Backend not running — silently skip
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // refresh every 5s
        return () => clearInterval(interval);
    }, []);

    if (!data) return null;

    const batteryColor =
        data.batteryPercentage >= 60
            ? "#22c55e"
            : data.batteryPercentage >= 30
                ? "#f59e0b"
                : "#ef4444";

    return (
        <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-5 py-4 mb-5 flex flex-wrap gap-5 items-center">
            {/* Label */}
            <div className="flex items-center gap-2 shrink-0">
                <span
                    className={`w-2 h-2 rounded-full ${data.isActive ? "bg-green-400 animate-pulse" : "bg-red-400"
                        }`}
                />
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                    Station Live Status
                </span>
            </div>

            <div className="flex flex-wrap gap-5 items-center">
                {/* Battery */}
                <div className="flex items-center gap-2.5">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={batteryColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="2" y="7" width="18" height="11" rx="2" />
                        <path d="M22 11v3" />
                    </svg>
                    <div className="flex items-center gap-1.5">
                        <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${data.batteryPercentage}%`,
                                    backgroundColor: batteryColor,
                                }}
                            />
                        </div>
                        <span
                            className="text-sm font-bold tabular-nums"
                            style={{ color: batteryColor }}
                        >
                            {data.batteryPercentage}%
                        </span>
                    </div>
                </div>

                <div className="w-px h-4 bg-white/10" />

                {/* Batteries available */}
                <div className="flex items-center gap-1.5 text-blue-400">
                    <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m7.5 4.27 9 5.15" />
                        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                        <path d="m3.3 7 8.7 5 8.7-5" />
                        <path d="M12 22V12" />
                    </svg>
                    <span className="text-sm font-bold">{data.batteriesAvailable}</span>
                    <span className="text-xs text-neutral-500">batteries ready</span>
                </div>

                <div className="w-px h-4 bg-white/10" />

                {/* Queue */}
                <div className="flex items-center gap-1.5 text-purple-400">
                    <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-sm font-bold">{data.queueCount}</span>
                    <span className="text-xs text-neutral-500">in queue</span>
                </div>

                <div className="w-px h-4 bg-white/10" />

                {/* Station active */}
                <div
                    className={`flex items-center gap-1.5 text-sm font-semibold ${data.isActive ? "text-green-400" : "text-red-400"
                        }`}
                >
                    {data.isActive ? "⚡ Station Online" : "⛔ Station Offline"}
                </div>
            </div>

            {/* Last updated */}
            {data.lastUpdatedBy && data.lastUpdatedBy !== "Not yet set by admin" && (
                <span className="text-[10px] text-neutral-700 ml-auto shrink-0">
                    {data.lastUpdatedBy}
                </span>
            )}
        </div>
    );
}
