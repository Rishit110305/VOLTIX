import mongoose from "mongoose";
import { Schema } from "mongoose";

const subSchema = new Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  endpoint: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  keys: { 
    auth: {
      type: String,
      required: true
    }, 
    p256dh: {
      type: String,
      required: true
    }
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    browser: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
subSchema.index({ userId: 1 });
subSchema.index({ isActive: 1 });

const Sub = mongoose.model("Sub", subSchema);
export default Sub;