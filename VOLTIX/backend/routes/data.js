import express from 'express';
import dataIngestionService from '../services/dataIngestionService.js';
import eventProcessor from '../services/eventProcessor.js';
import wrapAsync from '../middlewares/wrapAsync.js';
import { userAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get queue statistics
router.get('/queue/stats', wrapAsync(async (req, res) => {
  const stats = await dataIngestionService.getQueueStats();
  const processorStats = eventProcessor.getStats();
  
  res.json({
    success: true,
    queue: stats,
    processor: processorStats,
    timestamp: new Date().toISOString()
  });
}));

// Peek at queue items
router.get('/queue/peek', wrapAsync(async (req, res) => {
  const count = parseInt(req.query.count) || 5;
  const items = await dataIngestionService.peekQueue(count);
  
  res.json({
    success: true,
    items,
    count: items.length,
    timestamp: new Date().toISOString()
  });
}));

// Health check
router.get('/health', wrapAsync(async (req, res) => {
  const ingestionHealth = await dataIngestionService.healthCheck();
  const processorStats = eventProcessor.getStats();
  
  res.json({
    success: true,
    ingestion: ingestionHealth,
    processor: {
      status: processorStats.isProcessing ? 'running' : 'stopped',
      stats: processorStats
    },
    timestamp: new Date().toISOString()
  });
}));

// Clear queue (admin only)
router.delete('/queue/clear', userAuth, wrapAsync(async (req, res) => {
  // In production, add admin role check
  const result = await dataIngestionService.clearQueue();
  
  res.json({
    success: true,
    message: 'Queue cleared successfully',
    ...result,
    timestamp: new Date().toISOString()
  });
}));

// Manual data ingestion (for testing)
router.post('/ingest/station', wrapAsync(async (req, res) => {
  const io = req.app.get('io');
  const result = await dataIngestionService.ingestStationData(io, req.body);
  
  res.json({
    success: true,
    message: 'Station data ingested successfully',
    eventId: result.eventId,
    timestamp: new Date().toISOString()
  });
}));

router.post('/ingest/sensor', wrapAsync(async (req, res) => {
  const io = req.app.get('io');
  const result = await dataIngestionService.ingestSensorData(io, req.body);
  
  res.json({
    success: true,
    message: 'Sensor data ingested successfully',
    eventId: result.eventId,
    timestamp: new Date().toISOString()
  });
}));

router.post('/ingest/user', wrapAsync(async (req, res) => {
  const io = req.app.get('io');
  const result = await dataIngestionService.ingestUserEvent(io, req.body);
  
  res.json({
    success: true,
    message: 'User event ingested successfully',
    eventId: result.eventId,
    timestamp: new Date().toISOString()
  });
}));

router.post('/ingest/energy', wrapAsync(async (req, res) => {
  const io = req.app.get('io');
  const result = await dataIngestionService.ingestEnergyData(io, req.body);
  
  res.json({
    success: true,
    message: 'Energy data ingested successfully',
    eventId: result.eventId,
    timestamp: new Date().toISOString()
  });
}));

// Batch ingestion
router.post('/ingest/batch', wrapAsync(async (req, res) => {
  const io = req.app.get('io');
  const { events } = req.body;
  
  if (!Array.isArray(events)) {
    return res.status(400).json({
      success: false,
      error: 'events array is required'
    });
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
  
  res.json({
    success: true,
    message: 'Batch ingestion completed',
    processed: results.length,
    results,
    timestamp: new Date().toISOString()
  });
}));

// Processor control
router.post('/processor/start', userAuth, wrapAsync(async (req, res) => {
  const io = req.app.get('io');
  eventProcessor.start(io);
  
  res.json({
    success: true,
    message: 'Event processor started',
    timestamp: new Date().toISOString()
  });
}));

router.post('/processor/stop', userAuth, wrapAsync(async (req, res) => {
  eventProcessor.stop();
  
  res.json({
    success: true,
    message: 'Event processor stopped',
    timestamp: new Date().toISOString()
  });
}));

router.get('/processor/stats', wrapAsync(async (req, res) => {
  const stats = eventProcessor.getStats();
  
  res.json({
    success: true,
    stats,
    timestamp: new Date().toISOString()
  });
}));

export default router;