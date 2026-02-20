import mongoose from "mongoose";
import { Schema } from "mongoose";

const notificationSchema = new Schema({
  notificationId: {
    type: String,
    required: true,
    unique: true,
    match: /^NOT_\d{6}$/,
    index: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
    match: /^USR_\d{6}$/
  },
  stationId: {
    type: String,
    ref: 'StationState',
    match: /^ST\d{3}$/
  },
  type: {
    type: String,
    enum: [
      'system',
      'agent_action',
      'incentive',
      'maintenance',
      'emergency',
      'info',
      'warning',
      'success',
      'error'
    ],
    required: true,
    default: 'info'
  },
  agentType: {
    type: String,
    enum: ['mechanic', 'traffic', 'logistics', 'energy', 'auditor'],
    required: function() {
      return this.type === 'agent_action';
    }
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  channels: {
    socket: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: false
    },
    email: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    eventType: String,
    source: String,
    category: String,
    tags: [String],
    relatedEntities: [{
      type: String,
      id: String
    }]
  },
  actionData: {
    actionType: String,
    actionUrl: String,
    actionText: String,
    expiresAt: Date
  },
  incentive: {
    amount: {
      type: Number,
      min: 0
    },
    type: {
      type: String,
      enum: ['discount_amount', 'discount_percentage', 'cashback', 'points']
    },
    validUntil: Date,
    conditions: String
  },
  readAt: Date,
  archivedAt: Date,
  deliveryStatus: {
    socket: {
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      error: String
    },
    push: {
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      error: String
    },
    email: {
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      error: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ agentType: 1 });
notificationSchema.index({ stationId: 1 });
notificationSchema.index({ 'incentive.validUntil': 1 });

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  if (this.actionData?.expiresAt) {
    return new Date() > this.actionData.expiresAt;
  }
  if (this.incentive?.validUntil) {
    return new Date() > this.incentive.validUntil;
  }
  return false;
});

// Static methods
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, status: 'unread' });
};

notificationSchema.statics.getByType = function(userId, type, limit = 20) {
  return this.find({ userId, type })
    .sort({ createdAt: -1 })
    .limit(limit);
};

notificationSchema.statics.getByPriority = function(userId, priority, limit = 20) {
  return this.find({ userId, priority })
    .sort({ createdAt: -1 })
    .limit(limit);
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, status: 'unread' },
    { 
      $set: { 
        status: 'read',
        readAt: new Date()
      }
    }
  );
};

notificationSchema.statics.cleanupOld = function(daysOld = 30) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $in: ['read', 'archived'] }
  });
};

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.archive = function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  return this.save();
};

notificationSchema.methods.updateDeliveryStatus = function(channel, delivered, error = null) {
  this.deliveryStatus[channel] = {
    delivered,
    deliveredAt: delivered ? new Date() : undefined,
    error
  };
  return this.save();
};

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;