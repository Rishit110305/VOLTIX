import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StationDataService {
  constructor() {
    this.stations = [];
    this.liveData = new Map();
    this.loadStationsData();
    this.startLiveDataGeneration();
  }

  // Load stations from ML dataset
  async loadStationsData() {
    const csvPath = path.join(__dirname, '../../ml/datasets/stations.csv');
    
    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️ ML dataset not found, generating mock station data...');
      this.stations = this.generateMockStations();
      console.log(`Generated ${this.stations.length} mock stations`);
      return Promise.resolve(this.stations);
    }
    
    return new Promise((resolve, reject) => {
      const stations = [];
      
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          stations.push({
            id: row.station_id,
            name: row.name,
            city: row.city,
            type: row.station_type,
            capacity: parseInt(row.capacity),
            maxInventory: parseInt(row.max_inventory),
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            isHighway: row.is_highway === '1',
            isMall: row.is_mall === '1',
            isOffice: row.is_office === '1',
            installationDate: row.installation_date,
            operator: row.operator,
            // Initialize live metrics
            status: this.getRandomStatus(),
            health: this.generateHealthMetrics(),
            demand: this.generateDemandMetrics(),
            inventory: this.generateInventoryMetrics(parseInt(row.max_inventory)),
            errors: this.generateErrorMetrics()
          });
        })
        .on('end', () => {
          this.stations = stations;
          console.log(`✅ Loaded ${stations.length} stations from ML dataset`);
          resolve(stations);
        })
        .on('error', (error) => {
          console.error('❌ Error loading CSV, using mock data:', error.message);
          this.stations = this.generateMockStations();
          resolve(this.stations);
        });
    });
  }

  // Generate mock stations if CSV not available
  generateMockStations() {
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'];
    const types = ['fast', 'standard', 'ultra'];
    const operators = ['ChargePoint', 'EVgo', 'Electrify America'];
    const stations = [];

    for (let i = 1; i <= 20; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const maxInventory = Math.floor(Math.random() * 30) + 20;
      
      stations.push({
        id: `ST${String(i).padStart(3, '0')}`,
        name: `${city} Station ${i}`,
        city,
        type: types[Math.floor(Math.random() * types.length)],
        capacity: Math.floor(Math.random() * 10) + 5,
        maxInventory,
        latitude: 12.9716 + (Math.random() - 0.5) * 10,
        longitude: 77.5946 + (Math.random() - 0.5) * 10,
        isHighway: Math.random() > 0.7,
        isMall: Math.random() > 0.6,
        isOffice: Math.random() > 0.5,
        installationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        operator: operators[Math.floor(Math.random() * operators.length)],
        status: this.getRandomStatus(),
        health: this.generateHealthMetrics(),
        demand: this.generateDemandMetrics(),
        inventory: this.generateInventoryMetrics(maxInventory),
        errors: this.generateErrorMetrics()
      });
    }

    return stations;
  }

  // Generate random status based on realistic distribution
  getRandomStatus() {
    const statuses = [
      { status: 'operational', weight: 70 },
      { status: 'busy', weight: 15 },
      { status: 'maintenance', weight: 8 },
      { status: 'error', weight: 5 },
      { status: 'offline', weight: 2 }
    ];
    
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const { status, weight } of statuses) {
      cumulative += weight;
      if (random <= cumulative) return status;
    }
    
    return 'operational';
  }

  // Generate health metrics
  generateHealthMetrics() {
    const baseUptime = 85 + Math.random() * 15; // 85-100%
    return {
      uptime: Math.round(baseUptime * 100) / 100,
      activeChargers: Math.floor(Math.random() * 8) + 2, // 2-10 active
      totalChargers: Math.floor(Math.random() * 5) + 8, // 8-12 total
      faultCount1h: Math.floor(Math.random() * 3), // 0-2 faults in last hour
      faultCount24h: Math.floor(Math.random() * 8), // 0-7 faults in last 24h
      mtbf: Math.round((50 + Math.random() * 200) * 100) / 100, // 50-250 hours
      temperature: Math.round((25 + Math.random() * 15) * 10) / 10, // 25-40°C
      lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  // Generate demand metrics
  generateDemandMetrics() {
    const baseSwapRate = Math.random() * 8; // 0-8 swaps per minute
    return {
      swapRequestsPerMin: Math.round(baseSwapRate * 100) / 100,
      queueLength: Math.floor(Math.random() * 12), // 0-11 vehicles
      avgWaitTime: Math.round((2 + Math.random() * 18) * 100) / 100, // 2-20 minutes
      surgeFactor: Math.round((0.5 + Math.random() * 2) * 100) / 100, // 0.5-2.5x
      peakHourMultiplier: Math.round((1 + Math.random() * 1.5) * 100) / 100,
      predictedCongestion: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
    };
  }

  // Generate inventory metrics
  generateInventoryMetrics(maxInventory) {
    const chargedBatteries = Math.floor(Math.random() * maxInventory * 0.8);
    const unchargedBatteries = Math.floor(Math.random() * (maxInventory - chargedBatteries));
    
    return {
      chargedBatteries,
      unchargedBatteries,
      totalBatteries: chargedBatteries + unchargedBatteries,
      maxCapacity: maxInventory,
      chargedRatio: Math.round((chargedBatteries / maxInventory) * 10000) / 100,
      swapToChargeImbalance: Math.round((Math.random() - 0.5) * 20 * 100) / 100,
      predictedStockout: this.predictStockoutTime(chargedBatteries, maxInventory)
    };
  }

  // Generate error metrics
  generateErrorMetrics() {
    const errorCodes = ['E001', 'E002', 'E003', 'E004', 'E005', 'E006'];
    const errors = [];
    
    // Generate 0-3 recent errors
    const errorCount = Math.floor(Math.random() * 4);
    for (let i = 0; i < errorCount; i++) {
      errors.push({
        code: errorCodes[Math.floor(Math.random() * errorCodes.length)],
        message: this.getErrorMessage(),
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        resolved: Math.random() > 0.3
      });
    }
    
    return {
      recentErrors: errors,
      recurringFaults: Math.floor(Math.random() * 3),
      lastResolvedIncident: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  getErrorMessage() {
    const messages = [
      'Charger connector fault',
      'Temperature sensor error',
      'Communication timeout',
      'Power supply instability',
      'Battery authentication failed',
      'Cooling system malfunction'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  predictStockoutTime(chargedBatteries, maxInventory) {
    if (chargedBatteries < maxInventory * 0.2) {
      return Math.floor(Math.random() * 60) + 15; // 15-75 minutes
    } else if (chargedBatteries < maxInventory * 0.4) {
      return Math.floor(Math.random() * 120) + 60; // 60-180 minutes
    }
    return null; // No stockout predicted
  }

  // Start live data generation (every 30-40 seconds)
  startLiveDataGeneration() {
    const updateInterval = () => {
      // Random interval between 30-40 seconds
      return 30000 + Math.random() * 10000;
    };

    const updateLiveData = () => {
      this.stations.forEach(station => {
        // Update metrics with realistic variations
        this.updateStationMetrics(station);
      });

      // Schedule next update
      setTimeout(updateLiveData, updateInterval());
    };

    // Start the update cycle
    setTimeout(updateLiveData, updateInterval());
  }

  updateStationMetrics(station) {
    // Update demand metrics (most volatile)
    station.demand.swapRequestsPerMin = Math.max(0, 
      station.demand.swapRequestsPerMin + (Math.random() - 0.5) * 2
    );
    
    station.demand.queueLength = Math.max(0, 
      Math.floor(station.demand.queueLength + (Math.random() - 0.5) * 3)
    );
    
    station.demand.avgWaitTime = Math.max(1, 
      station.demand.avgWaitTime + (Math.random() - 0.5) * 4
    );

    // Update inventory (based on demand)
    const swapActivity = Math.floor(Math.random() * 3); // 0-2 swaps in this interval
    station.inventory.chargedBatteries = Math.max(0, 
      Math.min(station.inventory.maxCapacity, 
        station.inventory.chargedBatteries - swapActivity + Math.floor(Math.random() * 2)
      )
    );
    
    station.inventory.chargedRatio = Math.round(
      (station.inventory.chargedBatteries / station.inventory.maxCapacity) * 10000
    ) / 100;

    // Update health metrics (slower changes)
    if (Math.random() < 0.1) { // 10% chance to update health
      station.health.uptime = Math.max(70, Math.min(100, 
        station.health.uptime + (Math.random() - 0.5) * 5
      ));
      
      station.health.temperature = Math.max(20, Math.min(50, 
        station.health.temperature + (Math.random() - 0.5) * 3
      ));
    }

    // Update status based on metrics
    station.status = this.calculateStationStatus(station);
    
    // Update predictions
    station.inventory.predictedStockout = this.predictStockoutTime(
      station.inventory.chargedBatteries, 
      station.inventory.maxCapacity
    );
    
    station.demand.predictedCongestion = this.predictCongestion(station);
  }

  calculateStationStatus(station) {
    // Determine status based on current metrics
    if (station.health.uptime < 80 || station.health.faultCount1h > 2) {
      return 'error';
    } else if (station.inventory.chargedBatteries === 0) {
      return 'offline';
    } else if (station.demand.queueLength > 8) {
      return 'busy';
    } else if (station.health.uptime < 95 || station.health.faultCount1h > 0) {
      return 'maintenance';
    }
    return 'operational';
  }

  predictCongestion(station) {
    const congestionScore = 
      (station.demand.queueLength * 0.4) + 
      (station.demand.avgWaitTime * 0.3) + 
      (station.demand.surgeFactor * 0.3);
    
    if (congestionScore > 15) return 'high';
    if (congestionScore > 8) return 'medium';
    return 'low';
  }

  // API methods
  getAllStations() {
    return this.stations;
  }

  getStationById(id) {
    return this.stations.find(station => station.id === id);
  }

  getStationsByCity(city) {
    return this.stations.filter(station => 
      station.city.toLowerCase() === city.toLowerCase()
    );
  }

  getStationsByStatus(status) {
    return this.stations.filter(station => station.status === status);
  }

  getCityOverview() {
    const cities = {};
    
    this.stations.forEach(station => {
      if (!cities[station.city]) {
        cities[station.city] = {
          totalStations: 0,
          operational: 0,
          busy: 0,
          maintenance: 0,
          error: 0,
          offline: 0,
          avgUptime: 0,
          totalCapacity: 0,
          totalInventory: 0
        };
      }
      
      const cityData = cities[station.city];
      cityData.totalStations++;
      cityData[station.status]++;
      cityData.avgUptime += station.health.uptime;
      cityData.totalCapacity += station.capacity;
      cityData.totalInventory += station.inventory.chargedBatteries;
    });
    
    // Calculate averages
    Object.keys(cities).forEach(city => {
      cities[city].avgUptime = Math.round(
        (cities[city].avgUptime / cities[city].totalStations) * 100
      ) / 100;
    });
    
    return cities;
  }

  getSystemOverview() {
    const overview = {
      totalStations: this.stations.length,
      statusBreakdown: {
        operational: 0,
        busy: 0,
        maintenance: 0,
        error: 0,
        offline: 0
      },
      avgMetrics: {
        uptime: 0,
        queueLength: 0,
        chargedRatio: 0,
        waitTime: 0
      },
      alerts: {
        criticalErrors: 0,
        stockoutWarnings: 0,
        congestionAlerts: 0,
        maintenanceRequired: 0
      }
    };

    let totalUptime = 0;
    let totalQueueLength = 0;
    let totalChargedRatio = 0;
    let totalWaitTime = 0;

    this.stations.forEach(station => {
      // Status breakdown
      overview.statusBreakdown[station.status]++;
      
      // Metrics
      totalUptime += station.health.uptime;
      totalQueueLength += station.demand.queueLength;
      totalChargedRatio += station.inventory.chargedRatio;
      totalWaitTime += station.demand.avgWaitTime;
      
      // Alerts
      if (station.status === 'error' || station.health.faultCount1h > 2) {
        overview.alerts.criticalErrors++;
      }
      if (station.inventory.predictedStockout && station.inventory.predictedStockout < 60) {
        overview.alerts.stockoutWarnings++;
      }
      if (station.demand.queueLength > 6) {
        overview.alerts.congestionAlerts++;
      }
      if (station.health.uptime < 90) {
        overview.alerts.maintenanceRequired++;
      }
    });

    // Calculate averages
    const stationCount = this.stations.length;
    overview.avgMetrics.uptime = Math.round((totalUptime / stationCount) * 100) / 100;
    overview.avgMetrics.queueLength = Math.round((totalQueueLength / stationCount) * 100) / 100;
    overview.avgMetrics.chargedRatio = Math.round((totalChargedRatio / stationCount) * 100) / 100;
    overview.avgMetrics.waitTime = Math.round((totalWaitTime / stationCount) * 100) / 100;

    return overview;
  }
}

export default new StationDataService();