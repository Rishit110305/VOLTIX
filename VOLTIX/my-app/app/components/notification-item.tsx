"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Settings,
  ShieldAlert,
  Wallet,
  Zap,
  ArrowUpRight,
  Info,
} from "lucide-react";

export type NotificationType =
  | "system"
  | "alert"
  | "payment"
  | "energy"
  | "info"
  | "success";

interface NotificationItemProps {
  id: string;
  title: string;
  description: string;
  time: string;
  type: NotificationType;
  isUnread?: boolean;
  onClick?: () => void;
}

const getIcon = (type: NotificationType) => {
  switch (type) {
    case "system":
      return (
        <Settings size={20} className="text-blue-500 dark:text-blue-400" />
      );
    case "alert":
      return (
        <ShieldAlert size={20} className="text-red-500 dark:text-red-400" />
      );
    case "payment":
      return (
        <Wallet size={20} className="text-purple-500 dark:text-purple-400" />
      );
    case "energy":
      return <Zap size={20} className="text-yellow-500 dark:text-yellow-400" />;
    case "success":
      return (
        <ArrowUpRight
          size={20}
          className="text-green-500 dark:text-green-400"
        />
      );
    default:
      return <Info size={20} className="text-gray-500 dark:text-gray-400" />;
  }
};

const getIconBg = (type: NotificationType) => {
  switch (type) {
    case "system":
      return "bg-blue-50/80 dark:bg-blue-500/10";
    case "alert":
      return "bg-red-50/80 dark:bg-red-500/10";
    case "payment":
      return "bg-purple-50/80 dark:bg-purple-500/10";
    case "energy":
      return "bg-yellow-50/80 dark:bg-yellow-500/10";
    case "success":
      return "bg-green-50/80 dark:bg-green-500/10";
    default:
      return "bg-gray-50/80 dark:bg-gray-700/30";
  }
};

export default function NotificationItem({
  title,
  description,
  time,
  type,
  isUnread,
  onClick,
}: NotificationItemProps) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`relative p-4 mb-3 backdrop-blur-sm rounded-2xl flex gap-4 transition-all hover:shadow-lg cursor-pointer ${
        isUnread
          ? "bg-green-50/30 border border-green-100 dark:bg-slate-800/60 dark:border-green-800/30"
          : "bg-white/50 border border-transparent dark:bg-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-800/60"
      }`}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getIconBg(type)}`}
      >
        {getIcon(type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4
            className={`font-semibold text-sm truncate pr-2 ${
              isUnread
                ? "text-black dark:text-white"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {title}
          </h4>
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-medium">
            {time}
          </span>
        </div>

        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Unread Indicator */}
      {isUnread && (
        <div className="absolute top-5 right-4 w-2 h-2 rounded-full bg-blue-500/80 dark:bg-blue-400/70" />
      )}
    </motion.div>
  );
}
