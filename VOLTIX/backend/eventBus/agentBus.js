import redis, { createRedisDuplicate } from '../config/redis.js';

class AgentBus {
  constructor() {
    // Use shared Redis instance
    this.subscriber = createRedisDuplicate();
    this.publisher = createRedisDuplicate();

    // Agent communication channels
    this.AGENT_CHANNEL = 'agent_events';
    this.COORDINATION_CHANNEL = 'agent_coordination';
    
    this.isListening = false;
    this.processedEvents = 0;
    this.io = null;
    this.supervisorAgent = null; // Will be loaded dynamically

    console.log('AgentBus initialized');
  }

  // Start listening for agent events
  async start(io) {
    if (this.isListening) {
      console.log('AgentBus already listening');
      return;
    }

    this.isListening = true;
    this.io = io;
    
    // Load supervisor agent dynamically
    await this.loadSupervisorAgent();
    
    // Set IO reference for supervisor
    if (this.supervisorAgent) {
      this.supervisorAgent.setIO(io);
    }

    // Wait for subscriber to be ready before subscribing
    try {
      await this.waitForRedisReady(this.subscriber, 5000);
      
      // Subscribe to agent events channel
      this.subscriber.subscribe(this.AGENT_CHANNEL, (err, count) => {
        if (err) {
          console.error('AgentBus subscription failed:', err);
          return;
        }
        console.log(`AgentBus subscribed to ${count} channel(s)`);
      });

      // Handle incoming agent events
      this.subscriber.on('message', async (channel, message) => {
        if (channel === this.AGENT_CHANNEL) {
          await this.handleAgentEvent(message);
        }
      });

      console.log('AgentBus started - listening for agent events');
    } catch (error) {
      console.error('AgentBus failed to start:', error.message);
      console.log('AgentBus will continue without Redis pub/sub');
    }
  }

  // Wait for Redis connection to be ready
  async waitForRedisReady(redisClient, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (redisClient.status === 'ready') {
        resolve();
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, timeout);

      redisClient.once('ready', () => {
        clearTimeout(timer);
        resolve();
      });

      redisClient.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  // Load supervisor agent dynamically
  async loadSupervisorAgent() {
    if (!this.supervisorAgent) {
      try {
        const { default: supervisorAgent } = await import('../agents/SupervisorAgent.js');
        this.supervisorAgent = supervisorAgent;
        console.log('SupervisorAgent loaded successfully');
      } catch (error) {
        console.error('Failed to load SupervisorAgent:', error);
      }
    }
  }

  // Handle incoming agent events
  async handleAgentEvent(message) {
    try {
      const event = JSON.parse(message);
      this.processedEvents++;
      
      console.log(`[AgentBus] Processing event: ${event.type} - ${event.eventId}`);
      
      // Route event to SupervisorAgent for coordination
      const result = await this.supervisorAgent.processEvent(event, this.io);
      
      if (result.success) {
        console.log(`[AgentBus] Event processed successfully: ${event.eventId}`);
        
        // Publish coordination result if needed
        if (result.action !== 'monitor') {
          await this.publishCoordinationResult(event, result);
        }
      } else {
        console.error(`[AgentBus] Event processing failed: ${event.eventId}`, result.error);
        
        // Publish failure notification
        await this.publishFailureNotification(event, result);
      }
      
    } catch (error) {
      console.error('[AgentBus] Event handling error:', error);
    }
  }

  // Publish coordination result
  async publishCoordinationResult(originalEvent, result) {
    try {
      const coordinationResult = {
        eventId: `COORD_${Date.now()}`,
        timestamp: new Date().toISOString(),
        originalEventId: originalEvent.eventId,
        stationId: originalEvent.stationId,
        coordinationAction: result.action,
        agentPlan: result.agentPlan || [],
        success: result.success,
        executionTime: result.executionTime || 0
      };

      await this.publisher.publish(this.COORDINATION_CHANNEL, JSON.stringify(coordinationResult));
      
      console.log(`📢 [AgentBus] Coordination result published: ${coordinationResult.eventId}`);
      
    } catch (error) {
      console.error('[AgentBus] Coordination result publish failed:', error);
    }
  }

  // Publish failure notification
  async publishFailureNotification(originalEvent, result) {
    try {
      const failureNotification = {
        eventId: `FAIL_${Date.now()}`,
        timestamp: new Date().toISOString(),
        originalEventId: originalEvent.eventId,
        stationId: originalEvent.stationId,
        error: result.error,
        severity: 'high',
        requiresAttention: true
      };

      await this.publisher.publish(this.COORDINATION_CHANNEL, JSON.stringify(failureNotification));
      
      console.log(`🚨 [AgentBus] Failure notification published: ${failureNotification.eventId}`);
      
    } catch (error) {
      console.error('[AgentBus] Failure notification publish failed:', error);
    }
  }

  // Publish direct agent communication
  async publishAgentMessage(fromAgent, toAgent, message, eventData = null) {
    try {
      const agentMessage = {
        eventId: `MSG_${Date.now()}`,
        timestamp: new Date().toISOString(),
        fromAgent,
        toAgent,
        message,
        eventData,
        type: 'agent_communication'
      };

      await this.publisher.publish(this.AGENT_CHANNEL, JSON.stringify(agentMessage));
      
      console.log(`📨 [AgentBus] Agent message sent: ${fromAgent} → ${toAgent}`);
      
      return {
        success: true,
        messageId: agentMessage.eventId
      };
      
    } catch (error) {
      console.error('[AgentBus] Agent message publish failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Broadcast to all agents
  async broadcastToAgents(message, eventData = null) {
    try {
      const broadcast = {
        eventId: `BROADCAST_${Date.now()}`,
        timestamp: new Date().toISOString(),
        fromAgent: 'supervisor',
        toAgent: 'all',
        message,
        eventData,
        type: 'agent_broadcast'
      };

      await this.publisher.publish(this.AGENT_CHANNEL, JSON.stringify(broadcast));
      
      console.log(`📢 [AgentBus] Broadcast sent to all agents`);
      
      return {
        success: true,
        broadcastId: broadcast.eventId
      };
      
    } catch (error) {
      console.error('[AgentBus] Broadcast failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get agent bus statistics
  getStats() {
    return {
      isListening: this.isListening,
      processedEvents: this.processedEvents,
      channels: {
        agentChannel: this.AGENT_CHANNEL,
        coordinationChannel: this.COORDINATION_CHANNEL
      },
      supervisorStats: this.supervisorAgent ? this.supervisorAgent.getCoordinationStats() : null
    };
  }

  // Health check
  async healthCheck() {
    try {
      const subscriberPing = await this.subscriber.ping();
      const publisherPing = await this.publisher.ping();
      
      return {
        status: 'healthy',
        subscriber: subscriberPing === 'PONG' ? 'connected' : 'disconnected',
        publisher: publisherPing === 'PONG' ? 'connected' : 'disconnected',
        isListening: this.isListening,
        processedEvents: this.processedEvents,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Stop listening
  stop() {
    this.isListening = false;
    this.subscriber.unsubscribe(this.AGENT_CHANNEL);
    console.log('⏹️ AgentBus stopped');
  }

  // Close connections
  async close() {
    this.stop();
    await this.subscriber.quit();
    await this.publisher.quit();
    console.log('AgentBus connections closed');
  }
}

// Create singleton instance
const agentBus = new AgentBus();

export default agentBus;