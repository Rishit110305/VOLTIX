"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { connectSocket, getSocket } from "../config/socket";
import { subscribePush, checkPushSubscription } from "../services/pushService";
import { toast } from "sonner";

export interface Notification {
  id: string;
  type:
    | "SYSTEM"
    | "AGENT"
    | "ALERT"
    | "INFO"
    | "SUCCESS"
    | "WARNING"
    | "ERROR"
    | "INCENTIVE";
  title: string;
  message: string;
  timestamp: string;
  priority?: "low" | "medium" | "high" | "urgent";
  category?: string;
  agentType?: string;
  stationId?: string;
  read: boolean;
  meta?: any;
  actionData?: {
    actionType: string;
    actionText: string;
    actionUrl?: string;
    expiresAt?: string;
  };
  incentive?: {
    amount: number;
    type: string;
    validUntil: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isPushEnabled: boolean;
  addNotification: (notification: Omit<Notification, "id" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  enablePushNotifications: () => Promise<boolean>;
  getNotificationsByType: (type: string) => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  useEffect(() => {
    console.log("🔔 NotificationContext: Initializing...");

    // Initialize socket connection
    const socket = connectSocket();
    console.log("🔔 NotificationContext: Socket created");

    // Check push notification status
    checkPushSubscription().then(setIsPushEnabled);

    // Socket event handlers
    const handleConnect = () => {
      console.log("🔔 Notification socket connected");
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log("🔔 Notification socket disconnected");
      setIsConnected(false);
    };

    // Generic notification handler
    const handleNotification = (data: any) => {
      console.log("🔔 New notification received:", data);

      const notification: Omit<Notification, "id" | "read"> = {
        type: data.type || "INFO",
        title: data.title || "Notification",
        message: data.message || "",
        timestamp: data.timestamp || new Date().toISOString(),
        priority: data.priority || "medium",
        category: data.category,
        agentType: data.agentType,
        stationId: data.stationId,
        meta: data.meta,
        actionData: data.actionData,
        incentive: data.incentive,
      };

      addNotification(notification);
      showToast(notification);
    };

    // Agent decision handler
    const handleAgentDecision = (decision: any) => {
      console.log("🤖 Agent decision received:", decision);

      const notification: Omit<Notification, "id" | "read"> = {
        type: "AGENT",
        title: `${decision.agent || decision.agentType} Decision`,
        message:
          decision.explanation || decision.message || "Agent made a decision",
        timestamp: decision.timestamp || new Date().toISOString(),
        priority: decision.priority || "medium",
        category: "agent_decision",
        agentType: decision.agent || decision.agentType,
        stationId: decision.stationId,
        meta: {
          agent: decision.agent || decision.agentType,
          action: decision.action,
          confidence: decision.confidence,
          reasoning: decision.reasoning,
        },
      };

      addNotification(notification);
      showToast(notification);
    };

    // System alert handler
    const handleSystemAlert = (alert: any) => {
      console.log("⚠️ System alert received:", alert);

      const notification: Omit<Notification, "id" | "read"> = {
        type: alert.severity?.toUpperCase() || "ALERT",
        title: alert.title || "System Alert",
        message: alert.message || "",
        timestamp: alert.timestamp || new Date().toISOString(),
        priority: alert.priority || "high",
        category: "system_alert",
        meta: alert.meta,
      };

      addNotification(notification);
      showToast(notification);
    };

    // Station update handler
    const handleStationUpdate = (update: any) => {
      console.log("🔌 Station update received:", update);

      const notification: Omit<Notification, "id" | "read"> = {
        type: "INFO",
        title: `Station ${update.stationId} Update`,
        message: update.message || `Station status changed to ${update.status}`,
        timestamp: update.timestamp || new Date().toISOString(),
        priority: "low",
        category: "station_update",
        stationId: update.stationId,
        meta: {
          stationId: update.stationId,
          status: update.status,
          location: update.location,
        },
      };

      addNotification(notification);
      showToast(notification);
    };

    // Incentive offer handler
    const handleIncentiveOffer = (incentive: any) => {
      console.log("💰 Incentive offer received:", incentive);

      const notification: Omit<Notification, "id" | "read"> = {
        type: "INCENTIVE",
        title: "Special Offer Available!",
        message: `Save ₹${incentive.amount} by switching to a nearby station`,
        timestamp: incentive.timestamp || new Date().toISOString(),
        priority: "high",
        category: "incentive",
        stationId: incentive.stationId,
        incentive: {
          amount: incentive.amount,
          type: incentive.type || "discount_amount",
          validUntil: incentive.validUntil,
        },
        actionData: {
          actionType: "accept_incentive",
          actionText: "Accept Offer",
          expiresAt: incentive.validUntil,
        },
        meta: incentive,
      };

      addNotification(notification);
      showToast(notification);
    };

    // Register socket event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("notification", handleNotification);
    socket.on("agent_decision", handleAgentDecision);
    socket.on("system_alert", handleSystemAlert);
    socket.on("station_update", handleStationUpdate);
    socket.on("incentive_offer", handleIncentiveOffer);

    // Check initial connection status
    if (socket.connected) {
      setIsConnected(true);
    }

    // Cleanup on unmount
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("notification", handleNotification);
      socket.off("agent_decision", handleAgentDecision);
      socket.off("system_alert", handleSystemAlert);
      socket.off("station_update", handleStationUpdate);
      socket.off("incentive_offer", handleIncentiveOffer);
    };
  }, []);

  const addNotification = (
    notificationData: Omit<Notification, "id" | "read">,
  ) => {
    const notification: Notification = {
      ...notificationData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
    };

    setNotifications((prev) => [notification, ...prev]);
  };

  const showToast = (notification: Omit<Notification, "id" | "read">) => {
    const toastOptions = {
      duration:
        notification.priority === "urgent"
          ? 10000
          : notification.priority === "high"
            ? 7000
            : notification.priority === "low"
              ? 3000
              : 5000,
    };

    switch (notification.type) {
      case "SUCCESS":
        toast.success(notification.message, {
          ...toastOptions,
          description: notification.title,
        });
        break;
      case "ERROR":
      case "ALERT":
        toast.error(notification.message, {
          ...toastOptions,
          description: notification.title,
        });
        break;
      case "WARNING":
        toast.warning(notification.message, {
          ...toastOptions,
          description: notification.title,
        });
        break;
      case "INCENTIVE":
        toast.success(`💰 ${notification.message}`, {
          ...toastOptions,
          description: notification.title,
          action: notification.actionData
            ? {
                label: notification.actionData.actionText,
                onClick: () => {
                  // Handle incentive acceptance
                  console.log("Incentive accepted:", notification.incentive);
                },
              }
            : undefined,
        });
        break;
      case "AGENT":
        toast.info(`🤖 ${notification.message}`, {
          ...toastOptions,
          description: notification.title,
        });
        break;
      default:
        toast.info(notification.message, {
          ...toastOptions,
          description: notification.title,
        });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const enablePushNotifications = async (): Promise<boolean> => {
    try {
      const success = await subscribePush();
      if (success) {
        setIsPushEnabled(true);
        toast.success("Push notifications enabled!");
      } else {
        toast.error("Failed to enable push notifications");
      }
      return success;
    } catch (error) {
      console.error("Push subscription error:", error);
      toast.error("Error enabling push notifications");
      return false;
    }
  };

  const getNotificationsByType = (type: string): Notification[] => {
    return notifications.filter((notification) => notification.type === type);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    isPushEnabled,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    enablePushNotifications,
    getNotificationsByType,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationCenter = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotificationCenter must be used within a NotificationProvider",
    );
  }
  return context;
};
