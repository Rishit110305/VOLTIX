import express from 'express';
import mechanicAgent from '../agents/MechanicAgent.js';
import trafficAgent from '../agents/TrafficAgent.js';
import logisticsAgent from '../agents/LogisticsAgent.js';
import energyAgent from '../agents/EnergyAgent.js';
import auditorAgent from '../agents/AuditorAgent.js';
import supervisorAgent from '../agents/SupervisorAgent.js';
import agentBus from '../eventBus/agentBus.js';

const router = express.Router();

// Get all agent statistics
router.get('/stats', async (req, res) => {
  try {
    const agentStats = {
      mechanic: mechanicAgent.getStats(),
      traffic: trafficAgent.getStats(),
      logistics: logisticsAgent.getStats(),
      energy: energyAgent.getStats(),
      auditor: auditorAgent.getStats(),
      supervisor: supervisorAgent.getCoordinationStats(),
      agentBus: agentBus.getStats()
    };

    res.json({
      success: true,
      agents: agentStats,
      summary: {
        totalAgents: 6,
        activeAgents: Object.values(agentStats).filter(stats => stats.isActive).length,
        totalProcessedEvents: Object.values(agentStats).reduce((sum, stats) => sum + (stats.processedEvents || 0), 0),
        overallSuccessRate: calculateOverallSuccessRate(agentStats)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific agent statistics
router.get('/stats/:agentName', async (req, res) => {
  try {
    const { agentName } = req.params;
    const agents = {
      mechanic: mechanicAgent,
      traffic: trafficAgent,
      logistics: logisticsAgent,
      energy: energyAgent,
      auditor: auditorAgent,
      supervisor: supervisorAgent
    };

    const agent = agents[agentName];
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent '${agentName}' not found`
      });
    }

    const stats = agentName === 'supervisor' ? agent.getCoordinationStats() : agent.getStats();

    res.json({
      success: true,
      agent: agentName,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get agent bus health
router.get('/bus/health', async (req, res) => {
  try {
    const health = await agentBus.healthCheck();
    res.json({
      success: true,
      health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send test event to agents
router.post('/test-event', async (req, res) => {
  try {
    const { stationId, eventType, data } = req.body;

    if (!stationId || !eventType || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: stationId, eventType, data'
      });
    }

    const testEvent = {
      eventId: `TEST_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'api_test',
      type: eventType,
      stationId,
      data
    };

    // Send test event through agent bus
    const result = await agentBus.publishAgentMessage('api', 'supervisor', 'test_event', testEvent);

    res.json({
      success: true,
      message: 'Test event sent to agents',
      eventId: testEvent.eventId,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Broadcast message to all agents
router.post('/broadcast', async (req, res) => {
  try {
    const { message, eventData } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const result = await agentBus.broadcastToAgents(message, eventData);

    res.json({
      success: true,
      message: 'Broadcast sent to all agents',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get agent configuration
router.get('/config/:agentName', async (req, res) => {
  try {
    const { agentName } = req.params;
    const agents = {
      mechanic: mechanicAgent,
      traffic: trafficAgent,
      logistics: logisticsAgent,
      energy: energyAgent,
      auditor: auditorAgent,
      supervisor: supervisorAgent
    };

    const agent = agents[agentName];
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent '${agentName}' not found`
      });
    }

    res.json({
      success: true,
      agent: agentName,
      config: agent.config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update agent configuration
router.put('/config/:agentName', async (req, res) => {
  try {
    const { agentName } = req.params;
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Configuration is required'
      });
    }

    const agents = {
      mechanic: mechanicAgent,
      traffic: trafficAgent,
      logistics: logisticsAgent,
      energy: energyAgent,
      auditor: auditorAgent,
      supervisor: supervisorAgent
    };

    const agent = agents[agentName];
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent '${agentName}' not found`
      });
    }

    agent.updateConfig(config);

    res.json({
      success: true,
      message: `Agent '${agentName}' configuration updated`,
      newConfig: agent.config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start/stop agents
router.post('/:agentName/:action', async (req, res) => {
  try {
    const { agentName, action } = req.params;

    if (!['start', 'stop'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be either "start" or "stop"'
      });
    }

    const agents = {
      mechanic: mechanicAgent,
      traffic: trafficAgent,
      logistics: logisticsAgent,
      energy: energyAgent,
      auditor: auditorAgent,
      supervisor: supervisorAgent
    };

    const agent = agents[agentName];
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent '${agentName}' not found`
      });
    }

    if (action === 'start') {
      agent.start();
    } else {
      agent.stop();
    }

    res.json({
      success: true,
      message: `Agent '${agentName}' ${action}ed successfully`,
      isActive: agent.isActive
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to calculate overall success rate
function calculateOverallSuccessRate(agentStats) {
  const agents = Object.values(agentStats).filter(stats => 
    stats.processedEvents && stats.successfulActions !== undefined
  );
  
  if (agents.length === 0) return '0%';
  
  const totalProcessed = agents.reduce((sum, stats) => sum + stats.processedEvents, 0);
  const totalSuccessful = agents.reduce((sum, stats) => sum + stats.successfulActions, 0);
  
  if (totalProcessed === 0) return '0%';
  
  return ((totalSuccessful / totalProcessed) * 100).toFixed(2) + '%';
}

export default router;