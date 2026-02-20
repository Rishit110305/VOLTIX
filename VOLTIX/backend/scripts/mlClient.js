import axios from 'axios';

class MLClient {
  constructor() {
    this.baseURL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    this.timeout = parseInt(process.env.ML_TIMEOUT) || 30000;
    this.retryAttempts = parseInt(process.env.ML_RETRY_ATTEMPTS) || 3;
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[ML Client] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[ML Client] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('[ML Client] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`ML Service health check failed: ${error.message}`);
    }
  }

  // mechanic agents

  async predictFailure(sensorData) {
    try {
      const response = await this.client.post('/mechanic/predict-failure', sensorData);
      return response.data;
    } catch (error) {
      throw new Error(`Failure prediction failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  // traffic agents
  async predictTrafficDemand(stationData, forecastHours = 4) {
    try {
      const response = await this.client.post('/traffic/predict-demand', {
        ...stationData,
        forecast_hours: forecastHours
      });
      return response.data;
    } catch (error) {
      throw new Error(`Traffic demand prediction failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  async calculateIncentive(currentStation, alternativeStation, userProfile = null) {
    try {
      const response = await this.client.post('/traffic/calculate-incentive', {
        current_station: currentStation,
        alternative_station: alternativeStation,
        user_profile: userProfile
      });
      return response.data;
    } catch (error) {
      throw new Error(`Incentive calculation failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  // logistics agents

  async predictStockout(logisticsData, forecastHours = 6) {
    try {
      const response = await this.client.post('/logistics/predict-stockout', {
        ...logisticsData,
        forecast_hours: forecastHours
      });
      return response.data;
    } catch (error) {
      throw new Error(`Stockout prediction failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  async optimizeDispatch(logisticsData, availableVehicles = []) {
    try {
      const response = await this.client.post('/logistics/optimize-dispatch', {
        ...logisticsData,
        available_vehicles: availableVehicles
      });
      return response.data;
    } catch (error) {
      throw new Error(`Dispatch optimization failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  // energy agents

  async predictEnergyPrices(marketData, forecastHours = 24) {
    try {
      const response = await this.client.post('/energy/predict-prices', {
        ...marketData,
        forecast_hours: forecastHours
      });
      return response.data;
    } catch (error) {
      throw new Error(`Energy price prediction failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  async optimizeTrading(marketData, stationData) {
    try {
      const response = await this.client.post('/energy/optimize-trading', {
        market_data: marketData,
        station_data: stationData
      });
      return response.data;
    } catch (error) {
      throw new Error(`Trading optimization failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  // auditor agents

  async analyzeDecision(decisionData) {
    try {
      const response = await this.client.post('/audit/analyze-decision', decisionData);
      return response.data;
    } catch (error) {
      throw new Error(`Decision analysis failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  async batchAnalyzeDecisions(decisions) {
    try {
      const response = await this.client.post('/audit/batch-analyze', decisions);
      return response.data;
    } catch (error) {
      throw new Error(`Batch decision analysis failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  // route agents
  async calculateRoute(startCoords, endCoords, profile = 'driving') {
    try {
      const response = await this.client.post('/route/calculate', {
        start_coords: startCoords,
        end_coords: endCoords,
        profile: profile
      });
      return response.data;
    } catch (error) {
      throw new Error(`Route calculation failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  async optimizeStationSelection(userLocation, stations, preferences = null) {
    try {
      const response = await this.client.post('/route/optimize-station', {
        user_location: userLocation,
        stations: stations,
        preferences: preferences
      });
      return response.data;
    } catch (error) {
      throw new Error(`Station optimization failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  async optimizeMultiStopRoute(startLocation, stops, endLocation = null) {
    try {
      const response = await this.client.post('/route/multi-stop', {
        start_location: startLocation,
        stops: stops,
        end_location: endLocation
      });
      return response.data;
    } catch (error) {
      throw new Error(`Multi-stop route optimization failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  async getAlternativeRoutes(startCoords, endCoords, numAlternatives = 3) {
    try {
      const response = await this.client.post('/route/alternatives', {
        start_coords: startCoords,
        end_coords: endCoords,
        num_alternatives: numAlternatives
      });
      return response.data;
    } catch (error) {
      throw new Error(`Alternative routes failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  async assessRouteRisk(startCoords, endCoords, weatherConditions = null) {
    try {
      const response = await this.client.post('/route/risk-assessment', {
        start_coords: startCoords,
        end_coords: endCoords,
        weather_conditions: weatherConditions
      });
      return response.data;
    } catch (error) {
      throw new Error(`Route risk assessment failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  // comprehensive analysis

  async comprehensiveAnalysis(sensorData, stationData, logisticsData, marketData, userLocation = null) {
    try {
      const response = await this.client.post('/agents/comprehensive-analysis', {
        sensor_data: sensorData,
        station_data: stationData,
        logistics_data: logisticsData,
        market_data: marketData,
        user_location: userLocation
      });
      return response.data;
    } catch (error) {
      throw new Error(`Comprehensive analysis failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  // retrain model
  async retrainModel(modelName) {
    try {
      const response = await this.client.post(`/models/retrain/${modelName}`);
      return response.data;
    } catch (error) {
      throw new Error(`Model retraining failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  async getModelsStatus() {
    try {
      const response = await this.client.get('/models/status');
      return response.data;
    } catch (error) {
      throw new Error(`Models status check failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  // retry request
  async retryRequest(requestFn, attempts = this.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await requestFn();
      } catch (error) {
        if (i === attempts - 1) throw error;
        
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`[ML Client] Retry attempt ${i + 1}/${attempts} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Check if ML service is available
  async isServiceAvailable() {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get service info
  getServiceInfo() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts
    };
  }
}

// Create singleton instance
const mlClient = new MLClient();

export default mlClient;