import DecisionLog from "../models/DecisionLog.js";
import explainabilityService from "./explainability.js";
import blockchainService from "./blockchainService.js";

class DecisionLogger {
  // Log agent decision with explainability and blockchain audit
  async logDecision(decisionData, io = null) {
    try {
      console.log(
        `[DecisionLogger] Logging decision: ${decisionData.agent} - ${decisionData.action}`,
      );

      // Generate human-readable explanation using Groq
      let explanation = null;
      let explanationError = null;

      try {
        const explanationResult =
          await explainabilityService.generateExplanation({
            stationState: decisionData.context?.stationContext || {},
            prediction:
              decisionData.predictionInsights || decisionData.mlMetrics,
            agentAction: decisionData.action,
            agent: decisionData.agent,
            stationId: decisionData.stationId,
            context: decisionData.context,
            impact: decisionData.impact,
            confidence: decisionData.mlMetrics?.confidenceScore || 0.7,
            riskScore: decisionData.impact?.riskScore || 0.3,
          });

        if (explanationResult.success) {
          explanation = explanationResult.explanation;
          console.log(
            `[DecisionLogger] Generated explanation for ${decisionData.agent}`,
          );
        } else {
          explanationError = explanationResult.error;
          explanation = explanationResult.explanation; // Fallback explanation
          console.warn(
            `[DecisionLogger] Explanation generation failed, using fallback`,
          );
        }
      } catch (error) {
        explanationError = error.message;
        explanation = `Decision executed by ${decisionData.agent}: ${decisionData.action}. System analysis determined this was the optimal action based on current conditions.`;
        console.error(`[DecisionLogger] Explanation service error:`, error);
      }

      // Create decision log entry
      const logEntry = {
        decisionId: decisionData.decisionId || `DEC_${Date.now()}`,
        timestamp: decisionData.timestamp || new Date(),
        stationId: decisionData.stationId,
        agent: decisionData.agent,
        action: decisionData.action,
        triggerEvent: decisionData.triggerEvent || "system_alert",
        context: decisionData.context || {},
        mlMetrics: decisionData.mlMetrics || {
          confidenceScore: 0.7,
          executionTime: 0,
          modelVersion: "1.0.0",
        },
        impact: decisionData.impact || {
          costImpact: 0,
          revenueImpact: 0,
          successRate: 0.8,
          userSatisfaction: 0.8,
          riskScore: 0.3,
        },
        systemMetrics: decisionData.systemMetrics || {
          cpuUsage: 50,
          memoryUsage: 60,
          apiCalls: 1,
        },
        priority: decisionData.priority || "medium",
        explanation: explanation, // Human-readable explanation
        explanationGenerated: !!explanation,
        explanationError: explanationError,
      };

      // Attempt blockchain audit (don't fail if blockchain is unavailable)
      let blockchainHash = null;
      let transactionHash = null;

      try {
        // Use recordAgent method instead of auditDecision
        const auditResult = await blockchainService.recordAgent(
          logEntry.stationId,
          logEntry.action,
          explanation || 'No explanation available',
          logEntry.mlMetrics?.confidenceScore || 0.7,
          5 // autonomy level
        );
        
        if (auditResult.success) {
          blockchainHash = auditResult.hash;
          logEntry.blockchainHash = blockchainHash;
          logEntry.auditHash = blockchainHash;
          console.log(
            `[DecisionLogger] Blockchain audit completed: ${blockchainHash}`,
          );
        } else {
          console.warn(
            `[DecisionLogger] Blockchain audit failed: ${auditResult.error}`,
          );
        }
      } catch (blockchainError) {
        console.warn(
          `[DecisionLogger] Blockchain service unavailable:`,
          blockchainError.message,
        );
      }

      // Save to database
      const savedDecision = await DecisionLog.create(logEntry);

      // Emit real-time notification if socket.io is available
      if (io) {
        io.emit("decision_logged", {
          decisionId: savedDecision.decisionId,
          agent: savedDecision.agent,
          action: savedDecision.action,
          stationId: savedDecision.stationId,
          explanation: explanation,
          timestamp: savedDecision.timestamp,
          impact: savedDecision.impact,
          blockchainVerified: !!transactionHash,
        });
      }

      console.log(
        `[DecisionLogger] Decision logged successfully: ${savedDecision.decisionId}`,
      );

      return {
        success: true,
        decisionId: savedDecision.decisionId,
        explanation: explanation,
        blockchainHash: blockchainHash,
        transactionHash: transactionHash,
        explanationGenerated: !!explanation,
        timestamp: savedDecision.timestamp,
      };
    } catch (error) {
      console.error(`[DecisionLogger] Failed to log decision:`, error);

      return {
        success: false,
        error: error.message,
        decisionId: decisionData.decisionId || null,
      };
    }
  }

