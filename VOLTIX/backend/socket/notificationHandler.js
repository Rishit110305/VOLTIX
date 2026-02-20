import pushService from "../services/pushService.js";
import notificationService from "../services/notificationService.js";

export default (io, socket) => {
  // Subscribe to push notifications
  socket.on("push:subscribe", async (subscriptionData) => {
    if (!socket.userId) {
      socket.emit("push:error", { message: "Authentication required" });
      return;
    }

    try {
      const result = await pushService.saveSubs(subscriptionData, socket.userId);
      socket.emit("push:subscribed", result);
      console.log(`Push subscription saved for user ${socket.userId}`);
    } catch (error) {
      console.error("Push subscription error:", error);
      socket.emit("push:error", { message: error.message });
    }
  });

  // Get user's push subscriptions
  socket.on("push:subscriptions", async () => {
    if (!socket.userId) {
      socket.emit("push:error", { message: "Authentication required" });
      return;
    }

    try {
      const result = await pushService.getUserSubscriptions(socket.userId);
      socket.emit("push:subscriptions:result", result);
    } catch (error) {
      console.error("Get subscriptions error:", error);
      socket.emit("push:error", { message: error.message });
    }
  });

  // Remove push subscription
  socket.on("push:unsubscribe", async (endpoint) => {
    try {
      const result = await pushService.removeSubscription(endpoint);
      socket.emit("push:unsubscribed", result);
      console.log(`Push subscription removed: ${endpoint}`);
    } catch (error) {
      console.error("Push unsubscribe error:", error);
      socket.emit("push:error", { message: error.message });
    }
  });

  // Get user notifications
  socket.on("notifications:get", async (filters = {}) => {
    if (!socket.userId) {
      socket.emit("notifications:error", { message: "Authentication required" });
      return;
    }

    try {
      const result = await notificationService.getNotifications(socket.userId, filters);
      socket.emit("notifications:list", result);
    } catch (error) {
      console.error("Get notifications error:", error);
      socket.emit("notifications:error", { message: error.message });
    }
  });

  // Mark notification as read
  socket.on("notification:read", async (notificationId) => {
    if (!socket.userId) {
      socket.emit("notifications:error", { message: "Authentication required" });
      return;
    }

    try {
      const result = await notificationService.markAsRead(notificationId, socket.userId);
      socket.emit("notification:read:result", result);
      
      // Broadcast to user's other sessions
      io.to(socket.userId.toString()).emit("notification:updated", {
        notificationId,
        status: 'read',
        readAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Mark notification read error:", error);
      socket.emit("notifications:error", { message: error.message });
    }
  });

  // Subscribe to notification types
  socket.on("notifications:subscribe", (types) => {
    if (!Array.isArray(types)) {
      socket.emit("notifications:error", { message: "Types must be an array" });
      return;
    }

    types.forEach(type => {
      socket.join(`notifications:${type}`);
    });

    socket.emit("notifications:subscribed", { types });
    console.log(`User ${socket.userId} subscribed to notification types:`, types);
  });

  // Unsubscribe from notification types
  socket.on("notifications:unsubscribe", (types) => {
    if (!Array.isArray(types)) return;

    types.forEach(type => {
      socket.leave(`notifications:${type}`);
    });

    socket.emit("notifications:unsubscribed", { types });
    console.log(`User ${socket.userId} unsubscribed from notification types:`, types);
  });

  // Test notification (for development)
  socket.on("notification:test", async ({ title, message, type = "info" }) => {
    if (!socket.userId) {
      socket.emit("notifications:error", { message: "Authentication required" });
      return;
    }

    try {
      // Send socket notification
      socket.emit("notification:new", {
        eventType: "TEST_NOTIFICATION",
        payload: {
          title: title || "Test Notification",
          message: message || "This is a test notification",
          type,
          userId: socket.userId
        },
        timestamp: new Date().toISOString()
      });

      // Send push notification if requested
      if (type === "push") {
        await pushService.sendNotification({
          title: title || "Test Push Notification",
          message: message || "This is a test push notification",
          userId: socket.userId
        });
      }

      socket.emit("notification:test:sent", { 
        message: "Test notification sent successfully" 
      });
    } catch (error) {
      console.error("Test notification error:", error);
      socket.emit("notifications:error", { message: error.message });
    }
  });
};