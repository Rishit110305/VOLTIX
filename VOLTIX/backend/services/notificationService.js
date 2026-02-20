import Notification from '../models/Notification.js';
import ExpressError from '../middlewares/expressError.js';

class NotificationService {

  async createNotification(notificationData) {
    try {
      // Auto-generate notificationId if not provided
      if (!notificationData.notificationId) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        notificationData.notificationId = `NOT_${timestamp.toString().slice(-6)}`;
      }

      const notification = new Notification(notificationData);
      await notification.save();

      return {
        success: true,
        message: 'Notification created successfully',
        data: notification
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new ExpressError(400, 'Notification ID already exists');
      }
      throw new ExpressError(500, `Failed to create notification: ${error.message}`);
    }
  }

  async getNotifications(userId, filters = {}, pagination = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        agentType,
        status,
        priority,
        unreadOnly = false,
        startDate,
        endDate
      } = { ...filters, ...pagination };

      // Build query
      const query = { userId };
      
      if (type) query.type = type;
      if (agentType) query.agentType = agentType;
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (unreadOnly === 'true' || unreadOnly === true) query.status = 'unread';
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ createdAt: -1 }),
        Notification.countDocuments(query),
        Notification.countDocuments({ userId, status: 'unread' })
      ]);

      return {
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        unreadCount
      };
    } catch (error) {
      throw new ExpressError(500, `Failed to get notifications: ${error.message}`);
    }
  }

  async getNotificationById(notificationId) {
    try {
      const notification = await Notification.findOne({ notificationId });
      
      if (!notification) {
        throw new ExpressError(404, 'Notification not found');
      }

      return {
        success: true,
        data: notification
      };
    } catch (error) {
      if (error instanceof ExpressError) throw error;
      throw new ExpressError(500, `Failed to get notification: ${error.message}`);
    }
  }

  async updateNotification(notificationId, updateData) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { notificationId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!notification) {
        throw new ExpressError(404, 'Notification not found');
      }

      return {
        success: true,
        message: 'Notification updated successfully',
        data: notification
      };
    } catch (error) {
      if (error instanceof ExpressError) throw error;
      throw new ExpressError(500, `Failed to update notification: ${error.message}`);
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { notificationId, userId },
        { 
          $set: { 
            status: 'read',
            readAt: new Date()
          }
        },
        { new: true }
      );

      if (!notification) {
        throw new ExpressError(404, 'Notification not found');
      }

      return {
        success: true,
        message: 'Notification marked as read',
        data: notification
      };
    } catch (error) {
      if (error instanceof ExpressError) throw error;
      throw new ExpressError(500, `Failed to mark notification as read: ${error.message}`);
    }
  }

  async markAllAsRead(userId) {
    try {
      const result = await Notification.markAllAsRead(userId);

      return {
        success: true,
        message: `${result.modifiedCount} notifications marked as read`,
        modifiedCount: result.modifiedCount
      };
    } catch (error) {
      throw new ExpressError(500, `Failed to mark all notifications as read: ${error.message}`);
    }
  }

  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({ notificationId, userId });

      if (!notification) {
        throw new ExpressError(404, 'Notification not found');
      }

      return {
        success: true,
        message: 'Notification deleted successfully'
      };
    } catch (error) {
      if (error instanceof ExpressError) throw error;
      throw new ExpressError(500, `Failed to delete notification: ${error.message}`);
    }
  }

  async createAgentNotification(agentType, eventType, payload, targetUsers = null) {
    try {
      const notificationConfig = this.getAgentNotificationConfig(agentType, eventType, payload);
      
      if (!notificationConfig) {
        throw new ExpressError(400, 'No notification configuration found for this agent event');
      }

      const baseNotificationData = {
        type: 'agent_action',
        agentType,
        title: notificationConfig.title,
        message: notificationConfig.message,
        priority: notificationConfig.priority || 'medium',
        channels: notificationConfig.channels || { socket: true, push: false },
        metadata: {
          eventType,
          source: `${agentType}_agent`,
          category: agentType,
          tags: [agentType, eventType]
        },
        ...payload
      };

      const notifications = [];

      if (targetUsers && targetUsers.length > 0) {
        // Create notifications for specific users
        for (const userId of targetUsers) {
          const notificationData = { ...baseNotificationData, userId };
          const result = await this.createNotification(notificationData);
          notifications.push(result.data);
        }
      } else {
        // Create system-wide notification (would need admin users list)
        throw new ExpressError(400, 'Target users must be specified for agent notifications');
      }

      return {
        success: true,
        message: `Agent notification created for ${notifications.length} users`,
        data: notifications
      };
    } catch (error) {
      if (error instanceof ExpressError) throw error;
      throw new ExpressError(500, `Failed to create agent notification: ${error.message}`);
    }
  }

  async createIncentiveNotification(userId, stationId, incentiveData) {
    try {
      const notificationData = {
        userId,
        stationId,
        type: 'incentive',
        title: 'Special Offer Available!',
        message: `Save ₹${incentiveData.amount} by switching to a nearby station.`,
        priority: 'high',
        channels: { socket: true, push: true },
        incentive: {
          amount: incentiveData.amount,
          type: incentiveData.type || 'discount_amount',
          validUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          conditions: incentiveData.conditions
        },
        actionData: {
          actionType: 'accept_incentive',
          actionText: 'Accept Offer',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        },
        metadata: {
          eventType: 'INCENTIVE_OFFERED',
          source: 'traffic_agent',
          category: 'incentive'
        }
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      throw new ExpressError(500, `Failed to create incentive notification: ${error.message}`);
    }
  }

  async createSystemNotification(title, message, priority = 'medium', targetUsers = null) {
    try {
      const baseNotificationData = {
        type: 'system',
        title,
        message,
        priority,
        channels: { socket: true, push: priority === 'urgent' || priority === 'high' },
        metadata: {
          eventType: 'SYSTEM_NOTIFICATION',
          source: 'system',
          category: 'system'
        }
      };

      const notifications = [];

      if (targetUsers && targetUsers.length > 0) {
        for (const userId of targetUsers) {
          const notificationData = { ...baseNotificationData, userId };
          const result = await this.createNotification(notificationData);
          notifications.push(result.data);
        }
      } else {
        throw new ExpressError(400, 'Target users must be specified for system notifications');
      }

      return {
        success: true,
        message: `System notification created for ${notifications.length} users`,
        data: notifications
      };
    } catch (error) {
      if (error instanceof ExpressError) throw error;
      throw new ExpressError(500, `Failed to create system notification: ${error.message}`);
    }
  }

  getAgentNotificationConfig(agentType, eventType, payload) {
    const configs = {
      mechanic: {
        failure_detected: {
          title: "Hardware Issue Detected",
          message: `Station ${payload.stationId}: ${payload.description || 'Hardware failure detected'}`,
          priority: 'high',
          channels: { socket: true, push: true }
        },
        self_healing_started: {
          title: "Auto-Healing in Progress",
          message: `Station ${payload.stationId}: Attempting automatic repair`,
          priority: 'medium',
          channels: { socket: true, push: false }
        },
        self_healing_success: {
          title: "Auto-Healing Successful",
          message: `Station ${payload.stationId}: Issue resolved automatically`,
          priority: 'low',
          channels: { socket: true, push: false }
        },
        maintenance_required: {
          title: "Maintenance Required",
          message: `Station ${payload.stationId}: Technician dispatch needed`,
          priority: 'urgent',
          channels: { socket: true, push: true }
        }
      },
      traffic: {
        incentive_offered: {
          title: "Special Offer Available!",
          message: `Save ₹${payload.amount} by switching to ${payload.alternativeStation}`,
          priority: 'high',
          channels: { socket: true, push: true }
        },
        congestion_alert: {
          title: "Traffic Alert",
          message: `Station ${payload.stationId}: ${payload.waitTime} wait time`,
          priority: 'medium',
          channels: { socket: true, push: false }
        },
        demand_surge: {
          title: "High Demand Alert",
          message: `Station ${payload.stationId}: Surge pricing in effect`,
          priority: 'medium',
          channels: { socket: true, push: true }
        }
      },
      logistics: {
        stockout_predicted: {
          title: "Low Inventory Alert",
          message: `Station ${payload.stationId}: Stockout predicted in ${payload.timeToStockout}`,
          priority: 'high',
          channels: { socket: true, push: true }
        },
        dispatch_initiated: {
          title: "Dispatch in Progress",
          message: `Refill truck dispatched to Station ${payload.stationId}`,
          priority: 'medium',
          channels: { socket: true, push: false }
        },
        inventory_critical: {
          title: "Critical Inventory",
          message: `Station ${payload.stationId}: Only ${payload.remainingUnits} units left`,
          priority: 'urgent',
          channels: { socket: true, push: true }
        }
      },
      energy: {
        price_spike: {
          title: "Energy Price Alert",
          message: `Grid prices increased by ${payload.percentage}% - Charging paused`,
          priority: 'high',
          channels: { socket: true, push: true }
        },
        trading_opportunity: {
          title: "Trading Opportunity",
          message: `Selling ${payload.amount}kWh back to grid for ₹${payload.revenue}`,
          priority: 'medium',
          channels: { socket: true, push: false }
        },
        grid_instability: {
          title: "Grid Instability",
          message: "Charging temporarily paused for grid stability",
          priority: 'urgent',
          channels: { socket: true, push: true }
        }
      },
      auditor: {
        anomaly_detected: {
          title: "Anomaly Detected",
          message: `Unusual activity flagged: ${payload.description}`,
          priority: 'high',
          channels: { socket: true, push: true }
        },
        compliance_violation: {
          title: "Compliance Alert",
          message: `Policy violation detected: ${payload.violation}`,
          priority: 'urgent',
          channels: { socket: true, push: true }
        },
        audit_complete: {
          title: "Audit Complete",
          message: `${payload.decisionsAnalyzed} decisions analyzed - ${payload.issuesFound} issues found`,
          priority: 'low',
          channels: { socket: true, push: false }
        }
      }
    };

    return configs[agentType]?.[eventType];
  }

  async getUnreadCount(userId) {
    try {
      const count = await Notification.getUnreadCount(userId);
      return {
        success: true,
        count
      };
    } catch (error) {
      throw new ExpressError(500, `Failed to get unread count: ${error.message}`);
    }
  }

  async getNotificationsByType(userId, type, limit = 20) {
    try {
      const notifications = await Notification.getByType(userId, type, limit);
      return {
        success: true,
        data: notifications
      };
    } catch (error) {
      throw new ExpressError(500, `Failed to get notifications by type: ${error.message}`);
    }
  }

  async getNotificationsByPriority(userId, priority, limit = 20) {
    try {
      const notifications = await Notification.getByPriority(userId, priority, limit);
      return {
        success: true,
        data: notifications
      };
    } catch (error) {
      throw new ExpressError(500, `Failed to get notifications by priority: ${error.message}`);
    }
  }

  async archiveNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { notificationId, userId },
        { 
          $set: { 
            status: 'archived',
            archivedAt: new Date()
          }
        },
        { new: true }
      );

      if (!notification) {
        throw new ExpressError(404, 'Notification not found');
      }

      return {
        success: true,
        message: 'Notification archived successfully',
        data: notification
      };
    } catch (error) {
      if (error instanceof ExpressError) throw error;
      throw new ExpressError(500, `Failed to archive notification: ${error.message}`);
    }
  }

  async cleanupOldNotifications(daysOld = 30) {
    try {
      const result = await Notification.cleanupOld(daysOld);
      return {
        success: true,
        message: `Cleaned up ${result.deletedCount} old notifications`,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      throw new ExpressError(500, `Failed to cleanup notifications: ${error.message}`);
    }
  }

  async updateDeliveryStatus(notificationId, channel, delivered, error = null) {
    try {
      const notification = await Notification.findOne({ notificationId });
      
      if (!notification) {
        throw new ExpressError(404, 'Notification not found');
      }

      await notification.updateDeliveryStatus(channel, delivered, error);

      return {
        success: true,
        message: 'Delivery status updated'
      };
    } catch (error) {
      if (error instanceof ExpressError) throw error;
      throw new ExpressError(500, `Failed to update delivery status: ${error.message}`);
    }
  }

  async createBulkNotifications(notifications) {
    try {
      const results = [];
      
      for (const notificationData of notifications) {
        try {
          const result = await this.createNotification(notificationData);
          results.push({ success: true, data: result.data });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      return {
        success: true,
        message: `Bulk operation completed: ${successCount} successful, ${failureCount} failed`,
        results,
        stats: { successful: successCount, failed: failureCount }
      };
    } catch (error) {
      throw new ExpressError(500, `Failed to create bulk notifications: ${error.message}`);
    }
  }

  async getNotificationStats(userId, timeRange = 7) {
    try {
      const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);
      
      const [
        totalCount,
        unreadCount,
        typeStats,
        priorityStats,
        recentCount
      ] = await Promise.all([
        Notification.countDocuments({ userId }),
        Notification.countDocuments({ userId, status: 'unread' }),
        Notification.aggregate([
          { $match: { userId } },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        Notification.aggregate([
          { $match: { userId } },
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),
        Notification.countDocuments({ userId, createdAt: { $gte: startDate } })
      ]);

      return {
        success: true,
        stats: {
          total: totalCount,
          unread: unreadCount,
          recent: recentCount,
          byType: typeStats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byPriority: priorityStats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          timeRange: `${timeRange} days`
        }
      };
    } catch (error) {
      throw new ExpressError(500, `Failed to get notification stats: ${error.message}`);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;