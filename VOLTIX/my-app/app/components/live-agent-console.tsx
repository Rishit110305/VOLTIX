"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Car,
  Activity,
  Shield,
  Zap,
  Play,
  RotateCcw,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Cpu,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { io, Socket } from "socket.io-client";

interface AgentActivity {
  step: number;
  action: string;
  agent: string;
  status: string;
  message: string;
  timestamp: string;
  details?: any;
  context?: any;
  confidence?: number;
  autonomyLevel?: number;
  result?: any;
  txHash?: string;
}

interface Notification {
  type: string;
  title: string;
  message: string;
  agentType?: string;
  priority?: string;
  timestamp: string;
}

const agentIcons: Record<string, React.ElementType> = {
  MechanicAgent: Wrench,
  TrafficAgent: Car,
  LogisticsAgent: Activity,
  EnergyAgent: Zap,
  AuditorAgent: Shield,
  SupervisorAgent: Cpu,
};

const agentColors: Record<string, string> = {
  MechanicAgent: "text-orange-500 bg-orange-500/10 border-orange-500/30",
  TrafficAgent: "text-blue-500 bg-blue-500/10 border-blue-500/30",
  LogisticsAgent: "text-purple-500 bg-purple-500/10 border-purple-500/30",
  EnergyAgent: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
  AuditorAgent: "text-green-500 bg-green-500/10 border-green-500/30",
  SupervisorAgent: "text-pink-500 bg-pink-500/10 border-pink-500/30",
};

const statusIcons: Record<string, React.ElementType> = {
  detecting: AlertTriangle,
  analyzing: Loader2,
  decided: CheckCircle2,
  healing: Sparkles,
  executing: Loader2,
  success: CheckCircle2,
  failed: XCircle,
  completed: CheckCircle2,
  coordinating: Activity,
};

