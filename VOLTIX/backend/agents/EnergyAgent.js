import BaseAgent from './BaseAgent.js';
import mlService from '../services/mlService.js';

class EnergyAgent extends BaseAgent {
  constructor() {
    super('EnergyAgent');
    
    // Energy-specific configuration
    this.config = {
      ...this.config,
      requiresSupervisorApproval: false, // Can trade autonomously within limits
      escalationThreshold: 0.6,
      confidenceThreshold: 0.8,
      maxTradeAmount: 10000, // Maximum trade value in rupees
      profitThreshold: 0.05 // Minimum 5% profit margin
    };
    
    // Energy market thresholds
    this.thresholds = {
      price: {
        low: 3.0,      // ₹3/kWh - good buying opportunity
        high: 12.0,    // ₹12/kWh - good selling opportunity
        critical: 15.0 // ₹15/kWh - emergency pricing
      },
      demand: {
        low: 0.3,      // 30% capacity utilization
        high: 0.8,     // 80% capacity utilization
        peak: 0.95     // 95% capacity utilization
      },
      storage: {
        low: 20,       // 20% battery storage
        optimal: 80,   // 80% battery storage
        full: 95       // 95% battery storage
      },
      gridStability: {
        frequency: { min: 49.5, max: 50.5 },
        voltage: { min: 380, max: 420 }
      }
    };
  }

  // DETECT: Check for energy trading opportunities or grid issues
  async detect(eventData) {
    try {
      const data = eventData.data;
      const opportunities = [];
      
      // Check energy price opportunities
      const currentPrice = data.currentEnergyPrice || data.gridData?.price || 8;
      
      if (currentPrice <= this.thresholds.price.low) {
        opportunities.push(`Low energy price: ₹${currentPrice}/kWh - buying opportunity`);
      } else if (currentPrice >= this.thresholds.price.high) {
        opportunities.push(`High energy price: ₹${currentPrice}/kWh - selling opportunity`);
      }
      
      // Check demand patterns
      const demandLevel = data.demandLevel || this.calculateDemandLevel(data);
      if (demandLevel >= this.thresholds.demand.peak) {
        opportunities.push(`Peak demand: ${(demandLevel * 100).toFixed(1)}% - price surge expected`);
      } else if (demandLevel <= this.thresholds.demand.low) {
        opportunities.push(`Low demand: ${(demandLevel * 100).toFixed(1)}% - excess capacity available`);
      }
      
      // Check storage levels
      const storageLevel = data.batteryLevel || data.storageLevel || 0.5;
      if (storageLevel <= this.thresholds.storage.low / 100) {
        opportunities.push(`Low storage: ${(storageLevel * 100).toFixed(1)}% - charging needed`);
      } else if (storageLevel >= this.thresholds.storage.full / 100) {
        opportunities.push(`High storage: ${(storageLevel * 100).toFixed(1)}% - selling opportunity`);
      }
      
      // Check grid stability
      if (data.gridData) {
        const grid = data.gridData;
        if (grid.frequency < this.thresholds.gridStability.frequency.min || 
            grid.frequency > this.thresholds.gridStability.frequency.max) {
          opportunities.push(`Grid frequency instability: ${grid.frequency}Hz`);
        }
        
        if (grid.voltage < this.thresholds.gridStability.voltage.min || 
            grid.voltage > this.thresholds.gridStability.voltage.max) {
          opportunities.push(`Grid voltage instability: ${grid.voltage}V`);
        }
      }
      
      // Check renewable generation
      if (data.renewableGeneration) {
        const renewable = data.renewableGeneration;
        if (renewable.solar > renewable.capacity * 0.8) {
          opportunities.push(`High solar generation: ${renewable.solar}kW - excess available`);
        }
        if (renewable.wind > renewable.capacity * 0.7) {
          opportunities.push(`High wind generation: ${renewable.wind}kW - excess available`);
        }
      }
      
      if (opportunities.length > 0) {
        return {
          shouldProcess: true,
          reason: `Energy opportunities detected: ${opportunities.join(', ')}`,
          context: {
            opportunities,
            currentPrice,
            demandLevel,
            storageLevel,
            gridStability: this.assessGridStability(data.gridData),
            marketConditions: this.assessMarketConditions(data)
          }
        };
      }
      
      return {
        shouldProcess: false,
        reason: 'No significant energy opportunities detected'
      };
      
    } catch (error) {
      console.error(`[EnergyAgent] Detection error:`, error);
      return {
        shouldProcess: false,
        reason: `Detection failed: ${error.message}`
      };
    }
  }

