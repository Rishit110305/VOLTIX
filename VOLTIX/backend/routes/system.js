import express from 'express';
import StationState from '../models/StationState.js';
import DecisionLog from '../models/DecisionLog.js';
import redis, { isRedisAvailable, safeRedisOperation } from '../config/redis.js';

const router = express.Router();

// GET /api/system/status - Overall system health
router.get('/status', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Get station statistics
    const stationStats = await StationState.aggregate([
      {
        $group: {
          _id: null,
          totalStations: { $sum: 1 },
          activeStations: {
            $sum: { $cond: [{ $eq: ['$operationalStatus.status', 'active'] }, 1, 0] }
          },
          maintenanceStations: {
            $sum: { $cond: [{ $eq: ['$operationalStatus.status', 'maintenance'] }, 1, 0] }
          },
          offlineStations: {
            $sum: { $cond: [{ $eq: ['$operationalStatus.status', 'offline'] }, 1, 0] }
          },
          avgQueueLength: { $avg: '$realTimeData.queueLength' },
          avgWaitTime: { $avg: '$realTimeData.avgWaitTime' },
          totalCapacity: { $sum: '$capacity' },
          totalAvailableSlots: { $sum: '$realTimeData.availableSlots' }
        }
      }
    ]);

    // Get recent decision statistics (last 24 hours)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const decisionStats = await DecisionLog.aggregate([
      {
        $match: { timestamp: { $gte: last24h } }
      },
      {
        $group: {
          _id: null,
          totalDecisions: { $sum: 1 },
          successfulDecisions: {
            $sum: { $cond: [{ $gte: ['$impact.successRate', 0.8] }, 1, 0] }
          },
          avgConfidence: { $avg: '$mlMetrics.confidenceScore' },
          avgRiskScore: { $avg: '$impact.riskScore' },
          totalCostImpact: { $sum: '$impact.costImpact' },
          totalRevenueImpact: { $sum: '$impact.revenueImpact' },
          agentBreakdown: { $push: '$agent' }
        }
      }
    ]);

    // Get agent performance
    const agentStats = {};
    const agents = ['MechanicAgent', 'TrafficAgent', 'LogisticsAgent', 'EnergyAgent', 'AuditorAgent'];
    
    for (const agent of agents) {
      const agentDecisions = await DecisionLog.find({
        agent,
        timestamp: { $gte: last24h }
      }).lean();

      const successCount = agentDecisions.filter(d => d.impact.successRate >= 0.8).length;
      
      agentStats[agent] = {
        totalDecisions: agentDecisions.length,
        successfulDecisions: successCount,
        successRate: agentDecisions.length > 0 ? (successCount / agentDecisions.length * 100).toFixed(1) + '%' : '0%',
        avgConfidence: agentDecisions.length > 0 ? 
          (agentDecisions.reduce((sum, d) => sum + d.mlMetrics.confidenceScore, 0) / agentDecisions.length).toFixed(2) : '0.00',
        lastActivity: agentDecisions.length > 0 ? agentDecisions[0].timestamp : null
      };
    }

    // Check Redis connection
    const redisStatus = await safeRedisOperation(
      async () => {
        await redis.ping();
        return 'connected';
      },
      'disconnected'
    );

    // Calculate system health score
    const stations = stationStats[0] || {};
    const decisions = decisionStats[0] || {};
    
    const healthScore = Math.round(
      ((stations.activeStations || 0) / Math.max(stations.totalStations || 1, 1)) * 0.4 +
      ((decisions.successfulDecisions || 0) / Math.max(decisions.totalDecisions || 1, 1)) * 0.3 +
      (redisStatus === 'connected' ? 0.3 : 0)
    * 100);

    const systemStatus = {
      status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical',
      healthScore,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      
      // Station metrics
      stations: {
        total: stations.totalStations || 0,
        active: stations.activeStations || 0,
        maintenance: stations.maintenanceStations || 0,
        offline: stations.offlineStations || 0,
        avgQueueLength: Math.round((stations.avgQueueLength || 0) * 10) / 10,
        avgWaitTime: Math.round((stations.avgWaitTime || 0) * 10) / 10,
        utilization: stations.totalCapacity > 0 ? 
          Math.round(((stations.totalCapacity - stations.totalAvailableSlots) / stations.totalCapacity) * 100) : 0
      },

      // Decision metrics
      decisions: {
        total24h: decisions.totalDecisions || 0,
        successful24h: decisions.successfulDecisions || 0,
        successRate: decisions.totalDecisions > 0 ? 
          Math.round((decisions.successfulDecisions / decisions.totalDecisions) * 100) : 0,
        avgConfidence: Math.round((decisions.avgConfidence || 0) * 100),
        avgRiskScore: Math.round((decisions.avgRiskScore || 0) * 100),
        netImpact: Math.round((decisions.totalRevenueImpact || 0) + (decisions.totalCostImpact || 0))
      },

      // Agent performance
      agents: agentStats,

      // Infrastructure
      infrastructure: {
        database: 'connected',
        redis: redisStatus,
        blockchain: 'connected', // Assume connected if no error
        nodeVersion: process.version,
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        cpuUsage: Math.round(process.cpuUsage().user / 1000)
      }
    };

    res.json({
      success: true,
      data: systemStatus
    });

  } catch (error) {
    console.error('System status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status',
      message: error.message
    });
  }
});

