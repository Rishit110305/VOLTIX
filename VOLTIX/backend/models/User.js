import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    match: /^USR_\d{6}$/
  },
  profile: {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    phone: {
      type: String,
      required: true,
      match: /^\+91[6-9]\d{9}$/
    },
    avatar: {
      type: String,
      default: null
    }
  },
  authentication: {
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date,
      default: null
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    },
    refreshTokens: [{
      token: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  location: {
    city: {
      type: String,
      required: true,
      enum: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata']
    },
    address: {
      street: String,
      area: String,
      pincode: {
        type: String,
        match: /^\d{6}$/
      }
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    preferredStations: [{
      type: String,
      ref: 'Station'
    }]
  },
  vehicle: {
    type: {
      type: String,
      required: true,
      enum: ['sedan', 'suv', 'hatchback', 'commercial']
    },
    make: {
      type: String,
      required: true
    },
    model: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true,
      min: 2015,
      max: new Date().getFullYear() + 1
    },
    batteryCapacity: {
      type: Number,
      required: true,
      min: 10,
      max: 200
    },
    chargingSpeed: {
      type: String,
      enum: ['standard', 'fast', 'ultra'],
      default: 'standard'
    },
    registrationNumber: {
      type: String,
      required: true,
      uppercase: true
    }
  },
  subscription: {
    plan: {
      type: String,
      required: true,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic'
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    autoRenew: {
      type: Boolean,
      default: false
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'wallet', 'netbanking'],
      default: 'card'
    }
  },
  usage: {
    totalSessions: {
      type: Number,
      default: 0,
      min: 0
    },
    avgSessionDuration: {
      type: Number,
      default: 0,
      min: 0
    },
    totalEnergyConsumed: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmountSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    carbonSaved: {
      type: Number,
      default: 0,
      min: 0
    },
    lastChargingSession: {
      type: Date,
      default: null
    }
  },
  preferences: {
    maxDistance: {
      type: Number,
      default: 10,
      min: 1,
      max: 50
    },
    pricePreference: {
      type: String,
      enum: ['lowest', 'balanced', 'premium'],
      default: 'balanced'
    },
    chargingTimePreference: {
      type: String,
      enum: ['fastest', 'balanced', 'cheapest'],
      default: 'balanced'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      }
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'mr', 'ta', 'te', 'kn', 'bn'],
      default: 'en'
    }
  },
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    transactions: [{
      transactionId: String,
      type: {
        type: String,
        enum: ['credit', 'debit']
      },
      amount: Number,
      description: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for performance optimization
UserSchema.index({ userId: 1 }, { unique: true });
UserSchema.index({ 'profile.email': 1 }, { unique: true });
UserSchema.index({ 'profile.phone': 1 }, { unique: true });
UserSchema.index({ 'vehicle.registrationNumber': 1 }, { unique: true });
UserSchema.index({ 'location.city': 1, 'subscription.plan': 1 });
UserSchema.index({ 'subscription.isActive': 1, 'subscription.endDate': 1 });
UserSchema.index({ status: 1 });

// Virtual for account lock status
UserSchema.virtual('isLocked').get(function() {
  return !!(this.authentication.lockUntil && this.authentication.lockUntil > Date.now());
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function() {
  if (!this.isModified('authentication.password')) return;
  
  // Only hash if password is not already hashed (doesn't start with $2b$)
  if (!this.authentication.password.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(12);
    this.authentication.password = await bcrypt.hash(this.authentication.password, salt);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.authentication.password);
};

// Method to generate JWT token
UserSchema.methods.generateAuthToken = function() {
  const payload = {
    userId: this.userId,
    email: this.profile.email,
    plan: this.subscription.plan
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Method to increment login attempts
UserSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.authentication.lockUntil && this.authentication.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'authentication.lockUntil': 1 },
      $set: { 'authentication.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'authentication.loginAttempts': 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.authentication.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 'authentication.lockUntil': Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      'authentication.loginAttempts': 1,
      'authentication.lockUntil': 1
    },
    $set: {
      'authentication.lastLogin': new Date()
    }
  });
};

// Method to update usage statistics
UserSchema.methods.updateUsageStats = function(sessionData) {
  const updates = {
    $inc: {
      'usage.totalSessions': 1,
      'usage.totalEnergyConsumed': sessionData.energyConsumed || 0,
      'usage.totalAmountSpent': sessionData.amountSpent || 0,
      'usage.carbonSaved': sessionData.carbonSaved || 0
    },
    $set: {
      'usage.lastChargingSession': new Date(),
      'usage.avgSessionDuration': sessionData.duration || this.usage.avgSessionDuration
    }
  };
  
  return this.updateOne(updates);
};

export default mongoose.model('User', UserSchema);