  // DECIDE: Determine energy trading strategy
  async decide(eventData, context) {
    try {
      const currentPrice = context.currentPrice;
      const demandLevel = context.demandLevel;
      const storageLevel = context.storageLevel;
      const opportunities = context.opportunities;
      
      // Use ML service for energy price prediction
      let mlPrediction = null;
      try {
        mlPrediction = await mlService.predictEnergyPrice(eventData.stationId, {
          currentPrice,
          demandLevel,
          storageLevel,
          timeOfDay: new Date().getHours(),
          dayOfWeek: new Date().getDay(),
          gridData: eventData.data.gridData,
          renewableGeneration: eventData.data.renewableGeneration
        });
      } catch (mlError) {
        console.warn(`[EnergyAgent] ML prediction failed:`, mlError.message);
      }
      
      let action = 'monitor';
      let confidence = 0.7;
      let riskScore = 0.3;
      let impact = {
        costImpact: 0,
        revenueImpact: 0,
        successRate: 0.8,
        userSatisfaction: 0.8,
        riskScore: 0.3
      };
      
      // Low price + low storage = BUY opportunity
      if (currentPrice <= this.thresholds.price.low && storageLevel < 0.6) {
        action = 'buy_energy';
        confidence = 0.85;
        riskScore = 0.2;
        
        const buyAmount = this.calculateOptimalBuyAmount(currentPrice, storageLevel, demandLevel);
        
        impact = {
          costImpact: -buyAmount * currentPrice,
          revenueImpact: buyAmount * (currentPrice * 1.3), // Expected 30% profit
          successRate: 0.9,
          userSatisfaction: 0.85,
          riskScore: 0.2,
          energyAmount: buyAmount,
          expectedProfit: buyAmount * currentPrice * 0.3
        };
      }
      // High price + high storage = SELL opportunity
      else if (currentPrice >= this.thresholds.price.high && storageLevel > 0.7) {
        action = 'sell_energy';
        confidence = 0.8;
        riskScore = 0.3;
        
        const sellAmount = this.calculateOptimalSellAmount(currentPrice, storageLevel, demandLevel);
        
        impact = {
          costImpact: 0,
          revenueImpact: sellAmount * currentPrice,
          successRate: 0.85,
          userSatisfaction: 0.9,
          riskScore: 0.3,
          energyAmount: sellAmount,
          expectedProfit: sellAmount * (currentPrice - 6) // Assume ₹6 base cost
        };
      }
      // Peak demand = Dynamic pricing
      else if (demandLevel >= this.thresholds.demand.peak) {
        action = 'implement_surge_pricing';
        confidence = 0.75;
        riskScore = 0.4;
        
        const surgeMultiplier = 1.5; // 50% surge
        
        impact = {
          costImpact: 0,
          revenueImpact: 500, // Estimated additional revenue
          successRate: 0.7,
          userSatisfaction: 0.6, // Users don't like surge pricing
          riskScore: 0.4,
          surgeMultiplier,
          expectedDemandReduction: 0.2
        };
      }
      // Grid instability = Stabilization support
      else if (context.gridStability === 'unstable') {
        action = 'provide_grid_support';
        confidence = 0.8;
        riskScore = 0.5;
        
        impact = {
          costImpact: -200, // Cost of providing support
          revenueImpact: 800, // Grid support payments
          successRate: 0.9,
          userSatisfaction: 0.95, // Users appreciate stable power
          riskScore: 0.5,
          gridSupportType: 'frequency_regulation'
        };
      }
      // Excess renewable = Store or sell
      else if (opportunities.some(op => op.includes('excess'))) {
        action = 'optimize_renewable';
        confidence = 0.75;
        riskScore = 0.25;
        
        impact = {
          costImpact: -100,
          revenueImpact: 400,
          successRate: 0.85,
          userSatisfaction: 0.9,
          riskScore: 0.25,
          renewableUtilization: 0.95
        };
      }
      
      // Incorporate ML prediction
      if (mlPrediction?.success) {
        const mlData = mlPrediction.prediction;
        confidence = Math.min(confidence + 0.1, 0.95);
        
        // Adjust strategy based on price prediction
        if (mlData.predicted_price > currentPrice * 1.2 && action === 'monitor') {
          action = 'buy_energy';
          riskScore = 0.3;
        } else if (mlData.predicted_price < currentPrice * 0.8 && action === 'monitor') {
          action = 'sell_energy';
          riskScore = 0.3;
        }
      }
      
      return {
        success: true,
        action,
        confidence,
        riskScore,
        impact,
        reasoning: `Price: ₹${currentPrice}, Demand: ${(demandLevel * 100).toFixed(1)}%, Storage: ${(storageLevel * 100).toFixed(1)}%`,
        mlPrediction: mlPrediction?.prediction,
        priority: currentPrice >= this.thresholds.price.critical ? 'urgent' : 'medium',
        marketConditions: context.marketConditions
      };
      
    } catch (error) {
      console.error(`[EnergyAgent] Decision error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ACT: Execute advanced energy trading and grid optimization
  async act(decision, eventData) {
    try {
      const stationId = eventData.stationId;
      const action = decision.action;
      const autonomyLevel = decision.autonomyLevel;
      
      console.log(`[EnergyAgent] Executing ${action} on ${stationId} (Autonomy Level: ${autonomyLevel})`);
      
      let result = {
        success: true,
        message: '',
        stationId,
        responseTime: 0,
        accuracy: 1.0,
        autonomyLevel
      };
      
      const startTime = Date.now();
      
      switch (action) {
        case 'buy_energy':
          // Advanced energy purchase with market timing
          await this.simulateDelay(3000);
          result = await this.executeEnergyPurchase(decision, eventData);
          break;
          
        case 'sell_energy':
          // Energy arbitrage and grid-to-vehicle sales
          await this.simulateDelay(2500);
          result = await this.executeEnergySale(decision, eventData);
          break;
          
        case 'implement_surge_pricing':
          // Dynamic pricing with demand elasticity
          await this.simulateDelay(1000);
          result = await this.executeSurgePricing(decision, eventData);
          break;
          
        case 'provide_grid_support':
          // Grid stabilization services
          await this.simulateDelay(4000);
          result = await this.executeGridSupport(decision, eventData);
          break;
          
        case 'optimize_renewable':
          // Renewable energy optimization
          await this.simulateDelay(2000);
          result = await this.executeRenewableOptimization(decision, eventData);
          break;
          
        default:
          result.message = `Monitoring energy market for ${stationId} - no action required`;
          result.impact = { monitoringActive: true };
      }
      
      result.responseTime = Date.now() - startTime;
      
      return result;
      
    } catch (error) {
      console.error(`[EnergyAgent] Action error:`, error);
      return {
        success: false,
        error: error.message,
        stationId: eventData.stationId
      };
    }
  }

  // Advanced energy trading execution methods
  async executeEnergyPurchase(decision, eventData) {
    const buyAmount = decision.impact.energyAmount || 100;
    const marketPrice = decision.impact.costImpact ? Math.abs(decision.impact.costImpact) / buyAmount : 8;
    
    // Simulate market order execution
    const marketOrder = {
      type: 'BUY',
      amount: buyAmount,
      price: marketPrice,
      timestamp: new Date().toISOString(),
      stationId: eventData.stationId
    };
    
    // Calculate slippage and execution details
    const slippage = Math.random() * 0.05; // 0-5% slippage
    const actualPrice = marketPrice * (1 + slippage);
    const totalCost = buyAmount * actualPrice;
    
    return {
      success: true,
      message: `Energy purchase executed: ${buyAmount}kWh at ₹${actualPrice.toFixed(2)}/kWh`,
      impact: {
        energyPurchased: buyAmount,
        totalCost: Math.ceil(totalCost),
        marketPrice: actualPrice,
        slippage: (slippage * 100).toFixed(2) + '%',
        storageIncrease: buyAmount * 0.95, // 95% efficiency
        transactionId: `BUY_${Date.now()}`,
        marketTiming: 'optimal',
        arbitrageOpportunity: this.calculateArbitrageOpportunity(actualPrice),
        gridImpact: {
          demandIncrease: buyAmount,
          gridStabilityContribution: 0.1
        }
      }
    };
  }

  async executeEnergySale(decision, eventData) {
    const sellAmount = decision.impact.energyAmount || 80;
    const marketPrice = decision.impact.revenueImpact ? decision.impact.revenueImpact / sellAmount : 12;
    
    // Simulate energy sale with grid-to-vehicle capability
    const saleOrder = {
      type: 'SELL',
      amount: sellAmount,
      price: marketPrice,
      timestamp: new Date().toISOString(),
      stationId: eventData.stationId
    };
    
    // Calculate premium for grid services
    const gridServicePremium = 0.15; // 15% premium for grid services
    const actualPrice = marketPrice * (1 + gridServicePremium);
    const totalRevenue = sellAmount * actualPrice;
    
    return {
      success: true,
      message: `Energy sale executed: ${sellAmount}kWh at ₹${actualPrice.toFixed(2)}/kWh (includes grid service premium)`,
      impact: {
        energySold: sellAmount,
        totalRevenue: Math.ceil(totalRevenue),
        marketPrice: actualPrice,
        gridServicePremium: (gridServicePremium * 100).toFixed(0) + '%',
        storageDecrease: sellAmount,
        transactionId: `SELL_${Date.now()}`,
        profitMargin: this.calculateProfitMargin(actualPrice),
        gridImpact: {
          supplyIncrease: sellAmount,
          gridStabilityContribution: 0.2,
          carbonOffset: sellAmount * 0.5 // kg CO2
        },
        vehicleToGrid: {
          enabled: true,
          participatingVehicles: Math.floor(sellAmount / 10),
          incentivesPaid: sellAmount * 2 // ₹2 per kWh to vehicle owners
        }
      }
    };
  }

  async executeSurgePricing(decision, eventData) {
    const surgeMultiplier = decision.impact.surgeMultiplier || 1.5;
    const demandReduction = decision.impact.expectedDemandReduction || 0.2;
    
    // Implement dynamic pricing with demand elasticity
    const pricingStrategy = {
      basePrice: 8,
      surgeMultiplier,
      newPrice: 8 * surgeMultiplier,
      elasticity: -0.5, // Demand elasticity coefficient
      expectedDemandChange: demandReduction
    };
    
    return {
      success: true,
      message: `Surge pricing activated: ${((surgeMultiplier - 1) * 100).toFixed(0)}% increase with demand elasticity modeling`,
      impact: {
        surgeMultiplier,
        priceIncrease: ((surgeMultiplier - 1) * 100).toFixed(0) + '%',
        newPrice: pricingStrategy.newPrice,
        expectedDemandReduction: (demandReduction * 100).toFixed(0) + '%',
        duration: '2 hours',
        affectedUsers: 'all_current_queue',
        pricingStrategy: 'demand_elasticity_based',
        revenueOptimization: {
          expectedRevenue: pricingStrategy.newPrice * 50, // Estimated 50 kWh demand
          demandElasticity: pricingStrategy.elasticity,
          priceOptimization: 'dynamic'
        },
        userNotifications: {
          sent: true,
          message: `Peak demand pricing active. Consider charging later for lower rates.`,
          alternativesOffered: true
        }
      }
    };
  }

  async executeGridSupport(decision, eventData) {
    const supportType = decision.impact.gridSupportType || 'frequency_regulation';
    const supportDuration = '1 hour';
    
    // Grid support service execution
    const gridService = {
      type: supportType,
      capacity: 100, // kW
      duration: supportDuration,
      compensation: 800, // ₹800 per hour
      stabilityImprovement: 0.15
    };
    
    return {
      success: true,
      message: `Grid support service activated: ${supportType} for ${supportDuration}`,
      impact: {
        supportType,
        supportDuration,
        capacityProvided: gridService.capacity,
        gridPayment: gridService.compensation,
        stabilityImprovement: gridService.stabilityImprovement,
        contractId: `GRID_${Date.now()}`,
        gridServices: {
          frequencyRegulation: supportType === 'frequency_regulation',
          voltageSupport: supportType === 'voltage_support',
          loadBalancing: supportType === 'load_balancing',
          blackStartCapability: false
        },
        environmentalImpact: {
          gridStabilityContribution: 0.15,
          renewableIntegrationSupport: 0.1,
          carbonFootprintReduction: 25 // kg CO2
        },
        economicImpact: {
          gridServiceRevenue: gridService.compensation,
          costOfService: 200,
          netProfit: gridService.compensation - 200
        }
      }
    };
  }

  async executeRenewableOptimization(decision, eventData) {
    const utilization = decision.impact.renewableUtilization || 0.9;
    
    // Renewable energy optimization execution
    const optimization = {
      solarUtilization: utilization,
      windUtilization: utilization * 0.8,
      excessStored: 50,
      excessSold: 30,
      carbonOffset: 25
    };
    
    return {
      success: true,
      message: `Renewable optimization executed: ${(utilization * 100).toFixed(1)}% utilization achieved`,
      impact: {
        renewableUtilization: utilization,
        solarOptimization: {
          utilization: optimization.solarUtilization,
          excessStored: optimization.excessStored,
          excessSold: optimization.excessSold
        },
        windOptimization: {
          utilization: optimization.windUtilization,
          contribution: 0.3
        },
        storageOptimization: {
          batteryEfficiency: 0.95,
          chargingStrategy: 'renewable_priority',
          dischargingStrategy: 'peak_shaving'
        },
        environmentalImpact: {
          carbonOffset: optimization.carbonOffset,
          renewablePercentage: (utilization * 100).toFixed(1) + '%',
          sustainabilityScore: 0.95,
          greenEnergyCredits: Math.floor(optimization.excessSold / 10)
        },
        economicImpact: {
          costSavings: 300,
          renewableIncentives: 150,
          carbonCreditValue: 75
        }
      }
    };
  }

  // Helper methods for energy trading
  calculateArbitrageOpportunity(currentPrice) {
    const averagePrice = 8;
    const opportunity = (currentPrice - averagePrice) / averagePrice;
    
    return {
      percentage: (opportunity * 100).toFixed(2) + '%',
      profitable: opportunity < -0.1, // Profitable if 10% below average
      potentialSavings: Math.max(0, (averagePrice - currentPrice) * 100)
    };
  }

  calculateProfitMargin(sellPrice) {
    const averageCost = 6; // Average cost of energy
    const margin = (sellPrice - averageCost) / sellPrice;
    
    return {
      percentage: (margin * 100).toFixed(2) + '%',
      profitPerKWh: sellPrice - averageCost,
      breakEvenPrice: averageCost
    };
  }

  // VERIFY: Check if energy action was successful
  async verify(actionResult, eventData) {
    try {
      // In a real system, this would check actual energy transactions and grid data
      // For now, we'll simulate verification based on action type
      
      const action = actionResult.message;
      let success = true;
      let reason = 'Energy action completed successfully';
      let effectivenessScore = 0.85;
      
      // Simulate different success rates for different actions
      if (action.includes('purchase')) {
        // Energy purchases usually succeed but may have price slippage
        effectivenessScore = Math.random() * 0.2 + 0.8; // 80-100%
        reason = `Energy purchase completed with ${(effectivenessScore * 100).toFixed(1)}% efficiency`;
      } else if (action.includes('sale')) {
        // Energy sales may have variable success based on market conditions
        effectivenessScore = Math.random() * 0.3 + 0.7; // 70-100%
        reason = `Energy sale completed - market acceptance: ${(effectivenessScore * 100).toFixed(1)}%`;
      } else if (action.includes('surge pricing')) {
        // Surge pricing effectiveness depends on user acceptance
        effectivenessScore = Math.random() * 0.4 + 0.5; // 50-90%
        reason = `Surge pricing implemented - user acceptance: ${(effectivenessScore * 100).toFixed(1)}%`;
      } else if (action.includes('grid support')) {
        // Grid support usually has high success rate
        effectivenessScore = Math.random() * 0.1 + 0.9; // 90-100%
        reason = `Grid support provided successfully - stability improved`;
      }
      
      // Small chance of failure for any action
      if (Math.random() < 0.03) {
        success = false;
        reason = 'Energy action failed - market conditions changed';
        effectivenessScore = 0.1;
      }
      
      return {
        success,
        reason,
        metrics: {
          responseTime: actionResult.responseTime,
          accuracy: success ? 1.0 : 0.0,
          effectivenessScore,
          marketEfficiency: effectivenessScore
        }
      };
      
    } catch (error) {
      console.error(`[EnergyAgent] Verification error:`, error);
      return {
        success: false,
        reason: `Verification failed: ${error.message}`
      };
    }
  }

  // Helper methods
  calculateDemandLevel(data) {
    // Calculate demand based on queue length, active sessions, etc.
    const queueLength = data.queueLength || 0;
    const capacity = data.capacity || 10;
    const activeUsers = data.activeUsers || 0;
    
    return Math.min((queueLength + activeUsers) / capacity, 1.0);
  }

  assessGridStability(gridData) {
    if (!gridData) return 'unknown';
    
    const freqStable = gridData.frequency >= this.thresholds.gridStability.frequency.min && 
                      gridData.frequency <= this.thresholds.gridStability.frequency.max;
    const voltStable = gridData.voltage >= this.thresholds.gridStability.voltage.min && 
                      gridData.voltage <= this.thresholds.gridStability.voltage.max;
    
    if (freqStable && voltStable) return 'stable';
    if (!freqStable || !voltStable) return 'unstable';
    return 'critical';
  }

  assessMarketConditions(data) {
    const price = data.currentEnergyPrice || 8;
    const demand = this.calculateDemandLevel(data);
    
    if (price <= this.thresholds.price.low && demand <= this.thresholds.demand.low) {
      return 'buyer_market';
    } else if (price >= this.thresholds.price.high && demand >= this.thresholds.demand.high) {
      return 'seller_market';
    } else if (demand >= this.thresholds.demand.peak) {
      return 'peak_demand';
    } else {
      return 'balanced';
    }
  }

  calculateOptimalBuyAmount(price, storageLevel, demandLevel) {
    // Calculate optimal energy purchase amount
    const maxBudget = this.config.maxTradeAmount;
    const maxAmount = maxBudget / price;
    const storageCapacity = (1 - storageLevel) * 200; // Assume 200kWh max storage
    const demandFactor = Math.max(demandLevel, 0.3); // At least 30% of capacity
    
    return Math.min(maxAmount, storageCapacity * demandFactor);
  }

  calculateOptimalSellAmount(price, storageLevel, demandLevel) {
    // Calculate optimal energy sale amount
    const availableEnergy = storageLevel * 200; // Assume 200kWh max storage
    const reserveEnergy = 40; // Keep 40kWh reserve
    const sellableEnergy = Math.max(0, availableEnergy - reserveEnergy);
    const demandFactor = Math.min(demandLevel * 1.5, 1.0); // Sell more during high demand
    
    return sellableEnergy * demandFactor;
  }

  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const energyAgent = new EnergyAgent();

export default energyAgent;