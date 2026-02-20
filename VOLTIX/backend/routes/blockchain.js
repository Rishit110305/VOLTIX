import express from 'express';
import blockchainService from '../services/blockchainService.js';
import wrapAsync from '../middlewares/wrapAsync.js';

const router = express.Router();

// Health check endpoint
router.get('/health', wrapAsync(async (req, res) => {
  const health = await blockchainService.healthCheck();
  
  res.status(health.success ? 200 : 503).json({
    success: health.success,
    data: health,
    message: health.success ? 'Blockchain service is healthy' : 'Blockchain service is unhealthy'
  });
}));

// Get audit statistics
router.get('/stats', wrapAsync(async (req, res) => {
  const stats = await blockchainService.getAuditStats();
  
  res.status(stats.success ? 200 : 500).json({
    success: stats.success,
    data: stats.success ? stats.stats : null,
    message: stats.success ? 'Audit statistics retrieved' : 'Failed to get audit statistics'
  });
}));

// Verify a specific decision
router.get('/verify/:decisionId', wrapAsync(async (req, res) => {
  const { decisionId } = req.params;
  
  const verification = await blockchainService.verifyDecision(decisionId);
  
  res.status(verification.success ? 200 : 404).json({
    success: verification.success,
    data: verification.success ? verification : null,
    message: verification.success ? 'Decision verified' : 'Decision verification failed'
  });
}));

// Search audit logs
router.get('/logs', wrapAsync(async (req, res) => {
  const filters = {
    agent: req.query.agent,
    stationId: req.query.stationId,
    action: req.query.action,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    page: req.query.page,
    limit: req.query.limit
  };
  
  const logs = await blockchainService.searchAuditLogs(filters);
  
  res.status(logs.success ? 200 : 500).json({
    success: logs.success,
    data: logs.success ? logs : null,
    message: logs.success ? 'Audit logs retrieved' : 'Failed to get audit logs'
  });
}));

// Manual audit endpoint (for testing)
router.post('/audit', wrapAsync(async (req, res) => {
  const decisionData = {
    agent: req.body.agent || 'TestAgent',
    stationId: req.body.stationId || 'TEST_STATION',
    action: req.body.action || 'manual_test',
    timestamp: new Date(),
    context: req.body.context || { test: true },
    mlMetrics: req.body.mlMetrics || { confidence: 0.95 },
    impact: req.body.impact || { severity: 'low' }
  };
  
  const audit = await blockchainService.auditDecision(decisionData);
  
  res.status(audit.success ? 201 : 500).json({
    success: audit.success,
    data: audit.success ? audit : null,
    message: audit.success ? 'Decision audited successfully' : 'Audit failed'
  });
}));

export default router;