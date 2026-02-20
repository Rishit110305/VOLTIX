import crypto from "crypto";
import blockchainConfig from "../config/blockchain.js";
import DecisionLog from "../models/DecisionLog.js";

class BlockchainService {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize blockchain service
  async initialize() {
    try {
      const result = await blockchainConfig.initialize();
      this.isInitialized = result.success;
      console.log('✅ Crypto hashing service ready');
      return result;
    } catch (error) {
      console.log('⚠️ Crypto service error:', error.message);
      this.isInitialized = false;
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate hash for audit data
  generateAuditHash(data) {
    const auditData = {
      agent: data.agent,
      stationId: data.stationId,
      action: data.action,
      timestamp: data.timestamp,
      context: data.context,
      mlMetrics: data.mlMetrics,
      impact: data.impact
    };

    return crypto
      .createHash("sha256")
      .update(JSON.stringify(auditData))
      .digest("hex");
  }

  // Record agent decision (crypto hash only, no blockchain)
  async recordAgent(stationId, action, reasoning, confidence, autonomyLevel) {
    try {
      const auditData = {
        agent: "Agent",
        stationId,
        action,
        reasoning,
        confidence,
        autonomyLevel,
        timestamp: new Date().toISOString()
      };

      const hash = this.generateAuditHash(auditData);

      console.log(`✅ Decision hashed: ${hash.substring(0, 16)}...`);

      return {
        success: true,
        hash,
        message: "Decision hashed successfully"
      };
    } catch (error) {
      console.error("❌ Hashing error:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify decision integrity
  async verifyDecision(decisionId) {
    try {
      const decision = await DecisionLog.findOne({ decisionId });

      if (!decision) {
        return {
          success: false,
          error: "Decision not found"
        };
      }

      // Verify hash
      const expectedHash = this.generateAuditHash({
        agent: decision.agent,
        stationId: decision.stationId,
        action: decision.action,
        timestamp: decision.timestamp,
        context: decision.context,
        mlMetrics: decision.mlMetrics,
        impact: decision.impact
      });

      const hashMatch = decision.auditHash === expectedHash;

      return {
        success: true,
        verification: {
          decisionId,
          hashMatch,
          storedHash: decision.auditHash,
          computedHash: expectedHash,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error("❌ Verification error:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get audit trail
  async getAuditTrail(filters = {}) {
    try {
      const query = {};
      
      if (filters.agent) query.agent = filters.agent;
      if (filters.stationId) query.stationId = filters.stationId;
      if (filters.startDate) query.timestamp = { $gte: new Date(filters.startDate) };
      if (filters.endDate) {
        query.timestamp = { ...query.timestamp, $lte: new Date(filters.endDate) };
      }

      const decisions = await DecisionLog.find(query)
        .sort({ timestamp: -1 })
        .limit(filters.limit || 100)
        .select('decisionId agent stationId action timestamp auditHash')
        .lean();

      return {
        success: true,
        data: {
          decisions,
          total: decisions.length
        }
      };
    } catch (error) {
      console.error("❌ Audit trail error:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get audit statistics
  async getAuditStats() {
    try {
      const totalDecisions = await DecisionLog.countDocuments();
      const recentDecisions = await DecisionLog.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      return {
        success: true,
        stats: {
          database: {
            totalDecisions,
            recentDecisions
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("❌ Audit stats failed:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Search audit logs
  async searchAuditLogs(filters = {}) {
    try {
      const query = {};

      if (filters.agent) query.agent = filters.agent;
      if (filters.stationId) query.stationId = filters.stationId;
      if (filters.action) query.action = { $regex: filters.action, $options: 'i' };
      if (filters.startDate) query.timestamp = { $gte: new Date(filters.startDate) };
      if (filters.endDate) {
        query.timestamp = { ...query.timestamp, $lte: new Date(filters.endDate) };
      }

      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const skip = (page - 1) * limit;

      const decisions = await DecisionLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      const total = await DecisionLog.countDocuments(query);

      return {
        success: true,
        decisions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error("❌ Audit search failed:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const dbHealth = await DecisionLog.countDocuments();

      return {
        success: true,
        database: {
          status: 'healthy',
          totalDecisions: dbHealth
        },
        service: {
          initialized: this.isInitialized,
          status: 'healthy'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

const blockchainService = new BlockchainService();
export default blockchainService;
