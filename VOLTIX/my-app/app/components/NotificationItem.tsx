"use client";

import { useState } from "react";
import { useNotificationCenter, Notification } from "../context/NotificationContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  Trash2, 
  AlertCircle, 
  Info, 
  Zap, 
  DollarSign,
  Clock,
  MapPin
} from "lucide-react";

interface NotificationItemProps {
  data: Notification;
  showActions?: boolean;
  compact?: boolean;
}

export default function NotificationItem({ 
  data, 
  showActions = true, 
  compact = false 
}: NotificationItemProps) {
  const { markAsRead, clearNotification } = useNotificationCenter();
  const [isExpanded, setIsExpanded] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "ERROR":
      case "ALERT":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "WARNING":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "AGENT":
        return <Zap className="h-4 w-4 text-blue-500" />;
      case "INCENTIVE":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
      case "ERROR":
      case "ALERT":
        return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
      case "WARNING":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800";
      case "AGENT":
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";
      case "INCENTIVE":
        return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const isExpired = () => {
    if (data.actionData?.expiresAt) {
      return new Date() > new Date(data.actionData.expiresAt);
    }
    if (data.incentive?.validUntil) {
      return new Date() > new Date(data.incentive.validUntil);
    }
    return false;
  };

  const handleActionClick = () => {
    if (data.actionData?.actionType === 'accept_incentive') {
      // Handle incentive acceptance
      console.log('Accepting incentive:', data.incentive);
      // You can add API call here to accept the incentive
    }
  };

  return (
    <Card 
      className={`${getNotificationColor(data.type)} ${
        !data.read ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
      } ${compact ? 'p-2' : 'p-4'} transition-all duration-200 hover:shadow-md`}
    >
      <CardContent className={compact ? "p-2" : "p-4"}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {getNotificationIcon(data.type)}
            
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className={`font-semibold ${compact ? 'text-sm' : 'text-base'} truncate`}>
                  {data.title}
                </h4>
                
                <Badge variant="outline" className="text-xs">
                  {data.type}
                </Badge>
                
                {data.priority && data.priority !== 'medium' && (
                  <Badge variant={getPriorityColor(data.priority)} className="text-xs">
                    {data.priority}
                  </Badge>
                )}
                
                {!data.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>

              {/* Message */}
              <p className={`text-gray-600 dark:text-gray-300 mb-2 ${
                compact ? 'text-sm' : 'text-base'
              }`}>
                {data.message}
              </p>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(data.timestamp)}
                </span>
                
                {data.stationId && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {data.stationId}
                  </span>
                )}
                
                {data.category && (
                  <span className="capitalize">
                    {data.category.replace('_', ' ')}
                  </span>
                )}
                
                {data.agentType && (
                  <span className="capitalize">
                    {data.agentType} Agent
                  </span>
                )}
              </div>

              {/* Incentive Details */}
              {data.incentive && (
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-700 dark:text-green-300">
                      Save ₹{data.incentive.amount}
                    </span>
                    {data.incentive.validUntil && (
                      <span className="text-xs text-gray-600">
                        Valid until {new Date(data.incentive.validUntil).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Expandable Meta Information */}
              {data.meta && Object.keys(data.meta).length > 0 && (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs p-1 h-auto"
                  >
                    {isExpanded ? 'Hide Details' : 'Show Details'}
                  </Button>
                  
                  {isExpanded && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(data.meta, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              {data.actionData && !isExpired() && (
                <div className="mt-2">
                  <Button
                    onClick={handleActionClick}
                    size="sm"
                    className="text-xs"
                    variant={data.type === 'INCENTIVE' ? 'default' : 'outline'}
                  >
                    {data.actionData.actionText}
                  </Button>
                </div>
              )}

              {/* Expired Notice */}
              {isExpired() && (
                <div className="mt-2 text-xs text-red-500">
                  This offer has expired
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center gap-1">
              {!data.read && (
                <Button
                  onClick={() => markAsRead(data.id)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  title="Mark as read"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                onClick={() => clearNotification(data.id)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                title="Remove notification"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}