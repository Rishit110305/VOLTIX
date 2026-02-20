'use client';
import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: React.ReactNode;
    accentColor: string;       // Tailwind text color class e.g. "text-green-400"
    glowColor: string;         // CSS color for box-shadow glow e.g. "#22c55e"
    ring?: number;             // 0–100 to show a circular progress ring
    badge?: { label: string; type: 'active' | 'inactive' };
    large?: boolean;
}

export const StatCard = ({
    title,
    value,
    subtext,
    icon,
    accentColor,
    glowColor,
    ring,
    badge,
    large,
}: StatCardProps) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = ring !== undefined ? circumference - (ring / 100) * circumference : 0;

    return (
        <div
            className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 flex flex-col gap-4 overflow-hidden transition-all duration-300 hover:border-white/20 hover:-translate-y-1"
            style={{
                boxShadow: `0 0 0 0 ${glowColor}`,
                transition: 'box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease',
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px 4px ${glowColor}44`;
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${glowColor}`;
            }}
        >
            {/* Background ambient glow */}
            <div
                className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none"
                style={{ backgroundColor: glowColor }}
            />

            {/* Header row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`${accentColor}`}>{icon}</span>
                    <span className="text-neutral-400 text-sm font-medium tracking-wide uppercase">
                        {title}
                    </span>
                </div>
                {badge && (
                    <span
                        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.type === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                            }`}
                    >
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${badge.type === 'active' ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                                }`}
                        />
                        {badge.label}
                    </span>
                )}
            </div>

            {/* Main content */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span
                        className={`font-bold tracking-tight ${accentColor} transition-all duration-500 ${large ? 'text-6xl' : 'text-5xl'
                            }`}
                    >
                        {value}
                    </span>
                    {subtext && (
                        <span className="text-neutral-500 text-sm mt-1">{subtext}</span>
                    )}
                </div>

                {/* Circular ring progress */}
                {ring !== undefined && (
                    <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0 -rotate-90">
                        {/* Track */}
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            fill="none"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="8"
                        />
                        {/* Progress */}
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            fill="none"
                            stroke={glowColor}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                        />
                    </svg>
                )}
            </div>
        </div>
    );
};
