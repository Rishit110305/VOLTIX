import express from 'express';
import decisionLogger from '../services/decisionLogger.js';
import blockchainService from '../services/blockchainService.js';
import explainabilityService from '../services/explainability.js';
import wrapAsync from '../middlewares/wrapAsync.js';
import { userAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get decision logs with filters and pagination
router.get('/', wrapAsync(async (req, res) => {
  const filters = {
    stationId: req.query.stationId,
    agent: req.query.agent,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    priority: req.query.priority,
    hasExplanation: req.query.hasExplanation === 'true' ? true : 
                   req.query.hasExplanation === 'false' ? false : undefined,
    status: req.query.status,
    hasBlockchain: req.query.hasBlockchain === 'true' ? true :
                   req.query.hasBlockchain === 'false' ? false : undefined
  };

  const options = {
    limit: parseInt(req.query.limit) || 50,
    skip: parseInt(req.query.skip) || 0,
    sortBy: req.query.sortBy || 'timestamp',
    sortOrder: parseInt(req.query.sortOrder) || -1
  };

  const result = await decisionLogger.getDecisionLogs(filters, options);
  
  res.status(result.success ? 200 : 500).json({
    success: result.success,
    data: result.success ? {
      decisions: result.decisions,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: options.limit,
        skip: options.skip
      },
      stats: {
        hasExplanations: result.hasExplanations,
        totalDecisions: result.total
      }
    } : null,
    message: result.success ? 'Decisions retrieved successfully' : result.error
  });
}));

// Get decision by ID
router.get('/:decisionId', wrapAsync(async (req, res) => {
  const { decisionId } = req.params;
  const result = await decisionLogger.getDecisionById(decisionId);
  
  res.status(result.success ? 200 : 404).json({
    success: result.success,
    data: result.success ? result.decision : null,
    message: result.success ? 'Decision retrieved successfully' : result.error
  });
}));

// Get decision statistics
router.get('/stats/overview', wrapAsync(async (req, res) => {
  const timeRange = req.query.timeRange || '24h';
  const result = await decisionLogger.getDecisionStats(timeRange);
  
  res.status(result.success ? 200 : 500).json({
    success: result.success,
    data: result.success ? result.stats : null,
    message: result.success ? 'Decision statistics retrieved' : result.error
  });
}));

// Verify decision blockchain integrity
router.get('/:decisionId/verify', wrapAsync(async (req, res) => {
  const { decisionId } = req.params;
  const result = await blockchainService.verifyDecision(decisionId);
  
  res.status(result.success ? 200 : 404).json({
    success: result.success,
    data: result.success ? result.verification : null,
    message: result.success ? 'Decision verification completed' : result.error
  });
}));

// Regenerate explanation for a decision
router.post('/:decisionId/regenerate-explanation', userAuth, wrapAsync(async (req, res) => {
  const { decisionId } = req.params;
  const result = await decisionLogger.regenerateExplanation(decisionId);
  
  res.status(result.success ? 200 : 404).json({
    success: result.success,
    data: result.success ? {
      decisionId: result.decisionId,
      explanation: result.explanation,
      explanationGenerated: result.explanationGenerated
    } : null,
    message: result.success ? 'Explanation regenerated successfully' : result.error
  });
}));

// Get decisions by agent
router.get('/agent/:agentName', wrapAsync(async (req, res) => {
  const { agentName } = req.params;
  const limit = parseInt(req.query.limit) || 100;
  
  try {
    const decisions = await decisionLogger.constructor.getByAgent(agentName, limit);
    
    res.json({
      success: true,
      data: {
        agent: agentName,
        decisions,
        total: decisions.length
      },
      message: `Decisions for ${agentName} retrieved successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Failed to get decisions for ${agentName}: ${error.message}`
    });
  }
}));

// Get failed decisions
router.get('/status/failed', wrapAsync(async (req, res) => {
  const timeRange = parseInt(req.query.timeRange) || 24; // hours
  
  try {
    const decisions = await decisionLogger.constructor.getFailedDecisions(timeRange);
    
    res.json({
      success: true,
      data: {
        decisions,
        total: decisions.length,
        timeRange: `${timeRange} hours`
      },
      message: 'Failed decisions retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Failed to get failed decisions: ${error.message}`
    });
  }
}));

// Get high-risk decisions
router.get('/risk/high', wrapAsync(async (req, res) => {
  const riskThreshold = parseFloat(req.query.threshold) || 0.7;
  
  try {
    const decisions = await decisionLogger.constructor.getHighRiskDecisions(riskThreshold);
    
    res.json({
      success: true,
      data: {
        decisions,
        total: decisions.length,
        riskThreshold
      },
      message: 'High-risk decisions retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Failed to get high-risk decisions: ${error.message}`
    });
  }
}));

// Get performance analytics for an agent
router.get('/analytics/:agentName', wrapAsync(async (req, res) => {
  const { agentName } = req.params;
  const timeRange = parseInt(req.query.timeRange) || 168; // hours (1 week)
  
  try {
    const analytics = await decisionLogger.constructor.getPerformanceAnalytics(agentName, timeRange);
    
    res.json({
      success: true,
      data: {
        agent: agentName,
        analytics: analytics[0] || {
          totalDecisions: 0,
          successfulDecisions: 0,
          avgConfidence: 0,
          avgExecutionTime: 0,
          totalCostImpact: 0,
          totalRevenueImpact: 0,
          avgUserSatisfaction: 0,
          complianceViolations: 0
        },
        timeRange: `${timeRange} hours`
      },
      message: `Performance analytics for ${agentName} retrieved successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `Failed to get analytics for ${agentName}: ${error.message}`
    });
  }
}));

// Batch log decisions (for testing/demo)
router.post('/batch', userAuth, wrapAsync(async (req, res) => {
  const { decisions } = req.body;
  const io = req.app.get('io');
  
  if (!Array.isArray(decisions)) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Decisions must be an array'
    });
  }
  
  const result = await decisionLogger.logBatchDecisions(decisions, io);
  
  res.status(result.success ? 201 : 500).json({
    success: result.success,
    data: result.success ? {
      totalProcessed: result.totalProcessed,
      successCount: result.successCount,
      failureCount: result.failureCount,
      results: result.results
    } : null,
    message: result.success ? 
      `Batch logged ${result.successCount}/${result.totalProcessed} decisions` : 
      'Batch logging failed'
  });
}));

// Manual decision logging (for testing)
router.post('/', userAuth, wrapAsync(async (req, res) => {
  const io = req.app.get('io');
  const result = await decisionLogger.logDecision(req.body, io);
  
  res.status(result.success ? 201 : 500).json({
    success: result.success,
    data: result.success ? {
      decisionId: result.decisionId,
      explanation: result.explanation,
      blockchainHash: result.blockchainHash,
      transactionHash: result.transactionHash,
      explanationGenerated: result.explanationGenerated,
      timestamp: result.timestamp
    } : null,
    message: result.success ? 'Decision logged successfully' : result.error
  });
}));

export default router;