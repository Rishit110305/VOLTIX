"use client";

import { useNotificationCenter } from "../context/NotificationContext";
import NotificationItem from "./NotificationItem";
import { Loader2, BellOff, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsList() {
  const { notifications, markAllAsRead, clearAllNotifications, unreadCount } =
    useNotificationCenter();

  if (!notifications) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
          <BellOff className="h-8 w-8 text-gray-400" />
        </div>
        <p className="font-medium text-lg text-gray-700 dark:text-gray-300">
          No notifications yet
        </p>
        <p className="text-sm text-gray-500 max-w-xs text-center mt-1">
          You're all caught up! updates from agents and system alerts will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Toolbar */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="text-sm text-gray-500">
          You have{" "}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {unreadCount}
          </span>{" "}
          unread notifications
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
              onClick={clearAllNotifications}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
            >
              <NotificationItem data={notification} showActions={true} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
