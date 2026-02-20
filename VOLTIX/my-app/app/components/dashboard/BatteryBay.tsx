"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Zap, BatteryCharging, MapPin, Gauge } from "lucide-react";

// Types
type BatterySlot = {
    id: number;
    chargeLevel: number; // 0-100
    health: number; // 0-100
    cycles: number;
};

// Mongoose Schema Mimic
const mockStationData = {
    name: "Station Alpha-1",
    stationId: "ST004",
    location: {
        city: "Mumbai",
        locationFlags: ["Highway Location", "24/7 Access"]
    },
    operationalStatus: {
        status: "active" as "active" | "maintenance" | "offline"
    },
    capacity: 20,
    realTimeData: {
        availableSlots: 12
    },
    pricing: {
        pricePerKwh: 12,
        discountActive: true
    },
    agentActions: {
        lastMechanicAction: {
            result: "System Optimized by Mechanic Agent"
        }
    }
};

// Data Generator
const generateBatteries = (): BatterySlot[] => {
    return Array.from({ length: 16 }).map((_, i) => ({
        id: i + 1,
        // Bias towards charged batteries for visual appeal
        chargeLevel: Math.random() > 0.3
            ? Math.floor(Math.random() * 20) + 81 // 81-100%
            : Math.floor(Math.random() * 80),     // 0-79%
        health: Math.floor(Math.random() * 15) + 85, // 85-100%
        cycles: Math.floor(Math.random() * 800) + 50,
    }));
};

export default function BatteryBay() {
    const [batteries] = useState<BatterySlot[]>(generateBatteries());

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[500px] w-full">

            {/* Left Column: Station Details */}
            <div className="flex flex-col gap-6 p-8 rounded-3xl bg-neutral-900/50 border border-neutral-800 backdrop-blur-xl shadow-inner relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                        <Zap className="w-8 h-8 text-emerald-500 fill-emerald-500/20" />
                        {mockStationData.name}
                    </h2>
                    <p className="text-neutral-500 font-mono text-sm">ID: {mockStationData.stationId} • Series X</p>
                </div>

                <div className="space-y-6 mt-4">
                    <DetailRow
                        icon={<MapPin className="text-blue-400" />}
                        label="Location"
                        value={`${mockStationData.location.city} • ${mockStationData.location.locationFlags[0]}`}
                    />

                    {/* Status Badge */}
                    <div className="flex items-center gap-4 group">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border transition-colors",
                            mockStationData.operationalStatus.status === 'active'
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                : "bg-red-500/10 border-red-500/20 text-red-500"
                        )}>
                            <Gauge className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs text-neutral-500 uppercase tracking-wider">Status</div>
                            <div className={cn("font-medium capitalize",
                                mockStationData.operationalStatus.status === 'active' ? "text-emerald-400" : "text-red-400"
                            )}>{mockStationData.operationalStatus.status}</div>
                        </div>
                    </div>

                    {/* Inventory & Pricing */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-black/40 border border-neutral-800">
                            <div className="text-xs text-neutral-400 mb-1">Pricing</div>
                            <div className="text-xl font-bold text-white">
                                ₹{mockStationData.pricing.pricePerKwh}<span className="text-sm font-normal text-neutral-500">/kWh</span>
                            </div>
                            {mockStationData.pricing.discountActive && (
                                <span className="inline-block mt-1 text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/30">
                                    Dynamic Deal
                                </span>
                            )}
                        </div>
                        <div className="p-4 rounded-xl bg-black/40 border border-neutral-800">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-neutral-400">Slots</span>
                                <span className="text-white font-mono">{mockStationData.realTimeData.availableSlots} / {mockStationData.capacity}</span>
                            </div>
                            <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${(mockStationData.realTimeData.availableSlots / mockStationData.capacity) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono border-t border-neutral-800/50 pt-4">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        SYSTEM: {mockStationData.agentActions.lastMechanicAction.result.toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Right Column: Battery Grid Visualization */}
            <div className="relative p-6 rounded-2xl bg-gray-100 dark:bg-[#1a1a1a] border-4 border-gray-200 dark:border-neutral-800 shadow-2xl flex flex-col items-center justify-between group transition-colors duration-300">
                {/* Metallic Texture Overlay (Dark Mode Only) */}
                <div className="hidden dark:block absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />

                {/* Vending Machine Header/Handle */}
                <div className="w-full h-8 mb-4 bg-gradient-to-b from-gray-200 to-gray-300 dark:from-neutral-800 dark:to-neutral-900 rounded-md border border-gray-300 dark:border-neutral-700 flex items-center justify-center shadow-lg z-10">
                    <div className="w-1/3 h-1.5 bg-gray-400 dark:bg-neutral-950/50 rounded-full shadow-inner" />
                </div>

                {/* 4x4 Grid */}
                <div className="grid grid-cols-4 gap-3 w-full aspect-square md:aspect-auto md:h-[400px]">
                    {batteries.map((battery) => (
                        <BatterySlotNode key={battery.id} battery={battery} />
                    ))}
                </div>

                {/* Machine Footer */}
                <div className="mt-4 w-full flex justify-between items-center px-4 py-3 bg-gray-200 dark:bg-neutral-900/80 rounded-lg border border-gray-300 dark:border-neutral-800 z-10">
                    <div className="text-[10px] text-gray-500 dark:text-neutral-500 font-mono tracking-widest">VOLTIX SWAP SYSTEM</div>
                    <div className="flex gap-1.5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailRow({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors">
                {React.cloneElement(icon, { className: "w-5 h-5" })}
            </div>
            <div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider">{label}</div>
                <div className="text-white font-medium">{value}</div>
            </div>
        </div>
    );
}