  // Batch log multiple decisions
  async logBatchDecisions(decisionsArray, io = null) {
    const results = [];

    for (const decisionData of decisionsArray) {
      try {
        const result = await this.logDecision(decisionData, io);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          decisionId: decisionData.decisionId || null,
        });
      }
    }

    return {
      success: true,
      results,
      totalProcessed: results.length,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
    };
  }

  // Get decision logs with explanations
  async getDecisionLogs(filters = {}, options = {}) {
    try {
      const { stationId, agent, startDate, endDate, priority, hasExplanation } =
        filters;

      const {
        limit = 50,
        skip = 0,
        sortBy = "timestamp",
        sortOrder = -1,
      } = options;

      // Build query
      const query = {};

      if (stationId) query.stationId = stationId;
      if (agent) query.agent = agent;
      if (priority) query.priority = priority;
      if (hasExplanation !== undefined) {
        query.explanationGenerated = hasExplanation;
      }

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const decisions = await DecisionLog.find(query)
        .sort({ [sortBy]: sortOrder })
        .limit(limit)
        .skip(skip)
        .lean();

      const total = await DecisionLog.countDocuments(query);

      return {
        success: true,
        decisions,
        total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit),
        hasExplanations: decisions.filter((d) => d.explanationGenerated).length,
      };
    } catch (error) {
      console.error(`[DecisionLogger] Failed to get decision logs:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get decision by ID with full explanation
  async getDecisionById(decisionId) {
    try {
      const decision = await DecisionLog.findOne({ decisionId }).lean();

      if (!decision) {
        return {
          success: false,
          error: "Decision not found",
        };
      }

      return {
        success: true,
        decision,
      };
    } catch (error) {
      console.error(`[DecisionLogger] Failed to get decision:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get decision statistics
  async getDecisionStats(timeRange = "24h") {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case "1h":
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const pipeline = [
        {
          $match: {
            timestamp: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            totalDecisions: { $sum: 1 },
            agentBreakdown: {
              $push: "$agent",
            },
            avgConfidence: {
              $avg: "$mlMetrics.confidenceScore",
            },
            avgRiskScore: {
              $avg: "$impact.riskScore",
            },
            totalCostImpact: {
              $sum: "$impact.costImpact",
            },
            totalRevenueImpact: {
              $sum: "$impact.revenueImpact",
            },
            explanationsGenerated: {
              $sum: { $cond: ["$explanationGenerated", 1, 0] },
            },
            blockchainAudited: {
              $sum: { $cond: [{ $ne: ["$transactionHash", null] }, 1, 0] },
            },
          },
        },
      ];

      const stats = await DecisionLog.aggregate(pipeline);

      if (stats.length === 0) {
        return {
          success: true,
          stats: {
            totalDecisions: 0,
            agentBreakdown: {},
            avgConfidence: 0,
            avgRiskScore: 0,
            totalCostImpact: 0,
            totalRevenueImpact: 0,
            explanationsGenerated: 0,
            blockchainAudited: 0,
            timeRange,
          },
        };
      }

      const result = stats[0];

      // Process agent breakdown
      const agentBreakdown = {};
      result.agentBreakdown.forEach((agent) => {
        agentBreakdown[agent] = (agentBreakdown[agent] || 0) + 1;
      });

      return {
        success: true,
        stats: {
          totalDecisions: result.totalDecisions,
          agentBreakdown,
          avgConfidence: Math.round((result.avgConfidence || 0) * 100) / 100,
          avgRiskScore: Math.round((result.avgRiskScore || 0) * 100) / 100,
          totalCostImpact: Math.round(result.totalCostImpact || 0),
          totalRevenueImpact: Math.round(result.totalRevenueImpact || 0),
          explanationsGenerated: result.explanationsGenerated,
          blockchainAudited: result.blockchainAudited,
          explanationRate: Math.round(
            (result.explanationsGenerated / result.totalDecisions) * 100,
          ),
          blockchainRate: Math.round(
            (result.blockchainAudited / result.totalDecisions) * 100,
          ),
          timeRange,
        },
      };
    } catch (error) {
      console.error(`[DecisionLogger] Failed to get decision stats:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Re-generate explanation for existing decision
  async regenerateExplanation(decisionId) {
    try {
      const decision = await DecisionLog.findOne({ decisionId });

      if (!decision) {
        return {
          success: false,
          error: "Decision not found",
        };
      }

      // Generate new explanation
      const explanationResult = await explainabilityService.generateExplanation(
        {
          stationState: decision.context?.stationContext || {},
          prediction: decision.mlMetrics,
          agentAction: decision.action,
          agent: decision.agent,
          stationId: decision.stationId,
          context: decision.context,
          impact: decision.impact,
          confidence: decision.mlMetrics?.confidenceScore || 0.7,
          riskScore: decision.impact?.riskScore || 0.3,
        },
      );

      // Update decision with new explanation
      decision.explanation = explanationResult.explanation;
      decision.explanationGenerated = explanationResult.success;
      decision.explanationError = explanationResult.success
        ? null
        : explanationResult.error;
      decision.explanationRegeneratedAt = new Date();

      await decision.save();

      return {
        success: true,
        decisionId,
        explanation: explanationResult.explanation,
        explanationGenerated: explanationResult.success,
      };
    } catch (error) {
      console.error(
        `[DecisionLogger] Failed to regenerate explanation:`,
        error,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Create singleton instance
const decisionLogger = new DecisionLogger();

export default decisionLogger;
