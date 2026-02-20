import express from 'express';
import pushService from '../services/pushService.js';
import wrapAsync from '../middlewares/wrapAsync.js';

const router = express.Router();

// Save push subscription
router.post('/subscribe', wrapAsync(async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }

  const result = await pushService.saveSubs(req.body, userId);
  res.status(201).json(result);
}));

// Get user subscriptions
router.get('/subscriptions/:userId', wrapAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await pushService.getUserSubscriptions(userId);
  res.json(result);
}));

// Remove subscription
router.delete('/unsubscribe', wrapAsync(async (req, res) => {
  const { endpoint } = req.body;
  
  if (!endpoint) {
    return res.status(400).json({
      success: false,
      error: 'Endpoint is required'
    });
  }

  const result = await pushService.removeSubscription(endpoint);
  res.json(result);
}));

// Send notification to all users
router.post('/send', wrapAsync(async (req, res) => {
  const result = await pushService.sendNotification(req.body);
  res.json(result);
}));

// Send notification to specific user
router.post('/send/:userId', wrapAsync(async (req, res) => {
  const { userId } = req.params;
  const notificationData = { ...req.body, userId };
  
  const result = await pushService.sendNotification(notificationData);
  res.json(result);
}));

// Send agent notification
router.post('/agent/:agentType/:eventType', wrapAsync(async (req, res) => {
  const { agentType, eventType } = req.params;
  const { payload, targetUsers } = req.body;

  const result = await pushService.sendAgentNotification(
    agentType,
    eventType,
    payload,
    targetUsers
  );
  
  res.json(result);
}));

// Cleanup expired subscriptions
router.post('/cleanup', wrapAsync(async (req, res) => {
  const result = await pushService.cleanupExpiredSubscriptions();
  res.json(result);
}));

// Test notification
router.post('/test/:userId', wrapAsync(async (req, res) => {
  const { userId } = req.params;
  
  const result = await pushService.sendNotification({
    title: "Test Notification",
    message: "This is a test push notification from EV Copilot",
    userId,
    data: {
      type: "test",
      timestamp: new Date().toISOString()
    }
  });
  
  res.json(result);
}));

export default router;