"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, AlertTriangle, DollarSign, CheckCircle, TrendingUp, 
  Wrench, Zap, Package, Activity, Shield, Bell
} from "lucide-react";
import { connectSocket } from "@/app/config/socket";

interface AgentNotification {
  id: string;
  type: string;
  agent: string;
  title: string;
  message: string;
  icon: any;
  color: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: number;
  priority?: string;
}

const AGENT_CONFIGS = {
  mechanic: {
    icon: Wrench,
    color: "from-blue-500 to-cyan-500",
    emoji: "🔧"
  },
  traffic: {
    icon: TrendingUp,
    color: "from-purple-500 to-pink-500",
    emoji: "🚦"
  },
  logistics: {
    icon: Package,
    color: "from-orange-500 to-red-500",
    emoji: "📦"
  },
  energy: {
    icon: Zap,
    color: "from-yellow-500 to-amber-500",
    emoji: "⚡"
  },
  auditor: {
    icon: Shield,
    color: "from-green-500 to-emerald-500",
    emoji: "🛡️"
  },
  system: {
    icon: Bell,
    color: "from-gray-500 to-slate-500",
    emoji: "🔔"
  }
};

export default function UnifiedNotificationToast() {
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);

  useEffect(() => {
    const socket = connectSocket();

    // Listen for agent decisions
    socket.on("agent-decision", (data: any) => {
      console.log("🤖 Agent decision received:", data);
      
      const agentConfig = AGENT_CONFIGS[data.agent as keyof typeof AGENT_CONFIGS] || AGENT_CONFIGS.system;
      
      const notification: AgentNotification = {
        id: `agent-${data.agent}-${Date.now()}`,
        type: "agent_decision",
        agent: data.agent,
        title: `${agentConfig.emoji} ${data.agent.charAt(0).toUpperCase() + data.agent.slice(1)} Agent`,
        message: `${data.decision?.action || "Decision made"} at Station ${data.stationId} (${((data.decision?.confidence || 0) * 100).toFixed(0)}% confidence)`,
        icon: agentConfig.icon,
        color: agentConfig.color,
        timestamp: Date.now(),
        priority: data.decision?.impact?.riskScore > 0.7 ? "high" : "medium"
      };
      
      addNotification(notification);
    })