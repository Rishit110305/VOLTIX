import redis, { safeRedisOperation, createRedisDuplicate } from '../config/redis.js';
import SignalLog from '../models/SignalLog.js';
import StationState from '../models/StationState.js';
import EnergyMarket from '../models/EnergyMarket.js';
import { decisionEngine } from './notificationDispatch.js';

class EventProcessor {
  constructor() {
    // Use shared Redis instance
    this.redis = redis;
    this.publisher = createRedisDuplicate();

    // Queue and channel names
    this.SIGNAL_QUEUE = 'signal_events';
    this.AGENT_CHANNEL = 'agent_events';
    this.PROCESSING_INTERVAL = 1000; // 1 second

    this.isProcessing = false;
    this.processedCount = 0;
    this.errorCount = 0;

    console.log('EventProcessor initialized');
  }

  // Start the event processing loop
  start(io) {
    if (this.isProcessing) {
      console.log('EventProcessor already running');
      return;
    }

    this.isProcessing = true;
    this.io = io;

    console.log('EventProcessor started');
    this.processLoop();
  }

  // Main processing loop
  async processLoop() {
    while (this.isProcessing) {
      try {
        // Get event from Redis queue (blocking pop with timeout)
        const result = await this.redis.brpop(this.SIGNAL_QUEUE, 1);

        if (result) {
          const [, eventData] = result; // queueName not used
          const event = JSON.parse(eventData);

          await this.processEvent(event);
          this.processedCount++;
        }
      } catch (error) {
        console.error('Event processing error:', error);
        this.errorCount++;

        // Brief pause on error to prevent spam
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Process individual event
  async processEvent(event) {
    try {
      console.log(`Processing event: ${event.type} - ${event.eventId}`);

      // Save to MongoDB (history)
      await this.saveToHistory(event);

      // Update live state in Redis
      await this.updateLiveState(event);

      // Trigger agent analysis
      await this.triggerAgents(event);

      console.log(`Event processed: ${event.eventId}`);

    } catch (error) {
      console.error(`Failed to process event ${event.eventId}:`, error);
      throw error;
    }
  }

  // Save event to MongoDB for history/training
  async saveToHistory(event) {
    try {
      switch (event.type) {
        case 'station_update':
          await this.saveStationUpdate(event);
          break;
        case 'sensor_reading':
          await this.saveSensorReading(event);
          break;
        case 'energy_update':
          await this.saveEnergyUpdate(event);
          break;
        case 'user_event':
          // User events can be logged to SignalLog or separate collection
          await this.saveUserEvent(event);
          break;
        default:
          console.log(`Unknown event type: ${event.type}`);
      }
    } catch (error) {
      console.error('History save failed:', error);
      throw error;
    }
  }

  // Save station update to history
  async saveStationUpdate(event) {
    const stationData = event.data;

    // Update or create station state
    await StationState.findOneAndUpdate(
      { stationId: stationData.stationId },
      {
        $set: {
          ...stationData,
          lastUpdated: new Date(event.timestamp)
        }
      },
      { upsert: true, new: true }
    );

    // Also log as signal for ML training
    if (stationData.sensorData) {
      await this.createSignalLog(event, stationData);
    }
  }

  // Save sensor reading to SignalLog
  async saveSensorReading(event) {
    await this.createSignalLog(event, event.data);
  }

  // Save energy market data
  async saveEnergyUpdate(event) {
    const energyData = event.data;

    await EnergyMarket.create({
      timestamp: new Date(event.timestamp),
      gridData: energyData.gridData,
      environmentalData: energyData.environmentalData,
      pricing: energyData.pricing,
      renewableGeneration: energyData.renewableGeneration
    });
  }

  // Save user event
  async saveUserEvent(event) {
    // Create a signal log for user events that affect station state
    if (['queue_join', 'charging_start', 'charging_complete'].includes(event.data.type)) {
      await this.createSignalLog(event, event.data);
    }
  }

  // Create SignalLog entry
  async createSignalLog(event, data) {
    const signalCount = await SignalLog.countDocuments();
    const signalId = `SIG_${(signalCount + 1).toString().padStart(6, '0')}`;

    await SignalLog.create({
      signalId,
      stationId: data.stationId,
      timestamp: new Date(event.timestamp),
      sensorData: data.sensorData || {
        temperature: data.temperature || 25,
        voltage: data.voltage || 220,
        current: data.current || 0,
        vibration: data.vibration || 0,
        humidity: data.humidity || 50,
        powerFactor: data.powerFactor || 0.95,
        frequency: data.frequency || 50
      },
      performance: data.performance || {
        uptime: data.uptime || 100,
        errorRate: data.errorRate || 0,
        responseTime: data.responseTime || 0,
        throughput: data.throughput || 0,
        efficiency: data.efficiency || 95
      },
      status: data.status || 'normal',
      chargingData: data.chargingData,
      environmentalData: data.environmentalData
    });
  }

  // Update live state in Redis (for fast agent access)
  async updateLiveState(event) {
    await safeRedisOperation(async () => {
      const stateKey = `station:${event.data.stationId}`;
      const currentState = await this.redis.hgetall(stateKey);

      // Merge with existing state
      const updatedState = {
        ...currentState,
        ...event.data,
        lastUpdated: event.timestamp,
        eventId: event.eventId
      };

      // Save to Redis hash
      await this.redis.hmset(stateKey, updatedState);

      // Set expiration (24 hours)
      await this.redis.expire(stateKey, 24 * 60 * 60);

      console.log(`Live state updated: ${stateKey}`);
    }, null);
  }

  // Trigger agent analysis
  async triggerAgents(event) {
    try {
      // Create agent event
      const agentEvent = {
        eventId: event.eventId,
        timestamp: event.timestamp,
        source: event.source,
        type: event.type,
        stationId: event.data.stationId,
        data: event.data,
        triggerReason: this.determineTriggerReason(event)
      };

      // Publish to agent channel
      await this.publisher.publish(this.AGENT_CHANNEL, JSON.stringify(agentEvent));

      // Also trigger notification engine for critical events
      if (this.isCriticalEvent(event)) {
        await decisionEngine({
          eventType: this.mapToNotificationEvent(event.type),
          payload: {
            stationId: event.data.stationId,
            severity: this.calculateSeverity(event),
            ...event.data
          },
          context: {
            source: 'event_processor',
            originalEvent: event
          },
          io: this.io
        });
      }

      console.log(`Agents triggered for event: ${event.eventId}`);

    } catch (error) {
      console.error('Agent trigger failed:', error);
      throw error;
    }
  }

  // Determine why agents should be triggered
  determineTriggerReason(event) {
    const data = event.data;
    const reasons = [];

    // Station-specific triggers
    if (data.queueLength > 5) reasons.push('high_queue');
    if (data.currentInventory < 5) reasons.push('low_inventory');
    if (data.status === 'offline') reasons.push('station_offline');
    if (data.sensorData?.temperature > 80) reasons.push('high_temperature');
    if (data.sensorData?.voltage < 200 || data.sensorData?.voltage > 240) reasons.push('voltage_anomaly');

    // Energy-specific triggers
    if (data.currentEnergyPrice > 10) reasons.push('high_energy_price');
    if (data.gridData?.frequency < 49 || data.gridData?.frequency > 51) reasons.push('grid_instability');

    return reasons.length > 0 ? reasons : ['routine_monitoring'];
  }

  // Check if event is critical
  isCriticalEvent(event) {
    const data = event.data;

    return (
      data.status === 'offline' ||
      data.status === 'emergency' ||
      data.queueLength > 10 ||
      data.currentInventory < 3 ||
      (data.sensorData?.temperature > 85) ||
      (data.currentEnergyPrice > 15)
    );
  }

  // Map event type to notification event
  mapToNotificationEvent(eventType) {
    const mapping = {
      'station_update': 'STATION_UPDATE',
      'sensor_reading': 'SENSOR_ALERT',
      'energy_update': 'ENERGY_ALERT',
      'user_event': 'USER_EVENT'
    };

    return mapping[eventType] || 'SYSTEM_EVENT';
  }

  // Calculate event severity
  calculateSeverity(event) {
    const data = event.data;

    if (data.status === 'emergency' || data.currentInventory < 2) return 'critical';
    if (data.status === 'offline' || data.queueLength > 8) return 'high';
    if (data.queueLength > 5 || data.currentInventory < 5) return 'medium';

    return 'low';
  }

  // Get processing statistics
  getStats() {
    return {
      isProcessing: this.isProcessing,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      successRate: this.processedCount > 0 ?
        ((this.processedCount - this.errorCount) / this.processedCount * 100).toFixed(2) + '%' : '0%'
    };
  }

  // Stop processing
  stop() {
    this.isProcessing = false;
    console.log('EventProcessor stopped');
  }

  // Close connections
  async close() {
    this.stop();
    await this.redis.quit();
    await this.publisher.quit();
    console.log('EventProcessor connections closed');
  }
}

// Create singleton instance
const eventProcessor = new EventProcessor();

export default eventProcessor;