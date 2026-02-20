import mongoose from 'mongoose';

const StationStateSchema = new mongoose.Schema({
  stationId: {
    type: String,
    required: true,
    unique: true,
    match: /^ST\d{3}$/,
    ref: 'Station'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    enum: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata']
  },
  stationType: {
    type: String,
    required: true,
    enum: ['standard', 'fast', 'ultra']
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  maxInventory: {
    type: Number,
    required: true,
    min: 10,
    max: 500
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[1] >= -90 && coords[1] <= 90 &&    // latitude
                 coords[0] >= -180 && coords[0] <= 180;    // longitude
        },
        message: 'Invalid coordinates [longitude, latitude]'
      }
    }
  },
  locationFlags: {
    isHighway: { type: Boolean, default: false },
    isMall: { type: Boolean, default: false },
    isOffice: { type: Boolean, default: false }
  },
  operator: {
    type: String,
    required: true
  },
  installationDate: {
    type: Date,
    required: true
  },
  operationalStatus: {
    status: {
      type: String,
      enum: ['active', 'maintenance', 'offline', 'emergency'],
      default: 'active'
    },
    lastStatusChange: {
      type: Date,
      default: Date.now
    },
    maintenanceScheduled: {
      type: Date,
      default: null
    },
    emergencyContact: {
      type: String,
      default: null
    }
  },
  realTimeData: {
    currentInventory: {
      type: Number,
      default: 0,
      min: 0
    },
    availableSlots: {
      type: Number,
      default: 0,
      min: 0
    },
    queueLength: {
      type: Number,
      default: 0,
      min: 0
    },
    avgWaitTime: {
      type: Number,
      default: 0,
      min: 0
    },
    currentLoad: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    powerConsumption: {
      type: Number,
      default: 0,
      min: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  pricing: {
    pricePerKwh: {
      type: Number,
      required: true,
      min: 0
    },
    peakHourMultiplier: {
      type: Number,
      default: 1.2,
      min: 1.0,
      max: 3.0
    },
    discountActive: {
      type: Boolean,
      default: false
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 50
    },
    dynamicPricing: {
      enabled: {
        type: Boolean,
        default: false
      },
      basePrice: {
        type: Number,
        default: 0
      },
      demandMultiplier: {
        type: Number,
        default: 1.0
      }
    }
  },
  performance: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    uptime: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    avgChargingTime: {
      type: Number,
      default: 30,
      min: 0
    },
    successRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    customerSatisfaction: {
      type: Number,
      default: 4.0,
      min: 1,
      max: 5
    }
  },
  agentActions: {
    lastMechanicAction: {
      action: String,
      timestamp: Date,
      result: String
    },
    lastTrafficAction: {
      action: String,
      timestamp: Date,
      incentiveOffered: Number
    },
    lastLogisticsAction: {
      action: String,
      timestamp: Date,
      inventoryDispatched: Number
    },
    lastEnergyAction: {
      action: String,
      timestamp: Date,
      energyTraded: Number
    },
    lastAuditAction: {
      action: String,
      timestamp: Date,
      complianceStatus: String
    }
  },
  alerts: {
    active: [{
      alertId: String,
      type: {
        type: String,
        enum: ['maintenance', 'inventory', 'queue', 'power', 'security', 'compliance']
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      message: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      acknowledged: {
        type: Boolean,
        default: false
      },
      resolvedAt: Date
    }],
    history: [{
      alertId: String,
      type: String,
      severity: String,
      message: String,
      createdAt: Date,
      resolvedAt: Date,
      resolution: String
    }]
  },
  analytics: {
    dailyStats: {
      sessionsToday: {
        type: Number,
        default: 0
      },
      revenueToday: {
        type: Number,
        default: 0
      },
      energyDispensedToday: {
        type: Number,
        default: 0
      },
      avgWaitTimeToday: {
        type: Number,
        default: 0
      }
    },
    weeklyStats: {
      sessionsThisWeek: {
        type: Number,
        default: 0
      },
      revenueThisWeek: {
        type: Number,
        default: 0
      },
      peakHours: [String],
      popularDays: [String]
    },
    predictions: {
      nextHourDemand: {
        type: Number,
        default: 0
      },
      stockoutRisk: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
      },
      maintenanceNeeded: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
      },
      lastPredictionUpdate: {
        type: Date,
        default: Date.now
      }
    }
  }
}, {
  timestamps: true,
  collection: 'stationStates'
});

// Create geospatial index for location-based queries
StationStateSchema.index({ location: '2dsphere' });
StationStateSchema.index({ city: 1, stationType: 1 });
StationStateSchema.index({ 'operationalStatus.status': 1 });
StationStateSchema.index({ 'realTimeData.lastUpdated': -1 });
StationStateSchema.index({ 'alerts.active.severity': 1, 'alerts.active.acknowledged': 1 });

// Virtual for station utilization percentage
StationStateSchema.virtual('utilizationPercentage').get(function() {
  if (this.capacity === 0) return 0;
  const occupiedSlots = this.capacity - this.realTimeData.availableSlots;
  return Math.round((occupiedSlots / this.capacity) * 100);
});

// Virtual for inventory status
StationStateSchema.virtual('inventoryStatus').get(function() {
  const percentage = (this.realTimeData.currentInventory / this.maxInventory) * 100;
  if (percentage <= 10) return 'critical';
  if (percentage <= 25) return 'low';
  if (percentage <= 50) return 'medium';
  return 'good';
});

// Method to update real-time data
StationStateSchema.methods.updateRealTimeData = function(data) {
  const updates = {
    'realTimeData.lastUpdated': new Date()
  };
  
  Object.keys(data).forEach(key => {
    if (this.realTimeData[key] !== undefined) {
      updates[`realTimeData.${key}`] = data[key];
    }
  });
  
  return this.updateOne({ $set: updates });
};

// Method to add alert
StationStateSchema.methods.addAlert = function(alertData) {
  const alert = {
    alertId: `ALT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: alertData.type,
    severity: alertData.severity,
    message: alertData.message,
    timestamp: new Date(),
    acknowledged: false
  };
  
  return this.updateOne({
    $push: { 'alerts.active': alert }
  });
};

// Method to acknowledge alert
StationStateSchema.methods.acknowledgeAlert = function(alertId) {
  return this.updateOne({
    $set: { 'alerts.active.$.acknowledged': true }
  }, {
    arrayFilters: [{ 'alert.alertId': alertId }]
  });
};

// Method to resolve alert
StationStateSchema.methods.resolveAlert = function(alertId, resolution) {
  const resolvedAt = new Date();
  
  // Move to history and remove from active
  return this.updateOne({
    $pull: { 'alerts.active': { alertId: alertId } },
    $push: {
      'alerts.history': {
        alertId: alertId,
        resolvedAt: resolvedAt,
        resolution: resolution
      }
    }
  });
};

// Method to update agent action
StationStateSchema.methods.updateAgentAction = function(agent, actionData) {
  const update = {};
  update[`agentActions.last${agent}Action`] = {
    ...actionData,
    timestamp: new Date()
  };
  
  return this.updateOne({ $set: update });
};

// Method to update daily stats
StationStateSchema.methods.updateDailyStats = function(statsData) {
  const updates = {};
  Object.keys(statsData).forEach(key => {
    if (this.analytics.dailyStats[key] !== undefined) {
      updates[`analytics.dailyStats.${key}`] = statsData[key];
    }
  });
  
  return this.updateOne({ $set: updates });
};

export default mongoose.model('StationState', StationStateSchema);