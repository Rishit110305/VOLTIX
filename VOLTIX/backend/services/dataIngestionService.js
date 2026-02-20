import redis, { safeRedisOperation, createRedisDuplicate } from '../config/redis.js';
import { v4 as uuidv4 } from 'uuid';

class DataIngestionService {
  constructor() {
    // Use shared Redis instance
    this.redis = redis;
    this.publisher = createRedisDuplicate();

    // Queue names
    this.SIGNAL_QUEUE = 'signal_events';
    this.AGENT_CHANNEL = 'agent_events';
    
    console.log('DataIngestionService initialized');
  }

  // STEP 1: Receive live data from stations via Socket.IO
  async ingestStationData(io, stationData) {
    try {
      const event = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        source: 'station',
        type: 'station_update',
        data: stationData,
        processed: false
      };

      // Push to Redis Queue for reliable processing
      await this.redis.lpush(this.SIGNAL_QUEUE, JSON.stringify(event));
      
      console.log(`Station data queued: ${stationData.stationId}`);
      
      // Emit to connected dashboards immediately (real-time UI)
      io.emit('station:update', {
        stationId: stationData.stationId,
        data: stationData,
        timestamp: event.timestamp
      });

      return {
        success: true,
        eventId: event.eventId,
        queued: true
      };
    } catch (error) {
      console.error('Data ingestion failed:', error);
      throw error;
    }
  }

  // Ingest sensor data (temperature, voltage, etc.)
  async ingestSensorData(io, sensorData) {
    try {
      const event = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        source: 'sensor',
        type: 'sensor_reading',
        data: sensorData,
        processed: false
      };

      await this.redis.lpush(this.SIGNAL_QUEUE, JSON.stringify(event));
      
      console.log(`🌡️ Sensor data queued: ${sensorData.stationId}`);
      
      // Real-time sensor updates to dashboard
      io.emit('sensor:update', {
        stationId: sensorData.stationId,
        sensorData: sensorData.sensorData,
        timestamp: event.timestamp
      });

      return {
        success: true,
        eventId: event.eventId,
        queued: true
      };
    } catch (error) {
      console.error('Sensor ingestion failed:', error);
      throw error;
    }
  }

  // Ingest user/vehicle events
  async ingestUserEvent(io, userEvent) {
    try {
      const event = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        source: 'user',
        type: userEvent.type, // 'queue_join', 'charging_start', 'charging_complete'
        data: userEvent,
        processed: false
      };

      await this.redis.lpush(this.SIGNAL_QUEUE, JSON.stringify(event));
      
      console.log(`User event queued: ${userEvent.type} - ${userEvent.userId}`);
      
      // Real-time user events
      io.emit('user:event', {
        userId: userEvent.userId,
        stationId: userEvent.stationId,
        type: userEvent.type,
        timestamp: event.timestamp
      });

      return {
        success: true,
        eventId: event.eventId,
        queued: true
      };
    } catch (error) {
      console.error('User event ingestion failed:', error);
      throw error;
    }
  }

  // Ingest energy/grid data
  async ingestEnergyData(io, energyData) {
    try {
      const event = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        source: 'grid',
        type: 'energy_update',
        data: energyData,
        processed: false
      };

      await this.redis.lpush(this.SIGNAL_QUEUE, JSON.stringify(event));
      
      console.log(`Energy data queued: Grid price ${energyData.currentEnergyPrice}`);
      
      // Real-time energy updates
      io.emit('energy:update', {
        gridData: energyData.gridData,
        pricing: energyData.pricing,
        timestamp: event.timestamp
      });

      return {
        success: true,
        eventId: event.eventId,
        queued: true
      };
    } catch (error) {
      console.error('Energy ingestion failed:', error);
      throw error;
    }
  }

  // Get queue statistics
  async getQueueStats() {
    return await safeRedisOperation(async () => {
      const queueLength = await this.redis.llen(this.SIGNAL_QUEUE);
      const memoryUsage = await this.redis.memory('usage', this.SIGNAL_QUEUE);
      
      return {
        queueLength,
        memoryUsage: memoryUsage || 0,
        queueName: this.SIGNAL_QUEUE
      };
    }, {
      queueLength: 0,
      memoryUsage: 0,
      error: 'Redis unavailable'
    });
  }

  // Clear queue (for testing/maintenance)
  async clearQueue() {
    return await safeRedisOperation(async () => {
      const deleted = await this.redis.del(this.SIGNAL_QUEUE);
      console.log(`🧹 Queue cleared: ${deleted} items removed`);
      return { success: true, itemsRemoved: deleted };
    }, { success: false, error: 'Redis unavailable' });
  }

  // Peek at queue without removing items
  async peekQueue(count = 5) {
    return await safeRedisOperation(async () => {
      const items = await this.redis.lrange(this.SIGNAL_QUEUE, 0, count - 1);
      return items.map(item => JSON.parse(item));
    }, []);
  }

  // Health check
  async healthCheck() {
    return await safeRedisOperation(async () => {
      const ping = await this.redis.ping();
      const queueStats = await this.getQueueStats();
      
      return {
        status: 'healthy',
        redis: ping === 'PONG' ? 'connected' : 'disconnected',
        queue: queueStats,
        timestamp: new Date().toISOString()
      };
    }, {
      status: 'unhealthy',
      redis: 'disconnected',
      error: 'Redis unavailable',
      timestamp: new Date().toISOString()
    });
  }

  // Close connections
  async close() {
    await this.redis.quit();
    await this.publisher.quit();
    console.log('DataIngestionService connections closed');
  }
}

// Create singleton instance
const dataIngestionService = new DataIngestionService();

export default dataIngestionService;