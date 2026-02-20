import express from 'express';
import notificationService from '../services/notificationService.js';
import wrapAsync from '../middlewares/wrapAsync.js';
import { 
  validateCreateNotification,
  validateUpdateNotification,
  validateNotificationQuery,
  validateNotificationId
} from '../middlewares/validate.js';

const router = express.Router();

// Get User Notifications with filtering and pagination
router.get('/:userId', validateNotificationQuery, wrapAsync(async (req, res) => {
  const { userId } = req.params;
  
  const filters = {
    type: req.query.type,
    agentType: req.query.agentType,
    status: req.query.status,
    priority: req.query.priority,
    unreadOnly: req.query.unreadOnly,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };

  const pagination = {
    page: req.query.page,
    limit: req.query.limit
  };

  const result = await notificationService.getNotifications(userId, filters, pagination);
  res.json(result);
}));

// Create Notification
router.post('/', validateCreateNotification, wrapAsync(async (req, res) => {
  const result = await notificationService.createNotification(req.body);
  res.status(201).json(result);
}));

// Get Notification by ID
router.get('/notification/:notificationId', validateNotificationId, wrapAsync(async (req, res) => {
  const { notificationId } = req.params;
  const result = await notificationService.getNotificationById(notificationId);
  res.json(result);
}));

// Update Notification
router.put('/:notificationId', validateNotificationId, validateUpdateNotification, wrapAsync(async (req, res) => {
  const { notificationId } = req.params;
  const result = await notificationService.updateNotification(notificationId, req.body);
  res.json(result);
}));

// Mark Notification as Read
router.put('/:notificationId/read', validateNotificationId, wrapAsync(async (req, res) => {
  const { notificationId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }

  const result = await notificationService.markAsRead(notificationId, userId);
  res.json(result);
}));

// Archive Notification
router.put('/:notificationId/archive', validateNotificationId, wrapAsync(async (req, res) => {
  const { notificationId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }

  const result = await notificationService.archiveNotification(notificationId, userId);
  res.json(result);
}));

// Delete Notification
router.delete('/:notificationId', validateNotificationId, wrapAsync(async (req, res) => {
  const { notificationId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }

  const result = await notificationService.deleteNotification(notificationId, userId);
  res.json(result);
}));

// Create Agent Notification
router.post('/agent', wrapAsync(async (req, res) => {
  const { agentType, eventType, payload, targetUsers } = req.body;

  if (!agentType || !eventType || !payload) {
    return res.status(400).json({
      success: false,
      error: 'agentType, eventType, and payload are required'
    });
  }

  const result = await notificationService.createAgentNotification(
    agentType,
    eventType,
    payload,
    targetUsers
  );
  
  res.status(201).json(result);
}));

// Create Incentive Notification
router.post('/incentive', wrapAsync(async (req, res) => {
  const { userId, stationId, incentiveData } = req.body;

  if (!userId || !stationId || !incentiveData) {
    return res.status(400).json({
      success: false,
      error: 'userId, stationId, and incentiveData are required'
    });
  }

  const result = await notificationService.createIncentiveNotification(
    userId, 
    stationId, 
    incentiveData
  );
  
  res.status(201).json(result);
}));

// Create System Notification
router.post('/system', wrapAsync(async (req, res) => {
  const { title, message, priority, targetUsers } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      success: false,
      error: 'title and message are required'
    });
  }

  const result = await notificationService.createSystemNotification(
    title,
    message,
    priority,
    targetUsers
  );
  
  res.status(201).json(result);
}));

// Mark All Notifications as Read for User
router.put('/:userId/read-all', wrapAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await notificationService.markAllAsRead(userId);
  res.json(result);
}));

// Create Bulk Notifications
router.post('/bulk', wrapAsync(async (req, res) => {
  const { notifications } = req.body;

  if (!Array.isArray(notifications) || notifications.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'notifications array is required and cannot be empty'
    });
  }

  const result = await notificationService.createBulkNotifications(notifications);
  res.json(result);
}));

// Get Unread Count
router.get('/:userId/unread-count', wrapAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await notificationService.getUnreadCount(userId);
  res.json(result);
}));

// Get Notifications by Type
router.get('/:userId/type/:type', wrapAsync(async (req, res) => {
  const { userId, type } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  
  const result = await notificationService.getNotificationsByType(userId, type, limit);
  res.json(result);
}));

// Get Notifications by Priority
router.get('/:userId/priority/:priority', wrapAsync(async (req, res) => {
  const { userId, priority } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  
  const result = await notificationService.getNotificationsByPriority(userId, priority, limit);
  res.json(result);
}));

// Get Notification Statistics
router.get('/:userId/stats', wrapAsync(async (req, res) => {
  const { userId } = req.params;
  const timeRange = parseInt(req.query.timeRange) || 7;
  
  const result = await notificationService.getNotificationStats(userId, timeRange);
  res.json(result);
}));

// Cleanup Old Notifications
router.post('/cleanup', wrapAsync(async (req, res) => {
  const daysOld = parseInt(req.body.daysOld) || 30;
  const result = await notificationService.cleanupOldNotifications(daysOld);
  res.json(result);
}));

export default router;