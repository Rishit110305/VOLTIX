import BaseAgent from './BaseAgent.js';
import mlService from '../services/mlService.js';

class LogisticsAgent extends BaseAgent {
  constructor() {
    super('LogisticsAgent');
    
    // Logistics-specific configuration
    this.config = {
      ...this.config,
      requiresSupervisorApproval: true, // Dispatch requires approval
      escalationThreshold: 0.5,
      confidenceThreshold: 0.8,
      maxDispatchCost: 5000 // Maximum cost for emergency dispatch
    };
    
    // Inventory thresholds
    this.thresholds = {
      inventory: { 
        critical: 3,    // Less than 3 units
        warning: 8,     // Less than 8 units
        optimal: 15     // Target inventory level
      },
      stockoutRisk: {
        high: 0.8,      // 80% chance of stockout
        medium: 0.5     // 50% chance of stockout
      },
      demandForecast: {
        surge: 1.5,     // 50% above normal
        normal: 1.0,
        low: 0.7        // 30% below normal
      }
    };
  }

  // DETECT: Check for inventory issues or stockout risk
  async detect(eventData) {
    try {
      const data = eventData.data;
      const issues = [];
      
      // Check current inventory level
      const currentInventory = data.currentInventory || data.inventory || 0;
      const maxInventory = data.maxInventory || 20;
      
      if (currentInventory <= this.thresholds.inventory.critical) {
        issues.push(`Critical inventory: ${currentInventory} units`);
      } else if (currentInventory <= this.thresholds.inventory.warning) {
        issues.push(`Low inventory: ${currentInventory} units`);
      }
      
      // Check demand vs supply
      const queueLength = data.queueLength || 0;
      const demandRate = queueLength / Math.max(currentInventory, 1);
      
      if (demandRate > 2) {
        issues.push(`High demand pressure: ${queueLength} queue vs ${currentInventory} inventory`);
      }
      
      // Check for rapid inventory depletion
      const inventoryRate = data.inventoryChangeRate || 0;
      if (inventoryRate < -0.5) { // Losing more than 0.5 units per hour
        issues.push(`Rapid inventory depletion: ${inventoryRate} units/hour`);
      }
      
      // Check for user events that increase demand
      if (eventData.type === 'user_event' && eventData.data.type === 'charging_start') {
        if (currentInventory <= this.thresholds.inventory.warning) {
          issues.push('New charging session started with low inventory');
        }
      }
      
      if (issues.length > 0) {
        return {
          shouldProcess: true,
          reason: `Inventory issues detected: ${issues.join(', ')}`,
          context: {
            issues,
            currentInventory,
            maxInventory,
            queueLength,
            demandRate,
            inventoryRate,
            urgencyLevel: this.calculateUrgency(currentInventory, queueLength, inventoryRate)
          }
        };
      }
      
      return {
        shouldProcess: false,
        reason: 'No inventory issues detected'
      };
      
    } catch (error) {
      console.error(`[LogisticsAgent] Detection error:`, error);
      return {
        shouldProcess: false,
        reason: `Detection failed: ${error.message}`
      };
    }
  }