// GET /api/system/agents - Active agents status
router.get('/agents', async (req, res) => {
  try {
    const last1h = new Date(Date.now() - 60 * 60 * 1000);
    
    const agents = ['MechanicAgent', 'TrafficAgent', 'LogisticsAgent', 'EnergyAgent', 'AuditorAgent'];
    const agentStatus = {};

    for (const agent of agents) {
      const recentDecisions = await DecisionLog.find({
        agent,
        timestamp: { $gte: last1h }
      }).sort({ timestamp: -1 }).limit(10).lean();

      const lastDecision = recentDecisions[0];
      
      agentStatus[agent] = {
        isActive: recentDecisions.length > 0,
        lastActivity: lastDecision?.timestamp || null,
        recentDecisions: recentDecisions.length,
        avgConfidence: recentDecisions.length > 0 ? 
          (recentDecisions.reduce((sum, d) => sum + d.mlMetrics.confidenceScore, 0) / recentDecisions.length).toFixed(2) : '0.00',
        successRate: recentDecisions.length > 0 ? 
          Math.round((recentDecisions.filter(d => d.impact.successRate >= 0.8).length / recentDecisions.length) * 100) : 0,
        lastAction: lastDecision?.action || 'none',
        status: recentDecisions.length > 0 ? 'active' : 'idle'
      };
    }

    res.json({
      success: true,
      data: {
        agents: agentStatus,
        totalActive: Object.values(agentStatus).filter(a => a.isActive).length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Agents status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agents status',
      message: error.message
    });
  }
});

// GET /api/system/decisions/latest - Recent decisions with explanations
router.get('/decisions/latest', async (req, res) => {
  try {
    const { limit = 20, agent, stationId } = req.query;
    
    const query = {};
    if (agent) query.agent = agent;
    if (stationId) query.stationId = stationId;

    const decisions = await DecisionLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .select('decisionId agent action stationId timestamp explanation impact.successRate impact.riskScore mlMetrics.confidenceScore priority')
      .lean();

    const formattedDecisions = decisions.map(decision => ({
      id: decision.decisionId,
      agent: decision.agent,
      action: decision.action,
      stationId: decision.stationId,
      timestamp: decision.timestamp,
      explanation: decision.explanation || 'No explanation available',
      metrics: {
        confidence: Math.round((decision.mlMetrics?.confidenceScore || 0) * 100),
        successRate: Math.round((decision.impact?.successRate || 0) * 100),
        riskScore: Math.round((decision.impact?.riskScore || 0) * 100)
      },
      priority: decision.priority,
      status: decision.impact?.successRate >= 0.8 ? 'success' : 'warning'
    }));

    res.json({
      success: true,
      data: {
        decisions: formattedDecisions,
        total: formattedDecisions.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Latest decisions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get latest decisions',
      message: error.message
    });
  }
});

// GET /api/system/stations - Station states overview
router.get('/stations', async (req, res) => {
  try {
    const { status, city } = req.query;
    
    const query = {};
    if (status) query['operationalStatus.status'] = status;
    if (city) query.city = city;

    const stations = await StationState.find(query)
      .select('stationId name city stationType capacity operationalStatus realTimeData pricing location')
      .lean();

    const formattedStations = stations.map(station => ({
      id: station.stationId,
      name: station.name,
      city: station.city,
      type: station.stationType,
      capacity: station.capacity,
      status: station.operationalStatus?.status || 'unknown',
      realTime: {
        availableSlots: station.realTimeData?.availableSlots || 0,
        queueLength: station.realTimeData?.queueLength || 0,
        avgWaitTime: station.realTimeData?.avgWaitTime || 0,
        currentLoad: station.realTimeData?.currentLoad || 0
      },
      pricing: {
        pricePerKwh: station.pricing?.pricePerKwh || station.pricePerKwh || 0,
        surgeActive: station.pricing?.peakHourMultiplier > 1 || false
      },
      location: station.location,
      utilization: station.capacity > 0 ? 
        Math.round(((station.capacity - (station.realTimeData?.availableSlots || 0)) / station.capacity) * 100) : 0,
      healthScore: station.operationalStatus?.status === 'active' ? 100 : 
                   station.operationalStatus?.status === 'maintenance' ? 50 : 0
    }));

    // Group by city for summary
    const citySummary = {};
    formattedStations.forEach(station => {
      if (!citySummary[station.city]) {
        citySummary[station.city] = {
          total: 0,
          active: 0,
          avgUtilization: 0,
          totalCapacity: 0
        };
      }
      
      citySummary[station.city].total++;
      if (station.status === 'active') citySummary[station.city].active++;
      citySummary[station.city].avgUtilization += station.utilization;
      citySummary[station.city].totalCapacity += station.capacity;
    });

    // Calculate averages
    Object.keys(citySummary).forEach(city => {
      citySummary[city].avgUtilization = Math.round(citySummary[city].avgUtilization / citySummary[city].total);
    });

    res.json({
      success: true,
      data: {
        stations: formattedStations,
        summary: {
          total: formattedStations.length,
          active: formattedStations.filter(s => s.status === 'active').length,
          maintenance: formattedStations.filter(s => s.status === 'maintenance').length,
          offline: formattedStations.filter(s => s.status === 'offline').length,
          avgUtilization: Math.round(formattedStations.reduce((sum, s) => sum + s.utilization, 0) / formattedStations.length) || 0,
          citySummary
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Stations overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stations overview',
      message: error.message
    });
  }
});

// GET /api/system/metrics - Real-time metrics for dashboard
router.get('/metrics', async (req, res) => {
  try {
    const { timeRange = '1h' } = req.query;
    
    let startTime;
    switch (timeRange) {
      case '1h':
        startTime = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(Date.now() - 60 * 60 * 1000);
    }

    // Get time-series decision data
    const decisionMetrics = await DecisionLog.aggregate([
      {
        $match: { timestamp: { $gte: startTime } }
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            agent: '$agent'
          },
          count: { $sum: 1 },
          avgConfidence: { $avg: '$mlMetrics.confidenceScore' },
          avgRiskScore: { $avg: '$impact.riskScore' },
          successCount: {
            $sum: { $cond: [{ $gte: ['$impact.successRate', 0.8] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.hour': 1 }
      }
    ]);

    // Get current system load
    const systemLoad = {
      cpu: Math.round(process.cpuUsage().user / 1000),
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      uptime: Math.round(process.uptime()),
      activeConnections: 0 // Would be populated by socket.io if available
    };

    res.json({
      success: true,
      data: {
        timeRange,
        decisionMetrics,
        systemLoad,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system metrics',
      message: error.message
    });
  }
});

export default router;