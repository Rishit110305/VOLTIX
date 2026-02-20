"use client";

import { useState } from "react";
import Link from "next/link";
import { useNotificationCenter } from "../context/NotificationContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Eye, Trash2 } from "lucide-react";
import NotificationItem from "./NotificationItem";

export default function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    clearAllNotifications 
  } = useNotificationCenter();
  
  const [isOpen, setIsOpen] = useState(false);

  // Get the 5 most recent notifications for the dropdown
  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No notifications yet
          </div>
        ) : (
          <>
            <div className="max-h-96 overflow-y-auto">
              {recentNotifications.map((notification) => (
                <div key={notification.id} className="p-2">
                  <NotificationItem 
                    data={notification} 
                    showActions={false}
                    compact={true}
                  />
                </div>
              ))}
            </div>
            
            <DropdownMenuSeparator />
            
            <div className="p-2 space-y-1">
              {unreadCount > 0 && (
                <DropdownMenuItem 
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  Mark all as read
                </DropdownMenuItem>
              )}
              
              {notifications.length > 0 && (
                <DropdownMenuItem 
                  onClick={clearAllNotifications}
                  className="flex items-center gap-2 cursor-pointer text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear all
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <Link href="/dashboard/notifications" onClick={() => setIsOpen(false)}>
                <DropdownMenuItem className="cursor-pointer">
                  View all notifications
                </DropdownMenuItem>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}