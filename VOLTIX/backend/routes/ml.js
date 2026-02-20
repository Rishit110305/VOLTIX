import express from 'express';
import mlClient from '../scripts/mlClient.js';
import wrapAsync from '../middlewares/wrapAsync.js';
import ExpressError from '../middlewares/expressError.js';
import {
  validateMLPredictionRequest,
  validateRouteRequest,
  validateStationOptimizationRequest
} from '../middlewares/validate.js';

const router = express.Router();

// health check
router.get('/health', wrapAsync(async (req, res) => {
  try {
    const health = await mlClient.healthCheck();
    const serviceInfo = mlClient.getServiceInfo();
    
    res.json({
      success: true,
      ml_service: health,
      client_config: serviceInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'ML Service unavailable',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

// mechanic agent routes

router.post('/mechanic/predict-failure', validateMLPredictionRequest, wrapAsync(async (req, res) => {
  const { stationId, sensorData } = req.body;
  
  if (!sensorData) {
    throw new ExpressError(400, 'Sensor data is required for failure prediction');
  }

  try {
    const prediction = await mlClient.predictFailure(sensorData);
    
    res.json({
      success: true,
      stationId,
      prediction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

// traffic agent routes
router.post('/traffic/predict-demand', validateMLPredictionRequest, wrapAsync(async (req, res) => {
  const { stationId, stationData, forecastHours = 4 } = req.body;
  
  if (!stationData) {
    throw new ExpressError(400, 'Station data is required for traffic prediction');
  }

  try {
    const prediction = await mlClient.predictTrafficDemand(stationData, forecastHours);
    
    res.json({
      success: true,
      stationId,
      prediction,
      forecastHours,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

router.post('/traffic/calculate-incentive', validateMLPredictionRequest, wrapAsync(async (req, res) => {
  const { 
    currentStation, 
    alternativeStation, 
    userProfile = null 
  } = req.body;
  
  if (!currentStation || !alternativeStation) {
    throw new ExpressError(400, 'Both current and alternative station data are required');
  }

  try {
    const incentive = await mlClient.calculateIncentive(
      currentStation, 
      alternativeStation, 
      userProfile
    );
    
    res.json({
      success: true,
      incentive,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

// logistics agent routes
router.post('/logistics/predict-stockout', validateMLPredictionRequest, wrapAsync(async (req, res) => {
  const { stationId, logisticsData, forecastHours = 6 } = req.body;
  
  if (!logisticsData) {
    throw new ExpressError(400, 'Logistics data is required for stockout prediction');
  }

  try {
    const prediction = await mlClient.predictStockout(logisticsData, forecastHours);
    
    res.json({
      success: true,
      stationId,
      prediction,
      forecastHours,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

router.post('/logistics/optimize-dispatch', validateMLPredictionRequest, wrapAsync(async (req, res) => {
  const { 
    stationId, 
    logisticsData, 
    availableVehicles = [] 
  } = req.body;
  
  if (!logisticsData) {
    throw new ExpressError(400, 'Logistics data is required for dispatch optimization');
  }

  try {
    const optimization = await mlClient.optimizeDispatch(logisticsData, availableVehicles);
    
    res.json({
      success: true,
      stationId,
      optimization,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

// energy agent routes
router.post('/energy/predict-prices', validateMLPredictionRequest, wrapAsync(async (req, res) => {
  const { marketData, forecastHours = 24 } = req.body;
  
  if (!marketData) {
    throw new ExpressError(400, 'Market data is required for energy price prediction');
  }

  try {
    const prediction = await mlClient.predictEnergyPrices(marketData, forecastHours);
    
    res.json({
      success: true,
      prediction,
      forecastHours,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

router.post('/energy/optimize-trading', validateMLPredictionRequest, wrapAsync(async (req, res) => {
  const { marketData, stationData } = req.body;
  
  if (!marketData || !stationData) {
    throw new ExpressError(400, 'Both market data and station data are required for trading optimization');
  }

  try {
    const optimization = await mlClient.optimizeTrading(marketData, stationData);
    
    res.json({
      success: true,
      optimization,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

// auditor agent routes
router.post('/audit/analyze-decision', wrapAsync(async (req, res) => {
  const decisionData = req.body;
  
  if (!decisionData.agent || !decisionData.action) {
    throw new ExpressError(400, 'Agent and action are required for decision analysis');
  }

  try {
    const analysis = await mlClient.analyzeDecision(decisionData);
    
    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

router.post('/audit/batch-analyze', wrapAsync(async (req, res) => {
  const decisions = req.body;
  
  if (!Array.isArray(decisions) || decisions.length === 0) {
    throw new ExpressError(400, 'Array of decisions is required for batch analysis');
  }

  try {
    const analysis = await mlClient.batchAnalyzeDecisions(decisions);
    
    res.json({
      success: true,
      analysis,
      decisionsCount: decisions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

// route optimizer routes
router.post('/route/calculate', validateRouteRequest, wrapAsync(async (req, res) => {
  const { startCoords, endCoords, profile = 'driving' } = req.body;

  try {
    const route = await mlClient.calculateRoute(startCoords, endCoords, profile);
    
    res.json({
      success: true,
      route,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

router.post('/route/optimize-station', validateStationOptimizationRequest, wrapAsync(async (req, res) => {
  const { userLocation, stations, preferences = null } = req.body;

  try {
    const optimization = await mlClient.optimizeStationSelection(
      userLocation, 
      stations, 
      preferences
    );
    
    res.json({
      success: true,
      optimization,
      stationsEvaluated: stations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

router.post('/route/multi-stop', wrapAsync(async (req, res) => {
  const { startLocation, stops, endLocation = null } = req.body;
  
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
    
    res.json({
      success: true,
      optimization,
      stopsCount: stops.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

router.post('/route/alternatives', validateRouteRequest, wrapAsync(async (req, res) => {
  const { startCoords, endCoords, numAlternatives = 3 } = req.body;

  try {
    const routes = await mlClient.getAlternativeRoutes(
      startCoords, 
      endCoords, 
      numAlternatives
    );
    
    res.json({
      success: true,
      routes,
      alternativesRequested: numAlternatives,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

router.post('/route/risk-assessment', validateRouteRequest, wrapAsync(async (req, res) => {
  const { startCoords, endCoords, weatherConditions = null } = req.body;

  try {
    const assessment = await mlClient.assessRouteRisk(
      startCoords, 
      endCoords, 
      weatherConditions
    );
    
    res.json({
      success: true,
      assessment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

// comprehensive analysis

router.post('/comprehensive-analysis', validateMLPredictionRequest, wrapAsync(async (req, res) => {
  const { 
    stationId,
    sensorData, 
    stationData, 
    logisticsData, 
    marketData, 
    userLocation = null 
  } = req.body;

  try {
    const analysis = await mlClient.comprehensiveAnalysis(
      sensorData, 
      stationData, 
      logisticsData, 
      marketData, 
      userLocation
    );
    
    res.json({
      success: true,
      stationId,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

// model management routes

router.post('/models/retrain/:modelName', wrapAsync(async (req, res) => {
  const { modelName } = req.params;
  
  const validModels = ['failure', 'traffic', 'logistics', 'energy', 'audit'];
  if (!validModels.includes(modelName)) {
    throw new ExpressError(400, `Invalid model name. Valid models: ${validModels.join(', ')}`);
  }

  try {
    const result = await mlClient.retrainModel(modelName);
    
    res.json({
      success: true,
      result,
      modelName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

router.get('/models/status', wrapAsync(async (req, res) => {
  try {
    const status = await mlClient.getModelsStatus();
    
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new ExpressError(500, error.message);
  }
}));

// utility routes

router.get('/service-info', wrapAsync(async (req, res) => {
  const serviceInfo = mlClient.getServiceInfo();
  const isAvailable = await mlClient.isServiceAvailable();
  
  res.json({
    success: true,
    serviceInfo,
    isAvailable,
    timestamp: new Date().toISOString()
  });
}));

// Error handling middleware for ML routes
router.use((error, req, res, next) => {
  console.error('[ML Routes] Error:', error);
  
  if (error instanceof ExpressError) {
    return res.status(error.status).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal ML service error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

export default router;