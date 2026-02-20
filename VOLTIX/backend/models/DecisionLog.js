import mongoose from "mongoose";

const DecisionLogSchema = new mongoose.Schema(
  {
    decisionId: {
      type: String,
      required: true,
      unique: true,
      match: /^DEC_\d+_[a-z0-9]+$/, // Updated to match DEC_timestamp_randomstring format
    },
    timestamp: {
      type: Date,
      required: true,
    },
    stationId: {
      type: String,
      required: true,
      ref: "StationState",
    },
    agent: {
      type: String,
      required: true,
      enum: [
        "MechanicAgent",
        "TrafficAgent",
        "LogisticsAgent",
        "EnergyAgent",
        "AuditorAgent",
        // Also accept lowercase versions
        "mechanic",
        "traffic",
        "logistics",
        "energy",
        "audit",
        "auditor",
        "supervisor"
      ],
    },
    action: {
      type: String,
      required: true,
    },
    triggerEvent: {
      type: String,
      required: true,
      enum: [
        "routine_monitoring",
        "threshold_breach",
        "user_request",
        "system_alert",
        "external_event",
        "scheduled_task",
        "emergency",
        "agent_cycle", // Add this for agent cycles
        "periodic_check",
        "manual_trigger"
      ],
    },
    context: {
      inputData: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
      environmentalFactors: {
        weather: String,
        timeOfDay: String,
        dayOfWeek: String,
        isHoliday: Boolean,
        nearbyEvents: [String],
      },
      stationContext: {
        currentLoad: Number,
        queueLength: Number,
        inventoryLevel: Number,
        recentAlerts: [String],
      },
    },
    mlMetrics: {
      confidenceScore: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      executionTime: {
        type: Number,
        required: true,
        min: 0,
      },
      modelVersion: {
        type: String,
        default: "1.0.0",
      },
      featuresUsed: [String],
      predictionAccuracy: {
        type: Number,
        min: 0,
        max: 1,
      },
    },
    impact: {
      costImpact: {
        type: Number,
        required: true,
      },
      revenueImpact: {
        type: Number,
        required: true,
      },
      successRate: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      userSatisfaction: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      riskScore: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      environmentalImpact: {
        carbonSaved: {
          type: Number,
          default: 0,
        },
        energyEfficiency: {
          type: Number,
          default: 0,
        },
      },
    },
    systemMetrics: {
      cpuUsage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      memoryUsage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      apiCalls: {
        type: Number,
        required: true,
        min: 0,
      },
      networkLatency: {
        type: Number,
        default: 0,
      },
      databaseQueries: {
        type: Number,
        default: 0,
      },
    },
    execution: {
      status: {
        type: String,
        enum: [
          "pending",
          "in_progress",
          "completed",
          "failed",
          "cancelled",
          "timeout",
        ],
        default: "pending",
      },
      startTime: {
        type: Date,
        default: Date.now,
      },
      endTime: Date,
      steps: [
        {
          stepName: String,
          status: {
            type: String,
            enum: ["pending", "completed", "failed", "skipped"],
          },
          duration: Number,
          output: mongoose.Schema.Types.Mixed,
          error: String,
        },
      ],
      retryCount: {
        type: Number,
        default: 0,
      },
      rollbackRequired: {
        type: Boolean,
        default: false,
      },
    },
    humanOverride: {
      type: Boolean,
      default: false,
    },
    overrideDetails: {
      overriddenBy: String,
      overrideReason: String,
      overrideTimestamp: Date,
      originalDecision: String,
      newDecision: String,
    },
    approvedBySupervisor: {
      type: Boolean,
      default: true,
    },
    supervisorDetails: {
      supervisorId: String,
      approvalTimestamp: Date,
      approvalReason: String,
      conditions: [String],
    },
    auditResults: {
      anomalyDetected: {
        type: Boolean,
        default: false,
      },
      complianceViolation: {
        type: Boolean,
        default: false,
      },
      auditScore: {
        type: Number,
        min: 0,
        max: 1,
      },
      riskAssessment: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
      },
      requiredActions: [String],
      auditTrail: [
        {
          checkType: String,
          result: String,
          details: String,
          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    feedback: {
      userFeedback: [
        {
          userId: String,
          rating: {
            type: Number,
            min: 1,
            max: 5,
          },
          comment: String,
          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      systemFeedback: {
        effectiveness: {
          type: Number,
          min: 0,
          max: 1,
        },
        efficiency: {
          type: Number,
          min: 0,
          max: 1,
        },
        learningPoints: [String],
      },
    },
    relatedDecisions: [
      {
        decisionId: String,
        relationship: {
          type: String,
          enum: ["caused_by", "triggered", "conflicted_with", "supported_by"],
        },
        timestamp: Date,
      },
    ],
    tags: [String],
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    // BLOCKCHAIN AUDIT FIELDS
    auditHash: {
      type: String,
      required: false, // Will be added by auditor
      index: true,
    },
    blockchainTx: {
      type: String,
      required: false, // Transaction hash from blockchain
      index: true,
    },
    blockNumber: {
      type: Number,
      required: false, // Block number where transaction was mined
    },
    auditedAt: {
      type: Date,
      required: false, // When the audit was completed
    },
    // EXPLAINABILITY FIELDS
    explanation: {
      type: String,
      required: false, // Human-readable explanation of the decision
    },
    explanationGenerated: {
      type: Boolean,
      default: false, // Whether explanation was successfully generated
    },
    explanationError: {
      type: String,
      required: false, // Error message if explanation generation failed
    },
    explanationRegeneratedAt: {
      type: Date,
      required: false, // When explanation was last regenerated
    },
    blockchainHash: {
      type: String,
      required: false, // Hash used for blockchain audit
    },
    transactionHash: {
      type: String,
      required: false, // Blockchain transaction hash
    },
    auditMetrics: {
      quality: {
        score: { type: Number, min: 0, max: 1 },
        grade: { type: String, enum: ["A", "B", "C", "D", "F"] },
        factors: mongoose.Schema.Types.Mixed,
      },
      compliance: {
        status: { type: String, enum: ["COMPLIANT", "NON_COMPLIANT"] },
        violations: [String],
        checks: mongoose.Schema.Types.Mixed,
      },
      risk: {
        level: { type: String, enum: ["LOW", "MEDIUM", "HIGH"] },
        score: { type: Number, min: 0, max: 1 },
        factors: [String],
      },
    },
  },
  {
    timestamps: true,
    collection: "decisionLogs",
  },
);

// Indexes for analytics and auditing
DecisionLogSchema.index({ agent: 1, timestamp: -1 });
DecisionLogSchema.index({ stationId: 1, timestamp: -1 });
DecisionLogSchema.index({ "auditResults.anomalyDetected": 1, timestamp: -1 });
DecisionLogSchema.index({ "impact.riskScore": -1, timestamp: -1 });
DecisionLogSchema.index({ "execution.status": 1, timestamp: -1 });
DecisionLogSchema.index({ triggerEvent: 1, agent: 1, timestamp: -1 });
DecisionLogSchema.index({ "mlMetrics.confidenceScore": -1, timestamp: -1 });
DecisionLogSchema.index({ priority: 1, "execution.status": 1 });

// Time-series optimization
DecisionLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // 1 year retention

// Virtual for decision duration
DecisionLogSchema.virtual("duration").get(function () {
  if (this.execution.endTime && this.execution.startTime) {
    return this.execution.endTime - this.execution.startTime;
  }
  return null;
});

// Virtual for success indicator
DecisionLogSchema.virtual("isSuccessful").get(function () {
  return (
    this.execution.status === "completed" &&
    this.impact.successRate >= 0.8 &&
    !this.auditResults.complianceViolation
  );
});

// Virtual for ROI calculation
DecisionLogSchema.virtual("roi").get(function () {
  const totalCost = Math.abs(this.impact.costImpact);
  const totalRevenue = this.impact.revenueImpact;

  if (totalCost === 0) return totalRevenue > 0 ? Infinity : 0;
  return ((totalRevenue - totalCost) / totalCost) * 100;
});

// Method to update execution status
DecisionLogSchema.methods.updateExecutionStatus = function (
  status,
  details = {},
) {
  const updates = {
    "execution.status": status,
  };

  if (status === "completed" || status === "failed") {
    updates["execution.endTime"] = new Date();
  }

  if (details.steps) {
    updates["execution.steps"] = details.steps;
  }

  if (details.error) {
    updates["execution.error"] = details.error;
  }

  return this.updateOne({ $set: updates });
};

// Method to add execution step
DecisionLogSchema.methods.addExecutionStep = function (stepData) {
  return this.updateOne({
    $push: {
      "execution.steps": {
        stepName: stepData.stepName,
        status: stepData.status || "completed",
        duration: stepData.duration || 0,
        output: stepData.output,
        error: stepData.error,
      },
    },
  });
};

// Method to add user feedback
DecisionLogSchema.methods.addUserFeedback = function (userId, rating, comment) {
  return this.updateOne({
    $push: {
      "feedback.userFeedback": {
        userId,
        rating,
        comment,
        timestamp: new Date(),
      },
    },
  });
};

// Method to link related decision
DecisionLogSchema.methods.linkRelatedDecision = function (
  decisionId,
  relationship,
) {
  return this.updateOne({
    $push: {
      relatedDecisions: {
        decisionId,
        relationship,
        timestamp: new Date(),
      },
    },
  });
};

// Method to calculate effectiveness score
DecisionLogSchema.methods.calculateEffectiveness = function () {
  const weights = {
    successRate: 0.3,
    userSatisfaction: 0.25,
    costEfficiency: 0.2,
    riskMitigation: 0.15,
    complianceScore: 0.1,
  };

  const costEfficiency =
    this.impact.revenueImpact > 0
      ? Math.min(
          1,
          this.impact.revenueImpact / Math.abs(this.impact.costImpact),
        )
      : 0;

  const riskMitigation = 1 - this.impact.riskScore;
  const complianceScore = this.auditResults.complianceViolation ? 0 : 1;

  return (
    this.impact.successRate * weights.successRate +
    this.impact.userSatisfaction * weights.userSatisfaction +
    costEfficiency * weights.costEfficiency +
    riskMitigation * weights.riskMitigation +
    complianceScore * weights.complianceScore
  );
};

// Static method to get decisions by agent
DecisionLogSchema.statics.getByAgent = function (agent, limit = 100) {
  return this.find({ agent }).sort({ timestamp: -1 }).limit(limit).exec();
};

// Static method to get failed decisions
DecisionLogSchema.statics.getFailedDecisions = function (timeRange = 24) {
  const since = new Date(Date.now() - timeRange * 60 * 60 * 1000);

  return this.find({
    timestamp: { $gte: since },
    $or: [
      { "execution.status": "failed" },
      { "impact.successRate": { $lt: 0.5 } },
      { "auditResults.complianceViolation": true },
    ],
  })
    .sort({ timestamp: -1 })
    .exec();
};

// Static method to get high-risk decisions
DecisionLogSchema.statics.getHighRiskDecisions = function (
  riskThreshold = 0.7,
) {
  return this.find({
    "impact.riskScore": { $gte: riskThreshold },
  })
    .sort({ "impact.riskScore": -1, timestamp: -1 })
    .exec();
};

// Static method to get performance analytics
DecisionLogSchema.statics.getPerformanceAnalytics = function (
  agent,
  timeRange = 168,
) {
  const since = new Date(Date.now() - timeRange * 60 * 60 * 1000);

  return this.aggregate([
    {
      $match: {
        agent: agent,
        timestamp: { $gte: since },
      },
    },
    {
      $group: {
        _id: null,
        totalDecisions: { $sum: 1 },
        successfulDecisions: {
          $sum: {
            $cond: [{ $eq: ["$execution.status", "completed"] }, 1, 0],
          },
        },
        avgConfidence: { $avg: "$mlMetrics.confidenceScore" },
        avgExecutionTime: { $avg: "$mlMetrics.executionTime" },
        totalCostImpact: { $sum: "$impact.costImpact" },
        totalRevenueImpact: { $sum: "$impact.revenueImpact" },
        avgUserSatisfaction: { $avg: "$impact.userSatisfaction" },
        complianceViolations: {
          $sum: {
            $cond: ["$auditResults.complianceViolation", 1, 0],
          },
        },
      },
    },
  ]);
};

export default mongoose.model("DecisionLog", DecisionLogSchema);
