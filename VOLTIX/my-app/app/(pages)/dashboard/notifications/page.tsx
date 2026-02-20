"use client";

import { useState } from "react";
import { useNotificationCenter } from "../../../context/NotificationContext";
import NotificationItem from "../../../components/NotificationItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  Trash2, 
  Filter,
  Settings,
  Wifi,
  WifiOff
} from "lucide-react";

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    isConnected,
    isPushEnabled,
    markAllAsRead, 
    clearAllNotifications,
    enablePushNotifications,
    getNotificationsByType
  } = useNotificationCenter();

  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filteredNotifications = notifications.filter(notification => {
    if (filterType !== "all" && notification.type !== filterType) return false;
    if (filterPriority !== "all" && notification.priority !== filterPriority) return false;
    if (showUnreadOnly && notification.read) return false;
    return true;
  });

  const notificationTypes = ["SYSTEM", "AGENT", "ALERT", "INFO", "SUCCESS", "WARNING", "ERROR", "INCENTIVE"];
  const priorities = ["low", "medium", "high", "urgent"];

  const getTypeCount = (type: string) => {
    return getNotificationsByType(type).length;
  };

  const handleEnablePush = async () => {
    await enablePushNotifications();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with system alerts and agent decisions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadCount} unread
            </Badge>
          )}
          
          <div className="flex items-center gap-1 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-red-600">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Manage your notification preferences and filters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Push Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <h3 className="font-semibold">Push Notifications</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive notifications even when the app is closed
              </p>
            </div>
            
            {!isPushEnabled ? (
              <Button onClick={handleEnablePush} className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Enable Push
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Enabled</span>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {notificationTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type} ({getTypeCount(type)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {priorities.map(priority => (
                  <SelectItem key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showUnreadOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            >
              Unread Only
            </Button>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button 
                onClick={markAllAsRead} 
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Mark All Read
              </Button>
              
              <Button 
                onClick={clearAllNotifications} 
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Notifications</span>
            <span className="text-sm font-normal text-gray-500">
              {filteredNotifications.length} of {notifications.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              {notifications.length === 0 ? (
                <>
                  <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You'll see system alerts, agent decisions, and updates here
                  </p>
                </>
              ) : (
                <>
                  <BellOff className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No notifications match your filters</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your filter settings
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {filteredNotifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  data={notification}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Overview</CardTitle>
          <CardDescription>
            Breakdown of notifications by type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="types" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="types">By Type</TabsTrigger>
              <TabsTrigger value="priorities">By Priority</TabsTrigger>
            </TabsList>
            
            <TabsContent value="types" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {notificationTypes.map(type => {
                  const count = getTypeCount(type);
                  return (
                    <div key={type} className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{type}</div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="priorities" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {priorities.map(priority => {
                  const count = notifications.filter(n => n.priority === priority).length;
                  return (
                    <div key={priority} className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {priority}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}