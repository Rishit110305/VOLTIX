"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  TrendingUp,
  Zap,
} from "lucide-react";
import { connectSocket } from "@/app/config/socket";

interface TrafficNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  icon: any;
  color: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: number;
}

export default function TrafficNotificationToast() {
  const [notifications, setNotifications] = useState<TrafficNotification[]>([]);

  useEffect(() => {
    const socket = connectSocket();

    // Color palettes for coupons
    const couponColors = [
      "from-amber-500 to-orange-500",
      "from-emerald-500 to-green-600",
      "from-violet-500 to-purple-600",
      "from-blue-500 to-cyan-500",
      "from-rose-500 to-pink-600",
    ];

    const getRandomColor = () =>
      couponColors[Math.floor(Math.random() * couponColors.length)];

    // Generate mock coupons on mount
    const generateMockCoupons = () => {
      const mockCoupons: TrafficNotification[] = [
        {
          id: `mock-1-${Date.now()}`,
          type: "incentive",
          title: "⚡ Flash Deal: 50% Off",
          message:
            "Charge at Station ST005 in the next 30 mins and save ₹120. Low traffic detected!",
          icon: DollarSign,
          color: getRandomColor(),
          timestamp: Date.now(),
          action: {
            label: "Claim Offer",
            onClick: () => console.log("Claimed mock offer 1"),
          },
        },
        {
          id: `mock-2-${Date.now()}`,
          type: "incentive",
          title: "🔋 Green Energy Bonus",
          message:
            "Excess solar power at Station ST008. Get 20% cashback for charging now.",
          icon: Zap,
          color: getRandomColor(),
          timestamp: Date.now() - 1000 * 60 * 5, // 5 mins ago
          action: {
            label: "View Details",
            onClick: () => console.log("Viewed mock offer 2"),
          },
        },
        {
          id: `mock-3-${Date.now()}`,
          type: "incentive",
          title: "🛣️ Route Optimization Reward",
          message:
            "Avoid downtown congestion. Reroute to ST002 for a ₹50 credit instantly.",
          icon: TrendingUp,
          color: getRandomColor(),
          timestamp: Date.now() - 1000 * 60 * 12,
          action: {
            label: "Reroute & Save",
            onClick: () => console.log("Rerouted for savings"),
          },
        },
      ];

      setNotifications((prev) => [...prev, ...mockCoupons]);
    };

    generateMockCoupons();

    // Listen for traffic incentives
    socket.on("traffic-incentive", (data: any) => {
      const notification: TrafficNotification = {
        id: `incentive-${Date.now()}`,
        type: "incentive",
        title: "💰 Better Option Available!",
        message: `Save ${data.incentive?.timeSavedMinutes || 0}min and get ₹${data.incentive?.totalCost || 0} off at ${data.stationName}`,
        icon: DollarSign,
        color: getRandomColor(),
        action: {
          label: "View Details",
          onClick: () => {
            console.log("Show incentive details:", data);
          },
        },
        timestamp: Date.now(),
      };

      setNotifications((prev) => [...prev, notification]);

      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id),
        );
      }, 15000); // Increased timeout for visibility
    });

    // Listen for traffic alerts
    socket.on("traffic-alert", (data: any) => {
      const notification: TrafficNotification = {
        id: `alert-${Date.now()}`,
        type: "alert",
        title: "🚦 Traffic Update",
        message: `${data.stationName}: ${data.action?.replace(/_/g, " ") || "Update"} (${((data.confidence || 0) * 100).toFixed(0)}% confidence)`,
        icon: TrendingUp,
        color: "from-blue-500 to-cyan-500",
        timestamp: Date.now(),
      };

      setNotifications((prev) => [...prev, notification]);

      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id),
        );
      }, 8000);
    });

    // Listen for decision confirmations
    socket.on("decision-logged", (data: any) => {
      if (data.agent === "TrafficAgent") {
        const notification: TrafficNotification = {
          id: `decision-${Date.now()}`,
          type: "decision",
          title: "✅ Decision Logged",
          message: `Traffic decision recorded on blockchain (${data.blockchainTxHash?.slice(0, 10)}...)`,
          icon: CheckCircle,
          color: "from-green-500 to-emerald-500",
          timestamp: Date.now(),
        };

        setNotifications((prev) => [...prev, notification]);

        setTimeout(() => {
          setNotifications((prev) =>
            prev.filter((n) => n.id !== notification.id),
          );
        }, 6000);
      }
    });

    return () => {
      socket.off("traffic-incentive");
      socket.off("traffic-alert");
      socket.off("decision-logged");
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-md pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = notification.icon;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className={`bg-gradient-to-r ${notification.color} text-white rounded-2xl shadow-2xl p-4 backdrop-blur-sm pointer-events-auto`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm mb-1">
                    {notification.title}
                  </h4>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {notification.message}
                  </p>

                  {notification.action && (
                    <button
                      onClick={notification.action.onClick}
                      className="mt-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
                    >
                      {notification.action.label}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