function BatterySlotNode({ battery }: { battery: BatterySlot }) {
    const isReady = battery.chargeLevel > 80;

    return (
        <motion.div
            className={cn(
                "relative group rounded-lg overflow-hidden flex flex-col items-center justify-end p-2 transition-all duration-300 border-2 cursor-help",
                isReady
                    ? "border-emerald-500/20 bg-emerald-950/30 hover:border-emerald-400/50"
                    : "border-red-500/20 bg-red-950/30 hover:border-red-500/40"
            )}
            whileHover={{ scale: 1.05, zIndex: 10 }}
        >
            {/* Battery Fill Level Animation */}
            <motion.div
                className={cn(
                    "absolute bottom-0 left-0 right-0 opacity-30",
                    isReady ? "bg-emerald-500" : "bg-red-500"
                )}
                initial={{ height: 0 }}
                animate={{
                    height: `${battery.chargeLevel}%`,
                    opacity: isReady ? [0.2, 0.4, 0.2] : 0.2
                }}
                transition={{
                    height: { duration: 1.5, ease: "easeOut" },
                    opacity: isReady ? { duration: 2, repeat: Infinity } : {}
                }}
            />

            {/* Icon Overlay */}
            <div className="relative z-10 mb-auto mt-2 opacity-80 decoration-slice">
                {isReady ? (
                    <Zap className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                ) : (
                    <BatteryCharging className="w-4 h-4 text-red-500" />
                )}
            </div>

            {/* Charge Level Line */}
            <div className="w-full h-px bg-white/10 my-2 relative z-10" />

            {/* Percentage Text */}
            <div className={cn(
                "relative z-10 text-[10px] md:text-xs font-mono font-bold tracking-tighter",
                isReady ? "text-emerald-100" : "text-red-200"
            )}>
                {battery.chargeLevel}%
            </div>

            {/* HOVER TOOLTIP */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] text-white font-mono p-1 text-center backdrop-blur-md">
                <div className={cn("font-bold mb-1", isReady ? "text-emerald-400" : "text-red-400")}>
                    {isReady ? "READY" : "CHARGING"}
                </div>
                <div className="w-full h-px bg-white/20 mb-1" />
                <div className="text-neutral-300">Slot #{battery.id}</div>
                <div className="text-neutral-400 scale-90">H: {battery.health}%</div>
                <div className="text-neutral-500 scale-90">cyc: {battery.cycles}</div>
            </div>

        </motion.div>
    );
}
