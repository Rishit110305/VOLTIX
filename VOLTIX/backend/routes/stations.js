import express from 'express';
import stationDataService from '../services/stationDataService.js';

const router = express.Router();

// ─── Admin-set station overview (in-memory, per station ID) ────────────
let adminStationStatuses = {};

// Default fallback data for a station
const getDefaultAdminStatus = () => ({
  batteryPercentage: 80,
  batteriesAvailable: 10,
  queueCount: 0,
  isActive: true,
  lastUpdatedBy: 'Not yet set by admin',
});

// GET  /api/stations/admin-status  → returns dictionary of all station overrides
router.get('/admin-status', (req, res) => {
  res.json({ success: true, data: adminStationStatuses });
});

// GET  /api/stations/admin-status/:id  → main site reads this
router.get('/admin-status/:id', (req, res) => {
  const stationId = req.params.id;
  const status = adminStationStatuses[stationId] || getDefaultAdminStatus();
  res.json({ success: true, data: status });
});

// POST /api/stations/admin-status/:id  → admin panel writes this
router.post('/admin-status/:id', (req, res) => {
  const stationId = req.params.id;
  const { batteryPercentage, batteriesAvailable, queueCount, isActive, lastUpdatedBy } = req.body;

  if (
    batteryPercentage === undefined ||
    batteriesAvailable === undefined ||
    queueCount === undefined ||
    isActive === undefined
  ) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  adminStationStatuses[stationId] = {
    batteryPercentage: Number(batteryPercentage),
    batteriesAvailable: Number(batteriesAvailable),
    queueCount: Number(queueCount),
    isActive: Boolean(isActive),
    lastUpdatedBy: lastUpdatedBy || 'Admin',
  };

  console.log(`✅ Admin updated station status for ${stationId}:`, adminStationStatuses[stationId]);
  res.json({ success: true, data: adminStationStatuses[stationId] });
});
// ─────────────────────────────────────────────────────────────────────────────

// Get all stations
router.get('/', async (req, res) => {
  try {
    const { city, status, limit } = req.query;
    let stations = stationDataService.getAllStations();

    // Filter by city if provided
    if (city) {
      stations = stations.filter(station =>
        station.city.toLowerCase() === city.toLowerCase()
      );
    }

    // Filter by status if provided
    if (status) {
      stations = stations.filter(station => station.status === status);
    }

    // Limit results if provided
    if (limit) {
      stations = stations.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: {
        stations,
        total: stations.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stations'
    });
  }
});

// Get station by ID
router.get('/:id', async (req, res) => {
  try {
    const station = stationDataService.getStationById(req.params.id);

    if (!station) {
      return res.status(404).json({
        success: false,
        error: 'Station not found'
      });
    }

    res.json({
      success: true,
      data: {
        station,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching station:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch station'
    });
  }
});

// Get stations by city
router.get('/city/:city', async (req, res) => {
  try {
    const stations = stationDataService.getStationsByCity(req.params.city);

    res.json({
      success: true,
      data: {
        stations,
        city: req.params.city,
        total: stations.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching stations by city:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stations by city'
    });
  }
});

// Get system overview
router.get('/overview/system', async (req, res) => {
  try {
    const overview = stationDataService.getSystemOverview();

    res.json({
      success: true,
      data: {
        overview,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching system overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system overview'
    });
  }
});

// Get city overview
router.get('/overview/cities', async (req, res) => {
  try {
    const cityOverview = stationDataService.getCityOverview();

    res.json({
      success: true,
      data: {
        cities: cityOverview,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching city overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch city overview'
    });
  }
});

// Get live metrics for a specific station
router.get('/:id/metrics', async (req, res) => {
  try {
    const station = stationDataService.getStationById(req.params.id);

    if (!station) {
      return res.status(404).json({
        success: false,
        error: 'Station not found'
      });
    }

    // Return only the live metrics
    const metrics = {
      stationId: station.id,
      status: station.status,
      health: station.health,
      demand: station.demand,
      inventory: station.inventory,
      errors: station.errors,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching station metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch station metrics'
    });
  }
});

// Get alerts for all stations
router.get('/alerts/all', async (req, res) => {
  try {
    const stations = stationDataService.getAllStations();
    const alerts = [];

    stations.forEach(station => {
      // Critical errors
      if (station.status === 'error' || station.health.faultCount1h > 2) {
        alerts.push({
          stationId: station.id,
          stationName: station.name,
          type: 'critical_error',
          severity: 'high',
          message: `Station ${station.id} has critical errors`,
          details: station.errors.recentErrors,
          timestamp: new Date().toISOString()
        });
      }

      // Stockout warnings
      if (station.inventory.predictedStockout && station.inventory.predictedStockout < 60) {
        alerts.push({
          stationId: station.id,
          stationName: station.name,
          type: 'stockout_warning',
          severity: 'medium',
          message: `Battery stockout predicted in ${station.inventory.predictedStockout} minutes`,
          details: {
            chargedBatteries: station.inventory.chargedBatteries,
            predictedTime: station.inventory.predictedStockout
          },
          timestamp: new Date().toISOString()
        });
      }

      // Congestion alerts
      if (station.demand.queueLength > 6) {
        alerts.push({
          stationId: station.id,
          stationName: station.name,
          type: 'congestion_alert',
          severity: 'medium',
          message: `High congestion: ${station.demand.queueLength} vehicles in queue`,
          details: {
            queueLength: station.demand.queueLength,
            avgWaitTime: station.demand.avgWaitTime
          },
          timestamp: new Date().toISOString()
        });
      }

      // Maintenance required
      if (station.health.uptime < 90) {
        alerts.push({
          stationId: station.id,
          stationName: station.name,
          type: 'maintenance_required',
          severity: 'low',
          message: `Station uptime below 90%: ${station.health.uptime}%`,
          details: {
            uptime: station.health.uptime,
            faultCount24h: station.health.faultCount24h
          },
          timestamp: new Date().toISOString()
        });
      }
    });

    // Sort by severity and timestamp
    alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    res.json({
      success: true,
      data: {
        alerts,
        total: alerts.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    });
  }
});

export default router;