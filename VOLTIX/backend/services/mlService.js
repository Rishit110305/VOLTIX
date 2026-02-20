import mlClient from '../scripts/mlClient.js';
import ExpressError from '../middlewares/expressError.js';

class MLService {
  // health check
  async checkHealth() {
    try {
      const health = await mlClient.healthCheck();
      const serviceInfo = mlClient.getServiceInfo();

      return {
        success: true,
        ml_service: health,
        client_config: serviceInfo,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: 'ML Service unavailable',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // get service info
  async getServiceInfo() {
    const serviceInfo = mlClient.getServiceInfo();
    const isAvailable = await mlClient.isServiceAvailable();

    return {
      success: true,
      serviceInfo,
      isAvailable,
      timestamp: new Date().toISOString()
    };
  }

  // mechanic agents  

  // predict failure
  async predictFailure(stationId, sensorData) {
    if (!sensorData) {
      throw new ExpressError(400, 'Sensor data is required for failure prediction');
    }

    try {
      const prediction = await mlClient.predictFailure(sensorData);

      return {
        success: true,
        stationId,
        prediction,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  // traffic agents

  async predictTrafficDemand(stationId, stationData, forecastHours = 4) {
    if (!stationData) {
      throw new ExpressError(400, 'Station data is required for traffic prediction');
    }

    try {
      const prediction = await mlClient.predictTrafficDemand(stationData, forecastHours);

      return {
        success: true,
        stationId,
        prediction,
        forecastHours,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  // calculate incentive
  async calculateIncentive(currentStation, alternativeStation, userProfile = null) {
    if (!currentStation || !alternativeStation) {
      throw new ExpressError(400, 'Both current and alternative station data are required');
    }

    try {
      const incentive = await mlClient.calculateIncentive(
        currentStation,
        alternativeStation,
        userProfile
      );

      return {
        success: true,
        incentive,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  // logistics agents

  async predictStockout(stationId, logisticsData, forecastHours = 6) {
    if (!logisticsData) {
      throw new ExpressError(400, 'Logistics data is required for stockout prediction');
    }

    try {
      const prediction = await mlClient.predictStockout(logisticsData, forecastHours);

      return {
        success: true,
        stationId,
        prediction,
        forecastHours,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  async optimizeDispatch(stationId, logisticsData, availableVehicles = []) {
    if (!logisticsData) {
      throw new ExpressError(400, 'Logistics data is required for dispatch optimization');
    }

    try {
      const optimization = await mlClient.optimizeDispatch(logisticsData, availableVehicles);

      return {
        success: true,
        stationId,
        optimization,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  // energy agents

  async predictEnergyPrices(marketData, forecastHours = 24) {
    if (!marketData) {
      throw new ExpressError(400, 'Market data is required for energy price prediction');
    }

    try {
      const prediction = await mlClient.predictEnergyPrices(marketData, forecastHours);

      return {
        success: true,
        prediction,
        forecastHours,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  async optimizeTrading(marketData, stationData) {
    if (!marketData || !stationData) {
      throw new ExpressError(400, 'Both market data and station data are required for trading optimization');
    }

    try {
      const optimization = await mlClient.optimizeTrading(marketData, stationData);

      return {
        success: true,
        optimization,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  // auditor agents

  async analyzeDecision(decisionData) {
    if (!decisionData.agent || !decisionData.action) {
      throw new ExpressError(400, 'Agent and action are required for decision analysis');
    }

    try {
      const analysis = await mlClient.analyzeDecision(decisionData);

      return {
        success: true,
        analysis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  async batchAnalyzeDecisions(decisions) {
    if (!Array.isArray(decisions) || decisions.length === 0) {
      throw new ExpressError(400, 'Array of decisions is required for batch analysis');
    }

    try {
      const analysis = await mlClient.batchAnalyzeDecisions(decisions);

      return {
        success: true,
        analysis,
        decisionsCount: decisions.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  // route optimizer

  async calculateRoute(startCoords, endCoords, profile = 'driving') {
    try {
      const route = await mlClient.calculateRoute(startCoords, endCoords, profile);

      return {
        success: true,
        route,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  async optimizeStationSelection(userLocation, stations, preferences = null) {
    try {
      const optimization = await mlClient.optimizeStationSelection(
        userLocation,
        stations,
        preferences
      );

      return {
        success: true,
        optimization,
        stationsEvaluated: stations.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  async optimizeMultiStopRoute(startLocation, stops, endLocation = null) {
    if (!Array.isArray(startLocation) || startLocation.length !== 2) {
      throw new ExpressError(400, 'Start location must be [latitude, longitude]');
    }

    if (!Array.isArray(stops) || stops.length === 0) {
      throw new ExpressError(400, 'Stops array is required and cannot be empty');
    }

    try {
      const optimization = await mlClient.optimizeMultiStopRoute(
        startLocation,
        stops,
        endLocation
      );

      return {
        success: true,
        optimization,
        stopsCount: stops.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  async getAlternativeRoutes(startCoords, endCoords, numAlternatives = 3) {
    try {
      const routes = await mlClient.getAlternativeRoutes(
        startCoords,
        endCoords,
        numAlternatives
      );

      return {
        success: true,
        routes,
        alternativesRequested: numAlternatives,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  async assessRouteRisk(startCoords, endCoords, weatherConditions = null) {
    try {
      const assessment = await mlClient.assessRouteRisk(
        startCoords,
        endCoords,
        weatherConditions
      );

      return {
        success: true,
        assessment,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  // comprehensive analysis

  async comprehensiveAnalysis(stationId, sensorData, stationData, logisticsData, marketData, userLocation = null) {
    try {
      const analysis = await mlClient.comprehensiveAnalysis(
        sensorData,
        stationData,
        logisticsData,
        marketData,
        userLocation
      );

      return {
        success: true,
        stationId,
        analysis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  // retrain model

  async retrainModel(modelName) {
    const validModels = ['failure', 'traffic', 'logistics', 'energy', 'audit'];
    if (!validModels.includes(modelName)) {
      throw new ExpressError(400, `Invalid model name. Valid models: ${validModels.join(', ')}`);
    }

    try {
      const result = await mlClient.retrainModel(modelName);

      return {
        success: true,
        result,
        modelName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }

  // get models status

  async getModelsStatus() {
    try {
      const status = await mlClient.getModelsStatus();

      return {
        success: true,
        status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExpressError(500, error.message);
    }
  }
}

// Create singleton instance
const mlService = new MLService();

export default mlService;