export default function LiveAgentConsole() {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string>("self-healing");
  const [socket, setSocket] = useState<Socket | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  const backendUrl = "https://voltix-nliu.onrender.com";

  // Connect to socket for real-time updates
  useEffect(() => {
    const newSocket = io(backendUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("Connected to agent console socket");
    });

    newSocket.on("agent_activity", (activity: AgentActivity) => {
      setActivities((prev) => [...prev, activity]);
    });

    newSocket.on("notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
    });

    newSocket.on("driver_notification", (notification: any) => {
      setNotifications((prev) =>
        [
          {
            type: "INCENTIVE",
            title: notification.title,
            message: `${notification.offer?.discount} - ${notification.offer?.timeSaved}`,
            agentType: "traffic",
            priority: "high",
            timestamp: notification.timestamp,
          },
          ...prev,
        ].slice(0, 10),
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [backendUrl]);

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [activities]);

  const runDemo = async (demoType: string) => {
    setIsRunning(true);
    setActivities([]);

    // Debug: Log the backend URL being used
    console.log("🔍 Demo Debug Info:");
    console.log("  Backend URL:", backendUrl);
    console.log("  Demo Type:", demoType);
    console.log("  Env Variable:", process.env.NEXT_PUBLIC_API_URL);

    try {
      let endpoint = "";
      let body = {};

      switch (demoType) {
        case "self-healing":
          endpoint = `${backendUrl}/api/demo/mechanic/self-healing`;
          body = { stationId: "ST001", faultType: "protocol_timeout" };
          break;
        case "self-healing-overheat":
          endpoint = `${backendUrl}/api/demo/mechanic/self-healing`;
          body = { stationId: "ST002", faultType: "overheating" };
          break;
        case "traffic-incentive":
          endpoint = `${backendUrl}/api/demo/traffic/incentive-engine`;
          body = { stationId: "ST001", queueLength: 12, waitTime: 18 };
          break;
        case "super-scenario":
          endpoint = `${backendUrl}/api/demo/multi-agent/super-scenario`;
          body = {};
          break;
        default:
          endpoint = `${backendUrl}/api/demo/mechanic/self-healing`;
          body = { stationId: "ST001", faultType: "protocol_timeout" };
      }

      console.log("  Endpoint:", endpoint);
      console.log("  Request Body:", body);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        mode: 'cors',
      });

      console.log("  Response Status:", response.status);
      console.log("  Response OK:", response.ok);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Demo result:", result);
    } catch (error) {
      console.error("❌ Demo error:", error);
      console.error("  Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      setNotifications((prev) => [
        {
          type: "ERROR",
          title: "Demo Failed",
          message: `Could not connect to backend: ${error.message}`,
          priority: "urgent",
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const clearConsole = () => {
    setActivities([]);
    setNotifications([]);
  };

  const demoScenarios = [
    {
      id: "self-healing",
      name: "Self-Healing Agent",
      description: "Protocol Timeout Fix",
      agent: "MechanicAgent",
      icon: Wrench,
      badge: "Level 5",
    },
    {
      id: "self-healing-overheat",
      name: "Thermal Recovery",
      description: "Overheating Auto-Fix",
      agent: "MechanicAgent",
      icon: Wrench,
      badge: "Level 5",
    },
    {
      id: "traffic-incentive",
      name: "Traffic Controller",
      description: "Dynamic Incentives",
      agent: "TrafficAgent",
      icon: Car,
      badge: "Level 5",
    },
    {
      id: "super-scenario",
      name: "Super Scenario",
      description: "Multi-Agent Crisis",
      agent: "SupervisorAgent",
      icon: Cpu,
      badge: "All Agents",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Demo Controls */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="bg-linear-to-br from-gray-900/95 to-gray-800/95 border-gray-700/50 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Agent Demo Scenarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoScenarios.map((scenario) => {
              const Icon = scenario.icon;
              const isSelected = selectedDemo === scenario.id;
              return (
                <motion.button
                  key={scenario.id}
                  onClick={() => setSelectedDemo(scenario.id)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    isSelected
                      ? "bg-purple-500/20 border-purple-500/50"
                      : "bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50",
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        agentColors[scenario.agent],
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {scenario.name}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {scenario.description}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-purple-400 border-purple-500/50"
                    >
                      {scenario.badge}
                    </Badge>
                  </div>
                </motion.button>
              );
            })}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => runDemo(selectedDemo)}
                disabled={isRunning}
                className="flex-1 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isRunning ? "Running..." : "Run Demo"}
              </Button>
              <Button
                onClick={clearConsole}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Notifications */}
        <Card className="bg-linear-to-br from-gray-900/95 to-gray-800/95 border-gray-700/50 backdrop-blur-xl max-h-75 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-green-400 animate-pulse" />
              Live Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-55 space-y-2">
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={`${notification.timestamp}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    "p-3 rounded-lg border text-sm",
                    notification.type === "SUCCESS"
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : notification.type === "ERROR"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : notification.type === "WARNING"
                          ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                          : notification.type === "INCENTIVE"
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                            : "bg-gray-700/50 border-gray-600/50 text-gray-300",
                  )}
                >
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-xs opacity-80">
                    {notification.message}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {notifications.length === 0 && (
              <div className="text-gray-500 text-center py-4 text-sm">
                Waiting for agent activity...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Live Console */}
      <div className="lg:col-span-2">
        <Card className="bg-linear-to-br from-gray-900/98 to-black/95 border-gray-700/50 backdrop-blur-xl h-full">
          <CardHeader className="pb-2 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Terminal className="h-5 w-5 text-green-400" />
                Live Agent Console
                {isRunning && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50 animate-pulse">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Running
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={consoleRef}
              className="font-mono text-sm p-4 h-125 overflow-y-auto bg-black/50"
            >
              {/* Welcome message */}
              <div className="text-gray-500 mb-4">
                <span className="text-green-400">{">"}</span> VOLTIX Agent
                System v1.0.0
                <br />
                <span className="text-green-400">{">"}</span> Autonomous Agent
                Orchestration Ready
                <br />
                <span className="text-green-400">{">"}</span> Select a demo
                scenario and click "Run Demo"
                <br />
                <span className="text-gray-600">
                  ─────────────────────────────────────────────────
                </span>
              </div>

              {/* Activity log */}
              <AnimatePresence>
                {activities.map((activity, index) => {
                  const AgentIcon = agentIcons[activity.agent] || Activity;
                  const StatusIcon =
                    statusIcons[activity.status] || ChevronRight;
                  const colorClass =
                    agentColors[activity.agent] || "text-gray-400";

                  return (
                    <motion.div
                      key={`${activity.timestamp}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-gray-600 text-xs w-20 shrink-0">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                        <div className={cn("p-1 rounded", colorClass)}>
                          <AgentIcon className="h-3 w-3" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-semibold",
                                colorClass.split(" ")[0],
                              )}
                            >
                              [{activity.agent}]
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                activity.status === "success"
                                  ? "border-green-500/50 text-green-400"
                                  : activity.status === "failed"
                                    ? "border-red-500/50 text-red-400"
                                    : "border-gray-600 text-gray-400",
                              )}
                            >
                              <StatusIcon
                                className={cn(
                                  "h-3 w-3 mr-1",
                                  (activity.status === "analyzing" ||
                                    activity.status === "executing" ||
                                    activity.status === "healing") &&
                                    "animate-spin",
                                )}
                              />
                              {activity.action}
                            </Badge>
                          </div>
                          <div className="text-gray-300 mt-1">
                            {activity.message}
                          </div>

                          {/* Extra details */}
                          {activity.confidence !== undefined && (
                            <div className="text-xs text-gray-500 mt-1">
                              Confidence:{" "}
                              {(activity.confidence * 100).toFixed(1)}% |
                              Autonomy Level: {activity.autonomyLevel}
                            </div>
                          )}
                          {activity.txHash && (
                            <div className="text-xs text-green-500 mt-1 flex items-center gap-1">
                              <LinkIcon className="h-3 w-3" />
                              Blockchain TX: {activity.txHash.slice(0, 20)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Cursor */}
              {!isRunning && activities.length > 0 && (
                <div className="text-gray-500">
                  <span className="text-green-400">{">"}</span>{" "}
                  <span className="animate-pulse">_</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
