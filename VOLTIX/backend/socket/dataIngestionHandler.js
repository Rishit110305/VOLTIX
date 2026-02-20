import dataIngestionService from '../services/dataIngestionService.js';

export default function dataIngestionHandler(io, socket) {
  console.log(`📡 Data ingestion handler attached for socket: ${socket.id}`);

  // Station data updates
  socket.on('station:update', async (data) => {
    try {
      console.log(`Station update received: ${data.stationId}`);

      // Validate required fields
      if (!data.stationId) {
        socket.emit('error', { message: 'stationId is required' });
        return;
      }

      // Ingest the data
      const result = await dataIngestionService.ingestStationData(io, data);

      // Acknowledge to sender
      socket.emit('station:update:ack', {
        success: true,
        eventId: result.eventId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Station update error:', error);
      socket.emit('error', {
        message: 'Failed to process station update',
        error: error.message
      });
    }
  });

  // Sensor data updates
  socket.on('sensor:update', async (data) => {
    try {
      console.log(`Sensor update received: ${data.stationId}`);

      if (!data.stationId || !data.sensorData) {
        socket.emit('error', { message: 'stationId and sensorData are required' });
        return;
      }

      const result = await dataIngestionService.ingestSensorData(io, data);

      socket.emit('sensor:update:ack', {
        success: true,
        eventId: result.eventId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Sensor update error:', error);
      socket.emit('error', {
        message: 'Failed to process sensor update',
        error: error.message
      });
    }
  });

  // User/Vehicle events
  socket.on('user:event', async (data) => {
    try {
      console.log(`User event received: ${data.type} - ${data.userId}`);

      if (!data.userId || !data.type || !data.stationId) {
        socket.emit('error', { message: 'userId, type, and stationId are required' });
        return;
      }

      const result = await dataIngestionService.ingestUserEvent(io, data);

      socket.emit('user:event:ack', {
        success: true,
        eventId: result.eventId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('User event error:', error);
      socket.emit('error', {
        message: 'Failed to process user event',
        error: error.message
      });
    }
  });

  // Energy/Grid data updates
  socket.on('energy:update', async (data) => {
    try {
      console.log(`Energy update received: Grid price ${data.pricing?.currentEnergyPrice}`);

      if (!data.gridData || !data.pricing) {
        socket.emit('error', { message: 'gridData and pricing are required' });
        return;
      }

      const result = await dataIngestionService.ingestEnergyData(io, data);

      socket.emit('energy:update:ack', {
        success: true,
        eventId: result.eventId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Energy update error:', error);
      socket.emit('error', {
        message: 'Failed to process energy update',
        error: error.message
      });
    }
  });

  // Batch data updates (for high-frequency sensors)
  socket.on('batch:update', async (events) => {
    try {
      console.log(`Batch update received: ${events.length} events`);

      if (!Array.isArray(events) || events.length === 0) {
        socket.emit('error', { message: 'events array is required' });
        return;
      }

      const results = [];

      for (const event of events) {
        try {
          let result;

          switch (event.type) {
            case 'station_update':
              result = await dataIngestionService.ingestStationData(io, event.data);
              break;
            case 'sensor_reading':
              result = await dataIngestionService.ingestSensorData(io, event.data);
              break;
            case 'user_event':
              result = await dataIngestionService.ingestUserEvent(io, event.data);
              break;
            case 'energy_update':
              result = await dataIngestionService.ingestEnergyData(io, event.data);
              break;
            default:
              throw new Error(`Unknown event type: ${event.type}`);
          }

          results.push({ success: true, eventId: result.eventId });

        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }

      socket.emit('batch:update:ack', {
        success: true,
        processed: results.length,
        results: results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Batch update error:', error);
      socket.emit('error', {
        message: 'Failed to process batch update',
        error: error.message
      });
    }
  });

  // Queue statistics request
  socket.on('queue:stats', async () => {
    try {
      const stats = await dataIngestionService.getQueueStats();
      socket.emit('queue:stats:response', stats);
    } catch (error) {
      console.error('Queue stats error:', error);
      socket.emit('error', {
        message: 'Failed to get queue stats',
        error: error.message
      });
    }
  });

  // Peek at queue (for debugging)
  socket.on('queue:peek', async (count = 5) => {
    try {
      const items = await dataIngestionService.peekQueue(count);
      socket.emit('queue:peek:response', items);
    } catch (error) {
      console.error('Queue peek error:', error);
      socket.emit('error', {
        message: 'Failed to peek queue',
        error: error.message
      });
    }
  });

  // Health check
  socket.on('ingestion:health', async () => {
    try {
      const health = await dataIngestionService.healthCheck();
      socket.emit('ingestion:health:response', health);
    } catch (error) {
      console.error('Health check error:', error);
      socket.emit('error', {
        message: 'Health check failed',
        error: error.message
      });
    }
  });

  // Clear queue (admin only)
  socket.on('queue:clear', async () => {
    try {
      // In production, add admin authentication here
      const result = await dataIngestionService.clearQueue();
      socket.emit('queue:clear:response', result);
    } catch (error) {
      console.error('Queue clear error:', error);
      socket.emit('error', {
        message: 'Failed to clear queue',
        error: error.message
      });
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`Data ingestion handler disconnected: ${socket.id}`);
  });
}