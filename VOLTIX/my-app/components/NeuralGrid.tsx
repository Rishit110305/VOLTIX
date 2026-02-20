"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  Zap,
  ShieldCheck,
  Truck,
  TrafficCone,
  Wrench,
  GitBranch,
  Cpu,
  Database,
  Layers,
  Server,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---

interface Packet {
  id: number;
  path: string; // SVG path d attribute
  color: string;
  delay: number;
}

export default function NeuralGrid() {
  return (
    <section className="relative min-h-[120vh] bg-[#050505] overflow-hidden flex flex-col items-center justify-center py-24 border-t border-neutral-900">
      {/* AMBIENT BACKGROUND - HEX GRID & GLOW */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at center, transparent 0%, #000 100%), 
                                      linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), 
                                      linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
          backgroundSize: "100% 100%, 40px 40px, 40px 40px",
        }}
      />

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl px-4 flex flex-col items-center">
        {/* HEADER */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-900/10 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-4">
            <Activity className="w-3 h-3" />
            System Architecture v3.0
          </div>
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500">
            Neural <span className="text-emerald-500">Pipeline</span>
          </h2>
        </div>

        {/* THE PIPELINE GRID - 3 ZONES */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 relative min-h-[600px]">
          {/* ZONE 1: NEURAL STACK (DATA INGESTION) - COLS 1-3 */}
          <div className="lg:col-span-3 flex flex-col justify-center gap-8 relative z-20">
            {/* Header */}
            <div className="absolute -top-10 left-0 text-xs font-mono text-neutral-500 uppercase flex items-center gap-2">
              <Database className="w-4 h-4" /> Zone 1: Ingestion
            </div>

            {/* Stack 1: Telemetry (Blue) */}
            <ModelStack
              title="Telemetry Stack"
              color="blue"
              layers={["1D CNN", "Temporal Conv1D", "LSTM Encoder"]}
              icon={<Activity className="w-4 h-4" />}
            />

            {/* Stack 2: Request (Purple) */}
            <ModelStack
              title="Request Stack"
              color="purple"
              layers={["Embedding", "Transformer", "Mean Pooling"]}
              icon={<Server className="w-4 h-4" />}
            />

            {/* Stack 3: Forecast (Orange) */}
            <ModelStack
              title="Forecast Stack"
              color="amber"
              layers={["Dense Layer", "GRU Encoder"]}
              icon={<Zap className="w-4 h-4" />}
            />
          </div>

          {/* ZONE 2: FUSION CORE (THE BRAIN) - COLS 4-9 */}
          <div className="lg:col-span-6 flex items-center justify-center relative z-20">
            <div className="absolute -top-10 text-xs font-mono text-neutral-500 uppercase flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Zone 2: Fusion Core
            </div>

            {/* The Core Container */}
            <div className="relative w-full h-[400px] flex items-center justify-center">
              {/* Redis Cache Loop (Orbiting Particles) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-[300px] h-[300px] rounded-full border border-neutral-800 border-dashed"
                />
                {/* Orbiting Data Point */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute w-[300px] h-[300px]"
                >
                  <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981] absolute top-1/2 right-0 -translate-y-1/2" />
                </motion.div>
                <div className="absolute top-[15%] text-[10px] font-mono text-emerald-500/50">
                  State Cache (Redis)
                </div>
              </div>

              {/* Main Core Node */}
              <div className="w-40 h-40 bg-black/80 backdrop-blur-xl border border-emerald-500/30 rounded-full flex flex-col items-center justify-center relative z-10 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                <Bot className="w-10 h-10 text-emerald-400 mb-2" />
                <div className="text-center">
                  <div className="text-xs font-bold text-white">FUSION</div>
                  <div className="text-[10px] text-emerald-400 font-mono">
                    LangGraph Core
                  </div>
                </div>
                {/* Pulse Effect */}
                <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-ping-slow" />
              </div>
            </div>
          </div>

          {/* ZONE 3: SUPERVISOR BRANCHING (EXECUTION) - COLS 10-12 */}
          <div className="lg:col-span-3 flex flex-col justify-center relative z-20 pl-8">
            <div className="absolute -top-10 left-8 text-xs font-mono text-neutral-500 uppercase flex items-center gap-2">
              <GitBranch className="w-4 h-4" /> Zone 3: Execution
            </div>

            {/* Decision Tree Root */}
            <div className="flex items-center gap-4 mb-20 relative">
              <div className="w-12 h-12 bg-neutral-900 border border-neutral-700 rounded-lg flex items-center justify-center shrink-0 relative z-10">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-xs font-mono text-neutral-400">
                <div>POLICY HEAD</div>
                <div className="text-emerald-500">Router v2</div>
              </div>
            </div>

            {/* Agent Outputs */}
            <div className="flex flex-col gap-6 relative">
              {/* Vertical Line for Tree */}
              <div className="absolute left-[23px] top-[-60px] bottom-[20px] w-px bg-neutral-800 -z-10" />

              <AgentBranch
                icon={<Wrench />}
                label="Mechanic"
                color="text-red-400"
                border="border-red-500/30"
              />
              <AgentBranch
                icon={<TrafficCone />}
                label="Traffic"
                color="text-purple-400"
                border="border-purple-500/30"
              />
              <AgentBranch
                icon={<Truck />}
                label="Logistics"
                color="text-blue-400"
                border="border-blue-500/30"
              />
              <AgentBranch
                icon={<Zap />}
                label="Energy"
                color="text-amber-400"
                border="border-amber-500/30"
              />
              <AgentBranch
                icon={<ShieldCheck />}
                label="Auditor"
                color="text-neutral-400"
                border="border-neutral-500/30"
              />
            </div>
          </div>

          {/* --- ANIMATION LAYER (SVG) --- */}
          {/* --- ANIMATION LAYER (SVG) --- */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
            <defs>
              <filter id="glow-cyan">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feFlood
                  floodColor="#06b6d4"
                  floodOpacity="0.8"
                  result="color"
                />
                <feComposite
                  in="color"
                  in2="coloredBlur"
                  operator="in"
                  result="coloredBlur"
                />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-purple">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feFlood
                  floodColor="#a855f7"
                  floodOpacity="0.8"
                  result="color"
                />
                <feComposite
                  in="color"
                  in2="coloredBlur"
                  operator="in"
                  result="coloredBlur"
                />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-white">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feFlood
                  floodColor="#ffffff"
                  floodOpacity="0.8"
                  result="color"
                />
                <feComposite
                  in="color"
                  in2="coloredBlur"
                  operator="in"
                  result="coloredBlur"
                />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* --- CONNECTION A: INGESTION -> FUSION --- */}
            {/* Path 1: Telemetry (Blue) */}
            <path
              d="M 15% 25% C 25% 25%, 35% 50%, 50% 50%"
              stroke="#3b82f6"
              strokeWidth="1"
              fill="none"
              className="opacity-30"
            />

            {/* Path 2: Request (Purple) */}
            <path
              d="M 15% 50% L 50% 50%"
              stroke="#a855f7"
              strokeWidth="1"
              fill="none"
              className="opacity-30"
            />

            {/* Path 3: Forecast (Orange) */}
            <path
              d="M 15% 75% C 25% 75%, 35% 50%, 50% 50%"
              stroke="#f97316"
              strokeWidth="1"
              fill="none"
              className="opacity-30"
            />

            {/* --- CONNECTION C: FUSION -> EXECUTION --- */}
            {/* Trunk: Core -> Router */}
            <path
              d="M 50% 50% C 60% 50%, 60% 20%, 75% 20%"
              stroke="#10b981"
              strokeWidth="1"
              fill="none"
              className="opacity-40"
            />

            {/* Branches: Router -> Agents */}
            {/* To Mechanic */}
            <path
              d="M 75% 20% L 90% 25%"
              stroke="#ef4444"
              strokeWidth="1"
              fill="none"
              className="opacity-30"
            />

            {/* To Traffic */}
            <path
              d="M 75% 20% C 80% 20%, 80% 35%, 90% 35%"
              stroke="#a855f7"
              strokeWidth="1"
              fill="none"
              className="opacity-30"
            />

            {/* To Logistics */}
            <path
              d="M 75% 20% C 80% 20%, 80% 50%, 90% 50%"
              stroke="#3b82f6"
              strokeWidth="1"
              fill="none"
              className="opacity-30"
            />

            {/* To Energy */}
            <path
              d="M 75% 20% C 80% 20%, 80% 65%, 90% 65%"
              stroke="#f59e0b"
              strokeWidth="1"
              fill="none"
              className="opacity-30"
            />

            {/* To Auditor */}
            <path
              d="M 75% 20% C 80% 20%, 80% 80%, 90% 80%"
              stroke="#737373"
              strokeWidth="1"
              fill="none"
              className="opacity-30"
            />

            {/* --- ANIMATIONS: DATA PACKETS --- */}

            {/* Route 1: Sensor Data (Cyan) - Telemetry -> Core -> Router -> Mechanic */}
            <motion.circle
              r="4"
              fill="#06b6d4"
              filter="url(#glow-cyan)"
              style={{
                offsetPath:
                  'path("M 15% 25% C 25% 25%, 35% 50%, 50% 50% C 60% 50%, 60% 20%, 75% 20% L 90% 25%")',
              }}
              animate={{ offsetDistance: ["0%", "100%"] }}
              transition={{
                duration: 4,
                ease: "linear",
                repeat: Infinity,
                repeatDelay: 1,
              }}
            />

            {/* Route 2: User Request (Purple) - Request -> Core -> Router -> Traffic */}
            <motion.circle
              r="4"
              fill="#d8b4fe"
              filter="url(#glow-purple)"
              style={{
                offsetPath:
                  'path("M 15% 50% L 50% 50% C 60% 50%, 60% 20%, 75% 20% C 80% 20%, 80% 35%, 90% 35%")',
              }}
              animate={{ offsetDistance: ["0%", "100%"] }}
              transition={{
                duration: 3,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 0.5,
                delay: 1,
              }} // Offset start
            />

            {/* Route 3: Audit Log (White) - Core -> Router -> Auditor */}
            <motion.circle
              r="3"
              fill="#ffffff"
              filter="url(#glow-white)"
              style={{
                offsetPath:
                  'path("M 50% 50% C 60% 50%, 60% 20%, 75% 20% C 80% 20%, 80% 80%, 90% 80%")',
              }}
              animate={{ offsetDistance: ["0%", "100%"] }}
              transition={{
                duration: 5,
                ease: "linear",
                repeat: Infinity,
                repeatDelay: 0,
                delay: 2,
              }}
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

// --- SUB-COMPONENTS ---

function ModelStack({
  title,
  color,
  layers,
  icon,
}: {
  title: string;
  color: "blue" | "purple" | "amber" | "gray";
  layers: string[];
  icon: any;
}) {
  const colors = {
    blue: "text-blue-400 border-blue-500/20 bg-blue-500/5",
    purple: "text-purple-400 border-purple-500/20 bg-purple-500/5",
    amber: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    gray: "text-neutral-400 border-neutral-500/20 bg-neutral-500/5",
  };

  const dotColors = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
    gray: "bg-neutral-500",
  };

  return (
    <div className="w-full max-w-[280px] group">
      <div className="flex items-center gap-2 mb-3 px-1">
        {icon}
        <span
          className={cn(
            "text-xs font-bold uppercase tracking-wider",
            colors[color].split(" ")[0],
          )}
        >
          {title}
        </span>
      </div>

      <div className="flex flex-col-reverse gap-2">
        {layers.map((layer, i) => (
          <div
            key={i}
            className={cn(
              "w-full p-3 rounded-lg border backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
              colors[color],
            )}
          >
            <div className="flex justify-between items-center z-10 relative">
              <span className="text-[10px] font-mono opacity-80">{layer}</span>
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  dotColors[color],
                )}
              />
            </div>

            {/* Scanline Effect */}
            <motion.div
              className={cn("absolute inset-0 opacity-10", dotColors[color])}
              animate={{ top: ["100%", "-100%"] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "linear",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentBranch({ icon, label, color, border }: any) {
  return (
    <div className="flex items-center gap-4 relative group">
      <div className="w-6 h-px bg-neutral-800 group-hover:bg-neutral-600 transition-colors" />{" "}
      {/* Horizontal connector */}
      <div
        className={cn(
          "relative flex items-center gap-3 p-2 pr-4 rounded-full border bg-black/50 backdrop-blur-sm transition-all duration-300 hover:bg-neutral-900",
          border,
        )}
      >
        <div
          className={cn(
            "text-neutral-400 group-hover:text-white transition-colors",
          )}
        >
          {icon}
        </div>
        <span
          className={cn("text-xs font-mono font-bold transition-colors", color)}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function Particle({
  path,
  color,
  delay,
  duration,
}: {
  path: string;
  color: string;
  delay: number;
  duration: number;
}) {
  return (
    <motion.path
      d={path}
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{
        pathLength: [0, 0.3, 0],
        opacity: [0, 1, 0],
        pathOffset: [0, 1],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "linear",
        delay: delay,
      }}
    />
  );
}
