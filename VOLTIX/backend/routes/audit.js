import express from 'express';
import blockchainService from '../services/blockchainService.js';
import auditorAgent from '../agents/AuditorAgent.js';
import wrapAsync from '../middlewares/wrapAsync.js';
import { userAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get audit statistics
router.get('/stats', wrapAsync(async (req, res) => {
  const stats = await blockchainService.getAuditStats();
  res.json(stats);
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
  
  const result = await blockchainService.searchAuditLogs(filters);
  res.json(result);
}));

// Verify decision integrity
router.get('/verify/:decisionId', wrapAsync(async (req, res) => {
  const { decisionId } = req.params;
  const result = await blockchainService.verifyDecision(decisionId);
  res.json(result);
}));

// Generate audit report
router.get('/report', wrapAsync(async (req, res) => {
  const filters = {
    agent: req.query.agent,
    stationId: req.query.stationId,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };
  
  const report = await auditorAgent.generateAuditReport(filters);
  res.json(report);
}));

// Health check
router.get('/health', wrapAsync(async (req, res) => {
  const health = await blockchainService.healthCheck();
  res.json(health);
}));

// Manual audit (for testing)
router.post('/manual-audit', userAuth, wrapAsync(async (req, res) => {
  const io = req.app.get('io');
  const result = await auditorAgent.auditDecision(req.body, io);
  res.json(result);
}));

export default router;