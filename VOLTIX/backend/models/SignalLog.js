import mongoose from 'mongoose';

const SignalLogSchema = new mongoose.Schema({
  signalId: {
    type: String,
    required: true,
    unique: true,
    match: /^SIG_\d{6}$/
  },
  stationId: {
    type: String,
    required: true,
    ref: 'StationState'
  },
  timestamp: {
    type: Date,
    required: true
  },
  sensorData: {
    temperature: {
      type: Number,
      required: true,
      min: -50,
      max: 150
    },
    voltage: {
      type: Number,
      required: true,
      min: 0,
      max: 500
    },
    current: {
      type: Number,
      required: true,
      min: 0,
      max: 200
    },
    vibration: {
      type: Number,
      required: true,
      min: 0,
      max: 5.0
    },
    humidity: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    powerFactor: {
      type: Number,
      default: 0.95,
      min: 0,
      max: 1
    },
    frequency: {
      type: Number,
      default: 50,
      min: 45,
      max: 55
    }
  },
  performance: {
    uptime: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    errorRate: {
      type: Number,
      required: true,
      min: 0
    },
    responseTime: {
      type: Number,
      default: 0,
      min: 0
    },
    throughput: {
      type: Number,
      default: 0,
      min: 0
    },
    efficiency: {
      type: Number,
      default: 95,
      min: 0,
      max: 100
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['normal', 'warning', 'critical', 'offline', 'maintenance']
  },
  chargingData: {
    activeSessions: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPowerOutput: {
      type: Number,
      default: 0,
      min: 0
    },
    avgChargingRate: {
      type: Number,
      default: 0,
      min: 0
    },
    peakDemand: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  environmentalData: {
    ambientTemperature: {
      type: Number,
      default: 25
    },
    weatherCondition: {
      type: String,
      enum: ['sunny', 'cloudy', 'rainy', 'stormy', 'foggy'],
      default: 'sunny'
    },
    airQuality: {
      type: Number,
      default: 50,
      min: 0,
      max: 500
    }
  },
  mlPredictions: {
    failureProbability: {
      type: Number,
      min: 0,
      max: 1
    },
    anomalyScore: {
      type: Number,
      min: 0,
      max: 1
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    predictedDemand: {
      type: Number,
      min: 0
    },
    recommendedAction: {
      type: String,
      enum: ['none', 'monitor', 'maintenance', 'restart', 'shutdown', 'dispatch']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    modelVersion: {
      type: String,
      default: '1.0.0'
    }
  },
  alerts: [{
    alertType: {
      type: String,
      enum: ['temperature', 'voltage', 'current', 'vibration', 'performance', 'anomaly']
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical']
    },
    message: String,
    threshold: Number,
    actualValue: Number,
    triggered: {
      type: Boolean,
      default: false
    }
  }],
  metadata: {
    source: {
      type: String,
      enum: ['sensor', 'api', 'manual', 'simulation'],
      default: 'sensor'
    },
    dataQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    processingTime: {
      type: Number,
      default: 0
    },
    batchId: String,
    correlationId: String
  }
}, {
  timestamps: true,
  collection: 'signalLogs'
});

// Compound indexes for efficient querying
SignalLogSchema.index({ stationId: 1, timestamp: -1 });
SignalLogSchema.index({ status: 1, timestamp: -1 });
SignalLogSchema.index({ 'mlPredictions.riskLevel': 1, timestamp: -1 });
SignalLogSchema.index({ 'mlPredictions.failureProbability': -1, timestamp: -1 });
SignalLogSchema.index({ 'sensorData.temperature': 1, timestamp: -1 });
SignalLogSchema.index({ 'performance.uptime': 1, timestamp: -1 });

// Time-series collection optimization
SignalLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days retention

// Virtual for overall health score
SignalLogSchema.virtual('healthScore').get(function() {
  const weights = {
    temperature: 0.2,
    voltage: 0.25,
    current: 0.15,
    vibration: 0.15,
    uptime: 0.25
  };
  
  // Normalize values to 0-1 scale
  const tempScore = Math.max(0, 1 - Math.abs(this.sensorData.temperature - 25) / 50);
  const voltageScore = Math.max(0, 1 - Math.abs(this.sensorData.voltage - 220) / 50);
  const currentScore = Math.min(1, this.sensorData.current / 50);
  const vibrationScore = Math.max(0, 1 - this.sensorData.vibration / 2);
  const uptimeScore = this.performance.uptime / 100;
  
  return (
    tempScore * weights.temperature +
    voltageScore * weights.voltage +
    currentScore * weights.current +
    vibrationScore * weights.vibration +
    uptimeScore * weights.uptime
  );
});

// Virtual for critical alerts count
SignalLogSchema.virtual('criticalAlertsCount').get(function() {
  return this.alerts.filter(alert => alert.severity === 'critical' && alert.triggered).length;
});

// Method to check thresholds and generate alerts
SignalLogSchema.methods.checkThresholds = function() {
  const alerts = [];
  
  // Temperature threshold
  if (this.sensorData.temperature > 70) {
    alerts.push({
      alertType: 'temperature',
      severity: this.sensorData.temperature > 85 ? 'critical' : 'warning',
      message: `High temperature detected: ${this.sensorData.temperature}°C`,
      threshold: 70,
      actualValue: this.sensorData.temperature,
      triggered: true
    });
  }
  
  // Voltage threshold
  if (this.sensorData.voltage < 200 || this.sensorData.voltage > 240) {
    alerts.push({
      alertType: 'voltage',
      severity: (this.sensorData.voltage < 180 || this.sensorData.voltage > 250) ? 'critical' : 'warning',
      message: `Voltage out of range: ${this.sensorData.voltage}V`,
      threshold: this.sensorData.voltage < 200 ? 200 : 240,
      actualValue: this.sensorData.voltage,
      triggered: true
    });
  }
  
  // Vibration threshold
  if (this.sensorData.vibration > 1.5) {
    alerts.push({
      alertType: 'vibration',
      severity: this.sensorData.vibration > 2.0 ? 'critical' : 'warning',
      message: `High vibration detected: ${this.sensorData.vibration}G`,
      threshold: 1.5,
      actualValue: this.sensorData.vibration,
      triggered: true
    });
  }
  
  // Uptime threshold
  if (this.performance.uptime < 95) {
    alerts.push({
      alertType: 'performance',
      severity: this.performance.uptime < 85 ? 'critical' : 'warning',
      message: `Low uptime: ${this.performance.uptime}%`,
      threshold: 95,
      actualValue: this.performance.uptime,
      triggered: true
    });
  }
  
  this.alerts = alerts;
  return alerts;
};

// Method to calculate anomaly score
SignalLogSchema.methods.calculateAnomalyScore = function() {
  // Simple anomaly detection based on deviation from normal ranges
  let anomalyScore = 0;
  let factors = 0;
  
  // Temperature anomaly (normal: 20-30°C)
  if (this.sensorData.temperature < 20 || this.sensorData.temperature > 30) {
    anomalyScore += Math.abs(this.sensorData.temperature - 25) / 25;
    factors++;
  }
  
  // Voltage anomaly (normal: 210-230V)
  if (this.sensorData.voltage < 210 || this.sensorData.voltage > 230) {
    anomalyScore += Math.abs(this.sensorData.voltage - 220) / 220;
    factors++;
  }
  
  // Vibration anomaly (normal: 0-0.5G)
  if (this.sensorData.vibration > 0.5) {
    anomalyScore += this.sensorData.vibration / 2;
    factors++;
  }
  
  // Performance anomaly (normal: >95% uptime)
  if (this.performance.uptime < 95) {
    anomalyScore += (95 - this.performance.uptime) / 95;
    factors++;
  }
  
  return factors > 0 ? Math.min(1, anomalyScore / factors) : 0;
};

// Static method to get latest signals for a station
SignalLogSchema.statics.getLatestForStation = function(stationId, limit = 10) {
  return this.find({ stationId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

// Static method to get signals by time range
SignalLogSchema.statics.getByTimeRange = function(stationId, startTime, endTime) {
  return this.find({
    stationId,
    timestamp: {
      $gte: startTime,
      $lte: endTime
    }
  }).sort({ timestamp: 1 }).exec();
};

// Static method to get critical signals
SignalLogSchema.statics.getCriticalSignals = function(limit = 50) {
  return this.find({
    $or: [
      { status: 'critical' },
      { 'mlPredictions.riskLevel': 'critical' },
      { 'mlPredictions.failureProbability': { $gte: 0.8 } }
    ]
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .exec();
};

export default mongoose.model('SignalLog', SignalLogSchema);