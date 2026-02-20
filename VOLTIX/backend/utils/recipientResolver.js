import User from "../models/User.js";
import { getDistanceKm } from "./geo.js";

export const resolveRecipients = async (eventType, payload) => {
  const recipients = [];

  switch (eventType) {
    // Mechanic Agent Events - Notify all users in affected area
    case "HARDWARE_FAILURE":
    case "SELF_HEALING_FAILED":
    case "MAINTENANCE_REQUIRED": {
      // Notify users who have used this station recently or have it as preferred
      const affectedUsers = await User.find({
        $or: [
          { "location.preferredStations": payload.stationId },
          { "usage.lastChargingSession": { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        ],
        status: "active"
      });
      recipients.push(...affectedUsers);
      break;
    }

    case "SELF_HEALING_SUCCESS":
    case "SELF_HEALING_STARTED": {
      // Notify users who have this station as preferred
      const interestedUsers = await User.find({
        "location.preferredStations": payload.stationId,
        status: "active"
      });
      recipients.push(...interestedUsers);
      break;
    }

    // Traffic Agent Events - Target specific users or nearby users
    case "INCENTIVE_OFFERED": {
      // Notify specific user
      if (payload.userId) {
        const user = await User.findOne({ userId: payload.userId, status: "active" });
        if (user) recipients.push(user);
      }
      break;
    }

    case "CONGESTION_ALERT":
    case "CONGESTION_CRITICAL": {
      // Notify users in the same city or nearby area
      if (payload.stationLocation) {
        const nearbyUsers = await User.find({
          "location.coordinates": {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [payload.stationLocation.lng, payload.stationLocation.lat]
              },
              $maxDistance: 10000 // 10km radius
            }
          },
          status: "active"
        });
        recipients.push(...nearbyUsers);
      }
      break;
    }

    // Logistics Agent Events - Notify users who might be affected
    case "STOCKOUT_PREDICTED":
    case "STOCKOUT_IMMINENT":
    case "INVENTORY_CRITICAL": {
      // Notify users who have this station as preferred or are in the same city
      const affectedUsers = await User.find({
        $or: [
          { "location.preferredStations": payload.stationId },
          { "location.city": payload.stationCity }
        ],
        status: "active"
      });
      recipients.push(...affectedUsers);
      break;
    }

    case "DISPATCH_INITIATED":
    case "DISPATCH_COMPLETED": {
      // Notify users who have this station as preferred
      const interestedUsers = await User.find({
        "location.preferredStations": payload.stationId,
        status: "active"
      });
      recipients.push(...interestedUsers);
      break;
    }

    // Energy Agent Events - Notify all active users
    case "PRICE_SPIKE":
    case "PRICE_SPIKE_CRITICAL":
    case "GRID_INSTABILITY": {
      // Notify all active users as this affects everyone
      const allUsers = await User.find({
        status: "active",
        "subscription.isActive": true
      }).limit(1000); // Limit to prevent overwhelming
      recipients.push(...allUsers);
      break;
    }

    case "TRADING_OPPORTUNITY":
    case "ARBITRAGE_EXECUTED": {
      // Notify premium users who might be interested in cost savings
      const premiumUsers = await User.find({
        "subscription.plan": { $in: ["premium", "enterprise"] },
        status: "active"
      });
      recipients.push(...premiumUsers);
      break;
    }

    // Auditor Agent Events - Notify all users for transparency
    case "ANOMALY_DETECTED":
    case "COMPLIANCE_VIOLATION": {
      // Notify all active users for transparency
      const allUsers = await User.find({
        status: "active",
        "subscription.isActive": true
      }).limit(500);
      recipients.push(...allUsers);
      break;
    }

    case "AUDIT_COMPLETE": {
      // Notify premium users who might want detailed reports
      const premiumUsers = await User.find({
        "subscription.plan": { $in: ["premium", "enterprise"] },
        status: "active"
      });
      recipients.push(...premiumUsers);
      break;
    }

    // Station-specific events
    case "STATION_OFFLINE":
    case "STATION_ONLINE": {
      // Notify users who have this station as preferred or are nearby
      const affectedUsers = await User.find({
        $or: [
          { "location.preferredStations": payload.stationId },
          { "location.city": payload.stationCity }
        ],
        status: "active"
      });
      recipients.push(...affectedUsers);
      break;
    }

    // User-specific events
    case "CHARGING_COMPLETE":
    case "CHARGING_INTERRUPTED":
    case "PAYMENT_FAILED": {
      // Notify specific user
      if (payload.userId) {
        const user = await User.findOne({ userId: payload.userId, status: "active" });
        if (user) recipients.push(user);
      }
      break;
    }

    default:
      console.warn(`Unknown event type: ${eventType}`);
      break;
  }

  // Remove duplicates based on userId
  const uniqueRecipients = recipients.filter((recipient, index, self) => 
    index === self.findIndex(r => r.userId === recipient.userId)
  );

  console.log("recipients:", uniqueRecipients.map((u) => ({
    id: u.userId,
    city: u.location?.city || 'unknown',
    plan: u.subscription?.plan || 'basic'
  })));

  return uniqueRecipients;
};