"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import NeuralGrid from "@/components/NeuralGrid";
import { NavbarDemo } from "@/app/components/Navbar";
import {
    Wrench,
    TrafficCone,
    Truck,
    Banknote,
    ShieldCheck,
    ArrowRight,
    RefreshCcw,
    CheckCircle2,
    TrendingUp,
    Map,
    FileBadge
} from "lucide-react";

// --- Types ---
type Agent = {
    id: number;
    role: string;
    headline: string;
    visual: React.ReactNode;
    mascotAction: React.ReactNode;
    description?: string;
};

const AGENTS: Agent[] = [
    {
        id: 1,
        role: "The Mechanic",
        headline: "90% of faults are software. I fix them in 5 seconds.",
        visual: (
            <div className="flex items-center gap-2 font-mono text-xs md:text-sm text-red-400 bg-black/50 p-3 rounded border border-red-500/20">
                <span className="line-through opacity-50">Error 503</span>
                <ArrowRight className="w-4 h-4 text-emerald-500" />
                <span className="text-yellow-400 animate-pulse">Auto-Reboot</span>
                <ArrowRight className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-400 font-bold">Online</span>
            </div>
        ),
        mascotAction: (
            <div className="relative">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500">
                    <Wrench className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 text-xl">👍</div>
            </div>
        ),
    },
    {
        id: 2,
        role: "The Traffic Controller",
        headline: "I don't just route cars; I bribe them.",
        visual: (
            <div className="p-3 bg-black/50 rounded border border-emerald-500/20 font-mono text-[10px] md:text-xs text-emerald-200">
                <div className="mb-1 text-neutral-500">// Incentive Algorithm</div>
                <div>
                    <span className="text-purple-400">Incentive</span> =
                    (<span className="text-blue-400">Time</span><span className="opacity-50">Saved</span> × <span className="text-amber-400">Value</span><span className="opacity-50">Time</span>) +
                </div>
                <div className="pl-14">
                    (<span className="text-red-400">Dist</span><span className="opacity-50">Extra</span> × <span className="text-green-400">Cost</span><span className="opacity-50">Km</span>)
                </div>
            </div>
        ),
        mascotAction: (
            <div className="relative">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500">
                    <TrafficCone className="w-6 h-6 text-purple-400" />
                </div>
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-bold px-1 rounded animate-bounce">
                    50% OFF
                </div>
            </div>
        ),
    },
    {
        id: 3,
        role: "The Logistics Manager",
        headline: "I predict stockouts 45 minutes before they happen.",
        visual: (
            <div className="relative w-full h-12 bg-neutral-900 rounded border border-emerald-500/20 overflow-hidden flex items-center px-4">
                <Map className="absolute text-neutral-800 w-full h-full opacity-20" />
                <div className="w-full h-[2px] bg-neutral-700 relative">
                    <motion.div
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"
                        animate={{ left: ["0%", "80%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                </div>
                <div className="absolute left-2 text-[10px] text-neutral-400">Station A</div>
                <div className="absolute right-2 text-[10px] text-neutral-400">Station B</div>
            </div>
        ),
        mascotAction: (
            <div className="relative">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500">
                    <Truck className="w-6 h-6 text-blue-400" />
                </div>
            </div>
        ),
    },
    {
        id: 4,
        role: "The Energy Broker",
        headline: "I turn batteries into financial assets.",
        visual: (
            <div className="w-full h-24 bg-black/50 rounded border border-emerald-500/20 p-2 flex items-end gap-1 overflow-hidden relative">
                <TrendingUp className="absolute top-2 right-2 w-4 h-4 text-emerald-500 opacity-50" />
                {[40, 60, 35, 70, 50, 85, 95].map((h, i) => (
                    <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className={cn(
                            "flex-1 rounded-t-sm opacity-80",
                            h > 60 ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" : "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                        )}
                    />
                ))}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-black/80 px-2 rounded border border-white/10">
                    <span className="text-emerald-400">BUY</span> / <span className="text-red-400">SELL</span>
                </div>
            </div>
        ),
        mascotAction: (
            <div className="relative">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500">
                    <Banknote className="w-6 h-6 text-amber-400" />
                </div>
            </div>
        ),
    },
    {
        id: 5,
        role: "The Auditor",
        headline: "I ensure no dispute goes unsolved.",
        visual: (
            <div className="flex items-center gap-3 font-mono text-sm bg-black/50 p-3 rounded border border-emerald-500/20">
                <FileBadge className="w-8 h-8 text-neutral-600" />
                <div className="flex flex-col">
                    <span className="text-[10px] text-neutral-500">Hash: 0x7f...3a9</span>
                    <div className="flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        BLOCK VERIFIED
                    </div>
                </div>
            </div>
        ),
        mascotAction: (
            <div className="relative">
                <div className="w-12 h-12 bg-neutral-500/20 rounded-full flex items-center justify-center border border-neutral-500">
                    <ShieldCheck className="w-6 h-6 text-neutral-300" />
                </div>
                <div className="absolute -top-3 -right-3 text-2xl rotate-12">⚖️</div>
            </div>
        ),
    },
];

export default function MeetTheSquad() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const scrollFill = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    // Scroll-triggered video playback
    const videoRef = useRef<HTMLVideoElement>(null);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
    const rewindInterval = useRef<NodeJS.Timeout | null>(null);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (videoRef.current) {
                // Determine Direction
                const isScrollingDown = currentScrollY > lastScrollY.current;

                if (isScrollingDown) {
                    // STOP Rewiding
                    if (rewindInterval.current) {
                        cancelAnimationFrame(rewindInterval.current as any);
                        rewindInterval.current = null;
                    }

                    // PLAY Forward
                    if (videoRef.current.paused) {
                        videoRef.current.play().catch(() => { });
                    }
                } else {
                    // STOP Forward Play
                    if (!videoRef.current.paused) {
                        videoRef.current.pause();
                    }

                    // START Rewinding (via RAF)
                    if (!rewindInterval.current) {
                        const animateRewind = () => {
                            if (videoRef.current) {
                                // Adjusted step for smoother rewind
                                videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 0.035);
                            }
                            // Store the RAF ID in the existing ref (cast as any to avoid type errors temporarily if needed, or we just use number if typed)
                            rewindInterval.current = requestAnimationFrame(animateRewind) as any;
                        };
                        animateRewind();
                    }
                }

                // COMMON: Reset Stop Timer
                if (scrollTimeout.current) {
                    clearTimeout(scrollTimeout.current);
                }

                // PAUSE/STOP Everything after scrolling stops
                scrollTimeout.current = setTimeout(() => {
                    // Stop Forward
                    if (videoRef.current && !videoRef.current.paused) {
                        videoRef.current.pause();
                    }
                    // Stop Rewind
                    if (rewindInterval.current) {
                        cancelAnimationFrame(rewindInterval.current as any);
                        rewindInterval.current = null;
                    }
                }, 150);
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
            if (rewindInterval.current) clearInterval(rewindInterval.current);
        };
    }, []);

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden relative">
            <div className="relative z-50">
                <NavbarDemo />
            </div>
            {/* FIXED BACKGROUND LAYER */}
            <div className="fixed inset-0 z-0">
                <video
                    ref={videoRef}
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                >
                    <source src="/assets/bg_video_v2.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/70" /> {/* Dark Overlay */}
            </div>

            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] right-[20%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-24" ref={containerRef}>
                <Header />

                <div className="relative pt-20 pb-40">
                    {/* THE POWER GRID (Central Line) */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-neutral-800 -translate-x-1/2 rounded-full" />

                    {/* Active Fill Line */}
                    <motion.div
                        className="absolute left-1/2 top-0 w-[2px] bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-400 -translate-x-1/2 rounded-full origin-top shadow-[0_0_15px_rgba(16,185,129,0.6)]"
                        style={{ height: useTransform(scrollFill, [0, 1], ["0%", "100%"]) }}
                    />

                    {/* SQUAD NODES */}
                    <div className="flex flex-col gap-16 relative">
                        {AGENTS.map((agent, index) => (
                            <AgentNode
                                key={agent.id}
                                agent={agent}
                                index={index}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <NeuralGrid />
        </div>
    );
}

// --- Components ---

function Header() {
    return (
        <div className="text-center mb-24 space-y-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-block px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-mono tracking-widest uppercase mb-4"
            >
                Command Chain Initialized
            </motion.div>
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-bold tracking-tight"
            >
                Meet The <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Agent Squad</span>
            </motion.h1>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-neutral-400 max-w-2xl mx-auto text-lg"
            >
                Five specialized AI agents working in perfect unison to optimize the grid.
            </motion.p>
        </div>
    );
}

function AgentNode({ agent, index }: { agent: Agent; index: number }) {
    const isEven = index % 2 === 0;

    return (
        <motion.div
            initial="initial"
            whileInView="active"
            viewport={{ margin: "-40% 0px -40% 0px", once: false }}
            className="relative flex items-center justify-center w-full"
        >
            {/* CENTER NODE */}
            <div className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center justify-center group cursor-pointer">
                <motion.div
                    variants={{
                        initial: { scale: 1, boxShadow: "0 0 0px rgba(16,185,129,0)" },
                        active: { scale: 1.2, boxShadow: "0 0 30px rgba(16,185,129,0.6)", borderColor: "#34d399", backgroundColor: "#064e3b" }
                    }}
                    transition={{ duration: 0.5 }}
                    className="w-8 h-8 rounded-full bg-black border-2 border-neutral-700 z-20 relative flex items-center justify-center transition-colors"
                >
                    <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                </motion.div>
            </div>

            {/* CONTENT CARD */}
            <motion.div
                variants={{
                    initial: { opacity: 0, x: isEven ? 50 : -50, scale: 0.9 },
                    active: { opacity: 1, x: 0, scale: 1 }
                }}
                transition={{ type: "spring", stiffness: 50, damping: 20 }}
                className={cn(
                    "w-[90%] md:w-[450px] p-1 pointer-events-none md:pointer-events-auto",
                    isEven ? "md:mr-auto md:pr-12 lg:pr-24 mr-0" : "md:ml-auto md:pl-12 lg:pl-24 ml-0" // Shift to sides
                )}
            >
                <div className={cn(
                    "relative bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 rounded-2xl overflow-hidden p-6 md:p-8 hover:border-emerald-500/30 transition-colors group",
                    isEven ? "text-right" : "text-left"
                )}>
                    {/* Glowing corner accent */}
                    <div className={cn(
                        "absolute top-0 w-20 h-20 bg-emerald-500/10 blur-xl rounded-full",
                        isEven ? "right-0" : "left-0"
                    )} />

                    {/* Header: Role & Mascot */}
                    <div className={cn(
                        "flex items-center gap-4 mb-6",
                        isEven ? "flex-row-reverse" : "flex-row"
                    )}>
                        {/* Mascot Avatar */}
                        <motion.div
                            variants={{
                                active: { y: [0, -5, 0] }
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="shrink-0"
                        >
                            {agent.mascotAction}
                        </motion.div>

                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                                {agent.role}
                            </h2>
                            <div className={cn(
                                "h-1 w-12 bg-emerald-500/50 rounded-full mt-2",
                                isEven ? "ml-auto" : "mr-auto"
                            )} />
                        </div>
                    </div>

                    {/* Headline */}
                    <p className="text-lg text-emerald-100 font-medium mb-8 leading-relaxed">
                        "{agent.headline}"
                    </p>

                    {/* Visual Widget */}
                    <div className="bg-black/40 rounded-lg p-4 border border-white/5 shadow-inner">
                        {agent.visual}
                    </div>

                    {/* Connector Line (Decorative) */}
                    <div className={cn(
                        "hidden md:block absolute top-1/2 -translate-y-1/2 w-12 h-[1px] bg-gradient-to-r from-emerald-500/50 to-transparent",
                        isEven ? "right-[-48px] rotate-180" : "left-[-48px]"
                    )} />
                </div>
            </motion.div>

        </motion.div>
    );
}
