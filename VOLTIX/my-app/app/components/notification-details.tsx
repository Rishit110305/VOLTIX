"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Settings,
  ShieldAlert,
  Wallet,
  Zap,
  ArrowUpRight,
  Info,
  Calendar,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { NotificationType } from "./notification-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NotificationDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  notification: {
    id: string;
    title: string;
    description: string;
    time: string;
    type: NotificationType;
    isUnread?: boolean;
    // Extended details (mocked for now)
    agent?: string;
    location?: string;
    status?: string;
  } | null;
}

const getIcon = (type: NotificationType) => {
  switch (type) {
    case "system":
      return <Settings size={32} className="text-blue-500" />;
    case "alert":
      return <ShieldAlert size={32} className="text-red-500" />;
    case "payment":
      return <Wallet size={32} className="text-purple-500" />;
    case "energy":
      return <Zap size={32} className="text-yellow-500" />;
    case "success":
      return <ArrowUpRight size={32} className="text-green-500" />;
    default:
      return <Info size={32} className="text-gray-500" />;
  }
};

const getIconBg = (type: NotificationType) => {
  switch (type) {
    case "system":
      return "bg-blue-50 dark:bg-blue-900/20";
    case "alert":
      return "bg-red-50 dark:bg-red-900/20";
    case "payment":
      return "bg-purple-50 dark:bg-purple-900/20";
    case "energy":
      return "bg-yellow-50 dark:bg-yellow-900/20";
    case "success":
      return "bg-green-50 dark:bg-green-900/20";
    default:
      return "bg-gray-50 dark:bg-gray-800";
  }
};

export default function NotificationDetails({
  isOpen,
  onClose,
  notification,
}: NotificationDetailsProps) {
  if (!notification) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md w-[400px]">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-left flex items-center gap-3">
            Notification Details
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-gray-50 dark:bg-muted/50 border border-dashed border-gray-200 dark:border-gray-700">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm ${getIconBg(notification.type)}`}
            >
              {getIcon(notification.type)}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {notification.title}
            </h2>
            <div className="flex gap-2 justify-center">
              <Badge variant="secondary" className="capitalize">
                {notification.type}
              </Badge>
              {notification.isUnread && (
                <Badge
                  variant="outline"
                  className="border-green-500 text-green-500"
                >
                  New
                </Badge>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Description
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {notification.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-muted/30">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Clock size={14} />
                  <span className="text-xs">Time</span>
                </div>
                <p className="font-medium text-sm">{notification.time}</p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-muted/30">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar size={14} />
                  <span className="text-xs">Date</span>
                </div>
                <p className="font-medium text-sm">Today</p>
              </div>
            </div>

            {/* Contextual Actions */}
            <div className="pt-6">
              <Button className="w-full rounded-xl gap-2 font-medium" size="lg">
                <CheckCircle2 size={18} />
                Mark as Read & Archive
              </Button>
            </div>

            {/* AI Insight (Mock) */}
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center gap-2 mb-2">
                <Zap
                  size={16}
                  className="text-indigo-500 dark:text-indigo-400"
                />
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  VOLTIX AI INSIGHT
                </span>
              </div>
              <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
                This notification suggests optimal system performance. Pattern
                analysis shows a 12% improvement over last week.
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