  // DECIDE: Advanced predictive dispatch with ML-powered stockout prevention
  async decide(eventData, context) {
    try {
      const currentInventory = context.currentInventory;
      const queueLength = context.queueLength;
      const urgencyLevel = context.urgencyLevel;
      
      // Use simple predictors for stockout prediction
      let prediction = null;
      try {
        const burnRate = Math.abs(context.inventoryRate) || (queueLength * 0.5); // Estimate burn rate
        const simplePredictors = await import('../services/simplePredictors.js').then(module => module.default);
        prediction = simplePredictors.predictStockout(currentInventory, burnRate);
        console.log(`[LogisticsAgent] Stockout prediction: ${prediction.stockoutSoon ? 'YES' : 'NO'} (${prediction.hoursLeft}h left, confidence: ${prediction.confidence})`);
      } catch (predictionError) {
        console.warn(`[LogisticsAgent] Simple prediction failed:`, predictionError.message);
      }
      
      let action = 'monitor';
      let confidence = 0.7;
      let riskScore = 0.3;
      let autonomyLevel = 3; // Human-in-the-loop for physical dispatch
      let impact = {
        costImpact: 0,
        revenueImpact: 0,
        successRate: 0.8,
        userSatisfaction: 0.8,
        riskScore: 0.3
      };
      
      // Advanced decision matrix based on ML predictions and urgency
      if (currentInventory <= this.thresholds.inventory.critical || urgencyLevel === 'critical') {
        action = 'execute_emergency_dispatch';
        confidence = 0.95;
        riskScore = 0.7;
        autonomyLevel = 3; // Requires human approval for emergency dispatch
        
        const dispatchPlan = this.createEmergencyDispatchPlan(eventData, context, mlPrediction);
        
        impact = {
          costImpact: -dispatchPlan.totalCost,
          revenueImpact: dispatchPlan.expectedRevenue,
          successRate: 0.95,
          userSatisfaction: 0.9,
          riskScore: 0.7,
          dispatchPlan,
          urgencyLevel: 'critical',
          estimatedArrival: dispatchPlan.eta
        };
      }
      // Predictive dispatch based on simple stockout prediction
      else if (prediction?.stockoutSoon || urgencyLevel === 'high') {
        action = 'execute_predictive_dispatch';
        confidence = 0.9;
        riskScore = 0.4;
        autonomyLevel = 3;
        
        const predictiveDispatch = this.createPredictiveDispatchPlan(eventData, context, prediction);
        
        impact = {
          costImpact: -predictiveDispatch.totalCost,
          revenueImpact: predictiveDispatch.expectedRevenue,
          successRate: 0.88,
          userSatisfaction: 0.95, // Users love proactive service
          riskScore: 0.4,
          dispatchPlan: predictiveDispatch,
          simplePredictorDriven: true,
          preventiveAction: true,
          stockoutProbability: prediction?.confidence || 0.8
        };
      }
      // Regular dispatch for low inventory
      else if (currentInventory <= this.thresholds.inventory.warning || urgencyLevel === 'high') {
        action = 'schedule_regular_dispatch';
        confidence = 0.85;
        riskScore = 0.35;
        autonomyLevel = 3;
        
        const regularDispatch = this.createRegularDispatchPlan(eventData, context);
        
        impact = {
          costImpact: -regularDispatch.totalCost,
          revenueImpact: regularDispatch.expectedRevenue,
          successRate: 0.9,
          userSatisfaction: 0.85,
          riskScore: 0.35,
          dispatchPlan: regularDispatch,
          scheduledDispatch: true
        };
      }
      // Optimization dispatch for efficiency
      else if (prediction?.urgencyLevel === 'medium' && currentInventory > this.thresholds.inventory.critical) {
        action = 'execute_optimization_dispatch';
        confidence = 0.8;
        riskScore = 0.25;
        autonomyLevel = 5; // Can be fully automated for optimization
        
        const optimizationDispatch = this.createOptimizationDispatchPlan(eventData, context, prediction);
        
        impact = {
          costImpact: -optimizationDispatch.totalCost,
          revenueImpact: optimizationDispatch.expectedRevenue,
          successRate: 0.85,
          userSatisfaction: 0.9,
          riskScore: 0.25,
          dispatchPlan: optimizationDispatch,
          optimizationFocused: true,
          efficiencyGain: optimizationDispatch.efficiencyGain
        };
      }
      
      // Enhance decision with simple prediction insights
      if (prediction) {
        confidence = Math.min(confidence + 0.1, 0.95);
        
        // Add prediction insights to impact
        impact.predictionInsights = {
          stockoutSoon: prediction.stockoutSoon,
          hoursLeft: prediction.hoursLeft,
          urgencyLevel: prediction.urgencyLevel,
          confidence: prediction.confidence,
          recommendation: prediction.recommendation || 'Monitor inventory levels'
        };
      }
      
      return {
        success: true,
        action,
        confidence,
        riskScore,
        autonomyLevel,
        impact,
        reasoning: `Inventory: ${currentInventory}, Queue: ${queueLength}, Urgency: ${urgencyLevel}, ML Stockout Risk: ${mlPrediction?.prediction?.stockout_probability || 'N/A'}`,
        mlPrediction: prediction,
        priority: urgencyLevel === 'critical' ? 'urgent' : 'high',
        requiresApproval: autonomyLevel <= 3,
        dispatchStrategy: this.determineDispatchStrategy(currentInventory, urgencyLevel, mlPrediction)
      };
      
    } catch (error) {
      console.error(`[LogisticsAgent] Decision error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ACT: Execute logistics action
  async act(decision, eventData) {
    try {
      const stationId = eventData.stationId;
      const action = decision.action;
      
      console.log(`[LogisticsAgent] Executing ${action} on ${stationId}`);
      
      let result = {
        success: true,
        message: '',
        stationId,
        responseTime: 0,
        accuracy: 1.0
      };
      
      const startTime = Date.now();
      
      switch (action) {
        case 'emergency_dispatch':
          // Simulate emergency dispatch
          await this.simulateDelay(5000);
          const emergencyUnits = decision.impact.unitsToDispatch || 10;
          const emergencyCost = decision.impact.dispatchCost || 2000;
          
          result.message = `Emergency dispatch initiated: ${emergencyUnits} units, ETA ${decision.impact.estimatedArrival}`;
          result.impact = {
            dispatchType: 'emergency',
            unitsDispatched: emergencyUnits,
            totalCost: emergencyCost,
            vehicleAssigned: 'TRUCK_001',
            priority: 'urgent',
            trackingId: `EMG_${Date.now()}`
          };
          break;
          
        case 'schedule_dispatch':
          // Simulate regular dispatch scheduling
          await this.simulateDelay(3000);
          const regularUnits = decision.impact.unitsToDispatch || 8;
          const regularCost = decision.impact.dispatchCost || 1200;
          
          result.message = `Regular dispatch scheduled: ${regularUnits} units, ETA ${decision.impact.estimatedArrival}`;
          result.impact = {
            dispatchType: 'regular',
            unitsDispatched: regularUnits,
            totalCost: regularCost,
            vehicleAssigned: 'TRUCK_002',
            priority: 'high',
            trackingId: `REG_${Date.now()}`
          };
          break;
          
        case 'predictive_restock':
          // Simulate predictive restocking
          await this.simulateDelay(2000);
          const predictiveUnits = decision.impact.unitsToDispatch || 6;
          const predictiveCost = decision.impact.dispatchCost || 800;
          
          result.message = `Predictive restock initiated: ${predictiveUnits} units, ETA ${decision.impact.estimatedArrival}`;
          result.impact = {
            dispatchType: 'predictive',
            unitsDispatched: predictiveUnits,
            totalCost: predictiveCost,
            vehicleAssigned: 'TRUCK_003',
            priority: 'medium',
            trackingId: `PRD_${Date.now()}`,
            mlDriven: true
          };
          break;
          
        default:
          result.message = `Monitoring inventory at ${stationId} - no dispatch required`;
          result.impact = { monitoringActive: true };
      }
      
      result.responseTime = Date.now() - startTime;
      
      return result;
      
    } catch (error) {
      console.error(`[LogisticsAgent] Action error:`, error);
      return {
        success: false,
        error: error.message,
        stationId: eventData.stationId
      };
    }
  }

  // VERIFY: Check if logistics action was successful
  async verify(actionResult, eventData) {
    try {
      // In a real system, this would check dispatch status and ETA
      // For now, we'll simulate verification based on action type
      
      const action = actionResult.message;
      let success = true;
      let reason = 'Logistics action completed successfully';
      let effectivenessScore = 0.9;
      
      // Simulate different success rates for different dispatch types
      if (action.includes('emergency')) {
        // Emergency dispatch has high success rate but high cost
        effectivenessScore = 0.95;
        reason = 'Emergency dispatch confirmed - high priority delivery';
      } else if (action.includes('regular')) {
        // Regular dispatch has good success rate
        effectivenessScore = 0.85;
        reason = 'Regular dispatch scheduled - normal delivery timeline';
      } else if (action.includes('predictive')) {
        // Predictive restocking has variable success based on ML accuracy
        effectivenessScore = Math.random() * 0.3 + 0.7; // 70-100%
        reason = `Predictive restock initiated - ML confidence: ${(effectivenessScore * 100).toFixed(1)}%`;
      }
      
      // Small chance of dispatch failure
      if (Math.random() < 0.05) {
        success = false;
        reason = 'Dispatch failed - vehicle breakdown or route issues';
        effectivenessScore = 0.1;
      }
      
      return {
        success,
        reason,
        metrics: {
          responseTime: actionResult.responseTime,
          accuracy: success ? 1.0 : 0.0,
          effectivenessScore,
          dispatchReliability: effectivenessScore
        }
      };
      
    } catch (error) {
      console.error(`[LogisticsAgent] Verification error:`, error);
      return {
        success: false,
        reason: `Verification failed: ${error.message}`
      };
    }
  }

  // Advanced helper methods for predictive dispatch planning
  createEmergencyDispatchPlan(eventData, context, mlPrediction) {
    const currentInventory = context.currentInventory;
    const queueLength = context.queueLength;
    const stationId = eventData.stationId;
    
    // Calculate optimal dispatch quantity
    const criticalNeed = Math.max(8, this.thresholds.inventory.optimal - currentInventory);
    const queueBuffer = Math.ceil(queueLength * 1.5); // Buffer for queue
    const totalUnits = Math.min(criticalNeed + queueBuffer, 25); // Cap at truck capacity
    
    // Find nearest available fleet
    const fleetInfo = this.findNearestFleet(stationId, 'emergency');
    const dispatchCost = this.calculateAdvancedDispatchCost('emergency', fleetInfo);
    
    return {
      type: 'emergency',
      unitsToDispatch: totalUnits,
      totalCost: dispatchCost,
      expectedRevenue: totalUnits * 220, // Premium revenue for emergency
      eta: fleetInfo.eta,
      fleetVehicle: fleetInfo.vehicleId,
      priority: 'critical',
      route: fleetInfo.optimizedRoute,
      trackingId: `EMG_${Date.now()}`,
      approvalRequired: true,
      riskMitigation: {
        stockoutPrevention: 0.95,
        serviceContinuity: 0.98,
        customerSatisfaction: 0.9
      }
    };
  }

  createPredictiveDispatchPlan(eventData, context, mlPrediction) {
    const mlData = mlPrediction.prediction;
    const currentInventory = context.currentInventory;
    const stationId = eventData.stationId;
    
    // ML-driven quantity calculation
    const predictedDemand = mlData.demand_forecast || context.demandRate * 24;
    const safetyStock = Math.ceil(predictedDemand * 0.2); // 20% safety buffer
    const optimalQuantity = Math.max(
      predictedDemand + safetyStock - currentInventory,
      this.thresholds.inventory.optimal - currentInventory
    );
    
    // Time-based dispatch optimization
    const timeToStockout = mlData.predicted_stockout_time || 8; // hours
    const dispatchUrgency = timeToStockout < 4 ? 'high' : 'medium';
    
    const fleetInfo = this.findNearestFleet(stationId, dispatchUrgency);
    const dispatchCost = this.calculateAdvancedDispatchCost('predictive', fleetInfo);
    
    return {
      type: 'predictive',
      unitsToDispatch: Math.min(optimalQuantity, 20),
      totalCost: dispatchCost,
      expectedRevenue: optimalQuantity * 200,
      eta: fleetInfo.eta,
      fleetVehicle: fleetInfo.vehicleId,
      priority: dispatchUrgency,
      route: fleetInfo.optimizedRoute,
      trackingId: `PRD_${Date.now()}`,
      mlDriven: true,
      predictiveInsights: {
        stockoutProbability: mlData.stockout_probability,
        timeToStockout: timeToStockout,
        demandForecast: predictedDemand,
        confidenceScore: mlData.confidence_score
      },
      proactiveValue: {
        stockoutPrevention: 0.88,
        costSavings: dispatchCost * 0.3, // 30% savings vs emergency
        customerExperience: 0.95
      }
    };
  }

  createRegularDispatchPlan(eventData, context) {
    const currentInventory = context.currentInventory;
    const stationId = eventData.stationId;
    
    // Standard replenishment calculation
    const targetInventory = this.thresholds.inventory.optimal;
    const unitsNeeded = targetInventory - currentInventory;
    const bufferUnits = Math.ceil(context.queueLength * 0.5);
    const totalUnits = Math.min(unitsNeeded + bufferUnits, 18);
    
    const fleetInfo = this.findNearestFleet(stationId, 'regular');
    const dispatchCost = this.calculateAdvancedDispatchCost('regular', fleetInfo);
    
    return {
      type: 'regular',
      unitsToDispatch: totalUnits,
      totalCost: dispatchCost,
      expectedRevenue: totalUnits * 200,
      eta: fleetInfo.eta,
      fleetVehicle: fleetInfo.vehicleId,
      priority: 'medium',
      route: fleetInfo.optimizedRoute,
      trackingId: `REG_${Date.now()}`,
      schedulingWindow: '6-8 hours',
      costEfficiency: {
        costPerUnit: dispatchCost / totalUnits,
        routeOptimization: 0.85,
        fuelEfficiency: fleetInfo.fuelEfficiency
      }
    };
  }

  createOptimizationDispatchPlan(eventData, context, mlPrediction) {
    const mlData = mlPrediction.prediction;
    const currentInventory = context.currentInventory;
    const stationId = eventData.stationId;
    
    // Optimization-focused dispatch
    const optimizationOpportunity = mlData.optimization_opportunity;
    const efficiencyGain = optimizationOpportunity * 0.4; // Convert to efficiency percentage
    
    // Calculate optimal batch size for cost efficiency
    const optimalBatchSize = this.calculateOptimalBatchSize(stationId, context);
    const unitsToDispatch = Math.min(optimalBatchSize, 15);
    
    const fleetInfo = this.findNearestFleet(stationId, 'optimization');
    const dispatchCost = this.calculateAdvancedDispatchCost('optimization', fleetInfo);
    
    return {
      type: 'optimization',
      unitsToDispatch,
      totalCost: dispatchCost,
      expectedRevenue: unitsToDispatch * 200,
      eta: fleetInfo.eta,
      fleetVehicle: fleetInfo.vehicleId,
      priority: 'low',
      route: fleetInfo.optimizedRoute,
      trackingId: `OPT_${Date.now()}`,
      efficiencyGain,
      optimizationMetrics: {
        costReduction: dispatchCost * efficiencyGain,
        routeEfficiency: fleetInfo.routeEfficiency,
        batchOptimization: optimalBatchSize / 20, // Percentage of max capacity
        sustainabilityScore: fleetInfo.sustainabilityScore
      }
    };
  }

  findNearestFleet(stationId, urgency) {
    // Simulate fleet management system
    const fleetOptions = [
      {
        vehicleId: 'TRUCK_001',
        location: 'Depot_North',
        distance: 12,
        eta: urgency === 'emergency' ? '2-3 hours' : '4-6 hours',
        capacity: 25,
        fuelEfficiency: 0.8,
        routeEfficiency: 0.85,
        sustainabilityScore: 0.7
      },
      {
        vehicleId: 'TRUCK_002',
        location: 'Depot_South',
        distance: 8,
        eta: urgency === 'emergency' ? '1.5-2.5 hours' : '3-5 hours',
        capacity: 20,
        fuelEfficiency: 0.85,
        routeEfficiency: 0.9,
        sustainabilityScore: 0.8
      },
      {
        vehicleId: 'VAN_003',
        location: 'Mobile_Hub',
        distance: 5,
        eta: urgency === 'emergency' ? '1-2 hours' : '2-4 hours',
        capacity: 15,
        fuelEfficiency: 0.9,
        routeEfficiency: 0.95,
        sustainabilityScore: 0.85
      }
    ];
    
    // Select best option based on urgency and efficiency
    const scoredOptions = fleetOptions.map(option => ({
      ...option,
      score: this.calculateFleetScore(option, urgency)
    }));
    
    const bestOption = scoredOptions.sort((a, b) => b.score - a.score)[0];
    
    return {
      ...bestOption,
      optimizedRoute: this.generateOptimizedRoute(bestOption.location, stationId)
    };
  }

  calculateFleetScore(fleetOption, urgency) {
    let score = 0;
    
    // Distance score (closer is better)
    score += Math.max(0, 20 - fleetOption.distance);
    
    // Capacity score
    score += fleetOption.capacity * 0.5;
    
    // Efficiency scores
    score += fleetOption.fuelEfficiency * 10;
    score += fleetOption.routeEfficiency * 10;
    score += fleetOption.sustainabilityScore * 5;
    
    // Urgency adjustments
    if (urgency === 'emergency') {
      score += (20 - fleetOption.distance) * 2; // Double weight on distance for emergency
    } else if (urgency === 'optimization') {
      score += fleetOption.sustainabilityScore * 10; // Higher weight on sustainability
    }
    
    return score;
  }

  generateOptimizedRoute(fromLocation, toStationId) {
    // Simulate route optimization
    return {
      from: fromLocation,
      to: toStationId,
      waypoints: [],
      estimatedDistance: Math.floor(Math.random() * 20) + 5,
      estimatedTime: Math.floor(Math.random() * 120) + 60, // 60-180 minutes
      trafficOptimized: true,
      fuelOptimized: true
    };
  }

  calculateOptimalBatchSize(stationId, context) {
    const currentInventory = context.currentInventory;
    const demandRate = context.demandRate;
    const queueLength = context.queueLength;
    
    // Economic Order Quantity (EOQ) inspired calculation
    const dailyDemand = demandRate * 24;
    const holdingCost = 2; // Cost per unit per day
    const orderingCost = 500; // Fixed cost per dispatch
    
    const eoq = Math.sqrt((2 * dailyDemand * orderingCost) / holdingCost);
    const adjustedEOQ = Math.max(eoq, this.thresholds.inventory.optimal - currentInventory);
    
    return Math.ceil(adjustedEOQ);
  }

  calculateAdvancedDispatchCost(dispatchType, fleetInfo) {
    let baseCost = 400;
    
    // Type-based cost multipliers
    const typeMultipliers = {
      'emergency': 3.0,
      'predictive': 1.3,
      'regular': 1.5,
      'optimization': 1.1
    };
    
    baseCost *= typeMultipliers[dispatchType] || 1.5;
    
    // Distance-based cost
    const distanceCost = fleetInfo.distance * 15; // ₹15 per km
    
    // Efficiency adjustments
    const efficiencyDiscount = (fleetInfo.fuelEfficiency + fleetInfo.routeEfficiency) * 0.1 * baseCost;
    
    const totalCost = baseCost + distanceCost - efficiencyDiscount;
    
    return Math.floor(totalCost);
  }

  determineDispatchStrategy(currentInventory, urgencyLevel, mlPrediction) {
    if (urgencyLevel === 'critical') {
      return 'emergency_response';
    } else if (mlPrediction?.success && mlPrediction.prediction.stockout_probability > 0.7) {
      return 'predictive_prevention';
    } else if (currentInventory <= this.thresholds.inventory.warning) {
      return 'regular_replenishment';
    } else if (mlPrediction?.success && mlPrediction.prediction.optimization_opportunity > 0.6) {
      return 'efficiency_optimization';
    } else {
      return 'monitoring_mode';
    }
  }

  calculateUrgency(currentInventory, queueLength, inventoryRate) {
    let urgencyScore = 0;
    
    // Inventory level urgency
    if (currentInventory <= this.thresholds.inventory.critical) urgencyScore += 3;
    else if (currentInventory <= this.thresholds.inventory.warning) urgencyScore += 1;
    
    // Queue pressure urgency
    if (queueLength > 10) urgencyScore += 2;
    else if (queueLength > 5) urgencyScore += 1;
    
    // Depletion rate urgency
    if (inventoryRate < -1) urgencyScore += 2;
    else if (inventoryRate < -0.5) urgencyScore += 1;
    
    if (urgencyScore >= 4) return 'critical';
    if (urgencyScore >= 2) return 'high';
    if (urgencyScore >= 1) return 'medium';
    return 'low';
  }

  calculateDispatchCost(dispatchType, stationId) {
    let baseCost = 500; // Base dispatch cost
    
    switch (dispatchType) {
      case 'emergency':
        baseCost *= 3; // Emergency dispatch is 3x more expensive
        break;
      case 'regular':
        baseCost *= 1.5; // Regular dispatch has moderate premium
        break;
      case 'predictive':
        baseCost *= 1.2; // Predictive has slight premium for planning
        break;
    }
    
    // Add distance-based cost (simplified)
    const stationNumber = parseInt(stationId.replace('ST', ''));
    const distanceFactor = 1 + (stationNumber % 5) * 0.1; // 10-50% distance premium
    
    return Math.floor(baseCost * distanceFactor);
  }

  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const logisticsAgent = new LogisticsAgent();

export default logisticsAgent;