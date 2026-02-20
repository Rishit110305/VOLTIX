import Sub from "../models/Sub.js";
import ExpressError from "../middlewares/expressError.js";
import webpush from "web-push";

class PushService {

  async saveSubs(subscriptionData, userId) {
    try {
      const { subscription, deviceInfo } = subscriptionData;

      if (!subscription?.endpoint ||
        !subscription?.keys?.auth ||
        !subscription?.keys?.p256dh) {
        throw new ExpressError(400, "Invalid subscription format");
      }

      // Check if subscription already exists
      const found = await Sub.findOne({ endpoint: subscription.endpoint });
      if (found) {
        // Update existing subscription
        found.userId = userId;
        found.keys = subscription.keys;
        found.deviceInfo = deviceInfo || {};
        found.lastUsed = new Date();
        found.isActive = true;
        await found.save();

        return {
          success: true,
          message: "Subscription updated successfully",
          data: found
        };
      }

      // Test the subscription before saving
      const testPayload = JSON.stringify({
        title: "EV Copilot",
        message: "Notifications enabled successfully!",
        icon: "/logo.png",
        badge: "/badge.png"
      });

      try {
        await webpush.sendNotification(subscription, testPayload);
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          throw new ExpressError(400, "Subscription is expired or invalid");
        }
        throw err;
      }

      // Create new subscription
      const newSub = await Sub.create({
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        deviceInfo: deviceInfo || {}
      });

      return {
        success: true,
        message: "Subscription saved and verified",
        data: newSub
      };
    } catch (error) {
      if (error instanceof ExpressError) throw error;
      throw new ExpressError(500, `Failed to save subscription: ${error.message}`);
    }
  }

  async sendNotification(notificationData) {
    try {
      const { title, message, userId, icon, badge, data } = notificationData;

      if (!title || !message) {
        throw new ExpressError(400, "Title and message are required");
      }

      const payload = JSON.stringify({
        title,
        message,
        icon: icon || "/logo.png",
        badge: badge || "/badge.png",
        data: data || {},
        timestamp: new Date().toISOString()
      });

      // Get subscriptions for specific user or all users
      const query = userId ? { userId, isActive: true } : { isActive: true };
      const allSubs = await Sub.find(query);

      if (!allSubs.length) {
        return {
          success: false,
          message: userId ? "No subscriptions found for user" : "No subscriptions found",
          stats: { successful: 0, failed: 0 }
        };
      }

      let successfulSends = 0;
      let failedSends = 0;

      await Promise.allSettled(
        allSubs.map(async (sub) => {
          try {
            await webpush.sendNotification(sub.toJSON(), payload);
            successfulSends++;

            // Update last used timestamp
            sub.lastUsed = new Date();
            await sub.save();
          } catch (err) {
            failedSends++;
            console.error(`Push notification failed for ${sub.endpoint}:`, err.message);

            // Remove expired/invalid subscriptions
            if (err.statusCode === 404 || err.statusCode === 410) {
              await Sub.deleteOne({ endpoint: sub.endpoint });
            }
          }
        })
      );

      return {
        success: true,
        message: `Notifications sent (successful: ${successfulSends}, failed: ${failedSends})`,
        stats: { successful: successfulSends, failed: failedSends }
      };
    } catch (error) {
      if (error instanceof ExpressError) throw error;
      throw new ExpressError(500, `Failed to send notification: ${error.message}`);
    }
  }

  async sendAgentNotification(agentType, eventType, payload, targetUsers = null) {
    try {
      const notificationConfig = this.getAgentNotificationConfig(agentType, eventType, payload);

      if (!notificationConfig) {
        return { success: false, message: "No notification config for this event" };
      }

      const notificationData = {
        title: notificationConfig.title,
        message: notificationConfig.message,
        icon: notificationConfig.icon,
        data: {
          agentType,
          eventType,
          payload,
          timestamp: new Date().toISOString()
        }
      };

      // Send to specific users or broadcast
      if (targetUsers && targetUsers.length > 0) {
        const results = await Promise.all(
          targetUsers.map(userId =>
            this.sendNotification({ ...notificationData, userId })
          )
        );

        const totalStats = results.reduce((acc, result) => ({
          successful: acc.successful + (result.stats?.successful || 0),
          failed: acc.failed + (result.stats?.failed || 0)
        }), { successful: 0, failed: 0 });

        return {
          success: true,
          message: `Agent notification sent to ${targetUsers.length} users`,
          stats: totalStats
        };
      } else {
        return await this.sendNotification(notificationData);
      }
    } catch (error) {
      throw new ExpressError(500, `Failed to send agent notification: ${error.message}`);
    }
  }

  getAgentNotificationConfig(agentType, eventType, payload) {
    const configs = {
      mechanic: {
        failure_detected: {
          title: "🔧 Hardware Issue Detected",
          message: `Station ${payload.stationId}: ${payload.description}`,
          icon: "/icons/mechanic.png"
        },
        self_healing_started: {
          title: "Auto-Healing in Progress",
          message: `Station ${payload.stationId}: Attempting automatic repair`,
          icon: "/icons/healing.png"
        },
        self_healing_success: {
          title: "Auto-Healing Successful",
          message: `Station ${payload.stationId}: Issue resolved automatically`,
          icon: "/icons/success.png"
        },
        maintenance_required: {
          title: "Maintenance Required",
          message: `Station ${payload.stationId}: Technician dispatch needed`,
          icon: "/icons/maintenance.png"
        }
      },
      traffic: {
        incentive_offered: {
          title: "Special Offer Available!",
          message: `Save ₹${payload.amount} by switching to ${payload.alternativeStation}`,
          icon: "/icons/incentive.png"
        },
        congestion_alert: {
          title: "Traffic Alert",
          message: `Station ${payload.stationId}: ${payload.waitTime} min wait time`,
          icon: "/icons/traffic.png"
        },
        demand_surge: {
          title: "📈 High Demand Alert",
          message: `Station ${payload.stationId}: Surge pricing in effect`,
          icon: "/icons/surge.png"
        }
      },
      logistics: {
        stockout_predicted: {
          title: "Low Inventory Alert",
          message: `Station ${payload.stationId}: Stockout predicted in ${payload.timeToStockout}`,
          icon: "/icons/inventory.png"
        },
        dispatch_initiated: {
          title: "Dispatch in Progress",
          message: `Refill truck dispatched to Station ${payload.stationId}`,
          icon: "/icons/dispatch.png"
        },
        inventory_critical: {
          title: "🚨 Critical Inventory",
          message: `Station ${payload.stationId}: Only ${payload.remainingUnits} units left`,
          icon: "/icons/critical.png"
        }
      },
      energy: {
        price_spike: {
          title: "Energy Price Alert",
          message: `Grid prices increased by ${payload.percentage}% - Charging paused`,
          icon: "/icons/energy.png"
        },
        trading_opportunity: {
          title: "Trading Opportunity",
          message: `Selling ${payload.amount}kWh back to grid for ₹${payload.revenue}`,
          icon: "/icons/trading.png"
        },
        grid_instability: {
          title: "Grid Instability",
          message: "Charging temporarily paused for grid stability",
          icon: "/icons/grid.png"
        }
      },
      auditor: {
        anomaly_detected: {
          title: "Anomaly Detected",
          message: `Unusual activity flagged for review: ${payload.description}`,
          icon: "/icons/audit.png"
        },
        compliance_violation: {
          title: "Compliance Alert",
          message: `Policy violation detected: ${payload.violation}`,
          icon: "/icons/compliance.png"
        },
        audit_complete: {
          title: "Audit Complete",
          message: `${payload.decisionsAnalyzed} decisions analyzed - ${payload.issuesFound} issues found`,
          icon: "/icons/audit-complete.png"
        }
      }
    };

    return configs[agentType]?.[eventType];
  }

  async getUserSubscriptions(userId) {
    try {
      const subscriptions = await Sub.find({ userId, isActive: true });
      return {
        success: true,
        data: subscriptions,
        count: subscriptions.length
      };
    } catch (error) {
      throw new ExpressError(500, `Failed to get user subscriptions: ${error.message}`);
    }
  }

  async removeSubscription(endpoint) {
    try {
      const result = await Sub.deleteOne({ endpoint });
      return {
        success: true,
        message: result.deletedCount > 0 ? "Subscription removed" : "Subscription not found"
      };
    } catch (error) {
      throw new ExpressError(500, `Failed to remove subscription: ${error.message}`);
    }
  }

  async cleanupExpiredSubscriptions() {
    try {
      // Remove subscriptions not used in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = await Sub.deleteMany({
        lastUsed: { $lt: thirtyDaysAgo }
      });

      return {
        success: true,
        message: `Cleaned up ${result.deletedCount} expired subscriptions`
      };
    } catch (error) {
      throw new ExpressError(500, `Failed to cleanup subscriptions: ${error.message}`);
    }
  }
}

// Create singleton instance
const pushService = new PushService();

export default pushService;