import BaseAgent from "./BaseAgent.js";
import mlService from "../services/mlService.js";

class TrafficAgent extends BaseAgent {
  constructor() {
    super("TrafficAgent");

    // Traffic-specific configuration
    this.config = {
      ...this.config,
      requiresSupervisorApproval: false, // Can offer incentives autonomously
      escalationThreshold: 0.6,
      confidenceThreshold: 0.75,
      maxIncentiveAmount: 100, // Maximum discount in rupees
    };

    // Traffic thresholds
    this.thresholds = {
      queueLength: { warning: 5, critical: 10 },
      waitTime: { warning: 10, critical: 20 }, // minutes
      utilizationRate: { low: 0.3, high: 0.8 },
      peakHours: ["08:00-10:00", "17:00-20:00"],
    };
  }

  // DETECT: Check for traffic congestion or demand imbalance
  async detect(eventData) {
    try {
      const data = eventData.data;
      const issues = [];

      // Check queue length
      if (data.queueLength >= this.thresholds.queueLength.warning) {
        issues.push(`High queue: ${data.queueLength} vehicles`);
      }

      // Check wait time
      if (data.avgWaitTime >= this.thresholds.waitTime.warning) {
        issues.push(`Long wait time: ${data.avgWaitTime} minutes`);
      }

      // Check utilization rate
      const utilizationRate = data.availableSlots
        ? (data.capacity - data.availableSlots) / data.capacity
        : 0.5;

      if (utilizationRate > this.thresholds.utilizationRate.high) {
        issues.push(`High utilization: ${(utilizationRate * 100).toFixed(1)}%`);
      } else if (utilizationRate < this.thresholds.utilizationRate.low) {
        issues.push(`Low utilization: ${(utilizationRate * 100).toFixed(1)}%`);
      }

      // Check for user events (queue joins)
      if (
        eventData.type === "user_event" &&
        eventData.data.type === "queue_join"
      ) {
        issues.push("New user joined queue");
      }

      if (issues.length > 0) {
        return {
          shouldProcess: true,
          reason: `Traffic issues detected: ${issues.join(", ")}`,
          context: {
            issues,
            queueLength: data.queueLength || 0,
            waitTime: data.avgWaitTime || 0,
            utilizationRate,
            isPeakHour: this.isPeakHour(),
            nearbyStations: await this.findNearbyStations(eventData.stationId),
          },
        };
      }

      return {
        shouldProcess: false,
        reason: "No traffic issues detected",
      };
    } catch (error) {
      console.error(`[TrafficAgent] Detection error:`, error);
      return {
        shouldProcess: false,
        reason: `Detection failed: ${error.message}`,
      };
    }
  }

  // DECIDE: Advanced algorithmic incentive calculation
  async decide(eventData, context) {
    try {
      const data = eventData.data;
      const queueLength = context.queueLength;
      const waitTime = context.waitTime;
      const utilizationRate = context.utilizationRate;

      // Use simple predictors for traffic demand
      let prediction = null;
      try {
        // Collect recent queue history (simulate with current data)
        const queueHistory = this.getQueueHistory(
          eventData.stationId,
          queueLength,
        );
        prediction = await import("../services/simplePredictors.js").then(
          (module) => module.default.predictQueue(queueHistory),
        );
        console.log(
          `[TrafficAgent] Queue prediction: ${prediction.predicted} (confidence: ${prediction.confidence})`,
        );
      } catch (predictionError) {
        console.warn(
          `[TrafficAgent] Simple prediction failed:`,
          predictionError.message,
        );
      }

      let action = "monitor";
      let confidence = 0.7;
      let riskScore = 0.2;
      let autonomyLevel = 5; // Full automation for incentives
      let impact = {
        costImpact: 0,
        revenueImpact: 0,
        successRate: 0.8,
        userSatisfaction: 0.8,
        riskScore: 0.2,
      };

      // Advanced incentive calculation using algorithmic pricing
      if (
        queueLength >= this.thresholds.queueLength.critical ||
        waitTime >= this.thresholds.waitTime.critical
      ) {
        action = "execute_dynamic_incentive_engine";
        confidence = 0.9;
        riskScore = 0.3;
        autonomyLevel = 5;

        // Calculate exact incentive needed using the formula:
        // Incentive = (Time_Saved × Value_Time) + (Distance_Extra × Cost_Km)
        const incentiveAmount = this.calculateAlgorithmicIncentive(
          queueLength,
          waitTime,
          context.nearbyStations,
          data.userProfile,
        );

        impact = {
          costImpact: -incentiveAmount.totalCost,
          revenueImpact: incentiveAmount.expectedRevenue,
          successRate: incentiveAmount.acceptanceProbability,
          userSatisfaction: 0.9,
          riskScore: 0.3,
          incentiveDetails: incentiveAmount,
          targetUsers: this.identifyTargetUsers(eventData, context),
          expectedRedirects: Math.floor(
            queueLength * incentiveAmount.acceptanceProbability,
          ),
        };
      }
      // Medium congestion - surge pricing
      else if (queueLength >= this.thresholds.queueLength.warning) {
        action = "implement_surge_pricing";
        confidence = 0.85;
        riskScore = 0.25;
        autonomyLevel = 5;

        const surgeMultiplier = this.calculateSurgeMultiplier(
          utilizationRate,
          context.isPeakHour,
        );

        impact = {
          costImpact: 0,
          revenueImpact: this.estimateSurgeRevenue(
            queueLength,
            surgeMultiplier,
          ),
          successRate: 0.75,
          userSatisfaction: 0.65, // Users don't love surge pricing
          riskScore: 0.25,
          surgeMultiplier,
          expectedDemandReduction:
            this.calculateDemandReduction(surgeMultiplier),
        };
      }
      // Low utilization - attraction incentives
      else if (utilizationRate < this.thresholds.utilizationRate.low) {
        action = "deploy_attraction_incentives";
        confidence = 0.8;
        riskScore = 0.2;
        autonomyLevel = 5;

        const attractionIncentive = this.calculateAttractionIncentive(
          utilizationRate,
          context.isPeakHour,
        );

        impact = {
          costImpact: -attractionIncentive.cost,
          revenueImpact: attractionIncentive.expectedRevenue,
          successRate: 0.85,
          userSatisfaction: 0.9,
          riskScore: 0.2,
          incentiveAmount: attractionIncentive.amount,
          targetRadius: attractionIncentive.radius,
          expectedNewUsers: attractionIncentive.expectedUsers,
        };
      }

      // Incorporate simple prediction to enhance decision
      if (prediction?.predicted) {
        const predictedQueue = prediction.predicted;
        confidence = Math.min(confidence + 0.1, 0.95);

        if (predictedQueue > this.thresholds.queueLength.critical) {
          action = "preemptive_demand_shaping";
          riskScore = 0.4;
          autonomyLevel = 5;

          impact.preemptiveAction = {
            predictedQueue,
            currentQueue: queueLength,
            confidence: prediction.confidence,
            proactiveIncentives: this.calculatePreemptiveIncentives({
              predicted_demand: predictedQueue,
            }),
          };
        }

        // Add prediction insights to impact
        impact.predictionInsights = {
          predictedQueue,
          confidence: prediction.confidence,
          trend: prediction.trend,
          dataPoints: prediction.dataPoints,
        };
      }

      return {
        success: true,
        action,
        confidence,
        riskScore,
        autonomyLevel,
        impact,
        reasoning: `Queue: ${queueLength}, Wait: ${waitTime}min, Utilization: ${(
          utilizationRate * 100
        ).toFixed(1)}%`,
        mlPrediction: prediction,
        priority:
          queueLength >= this.thresholds.queueLength.critical
            ? "high"
            : "medium",
        targetUsers: this.identifyTargetUsers(eventData, context),
        incentiveStrategy: this.determineIncentiveStrategy(
          queueLength,
          utilizationRate,
          context.isPeakHour,
        ),
      };
    } catch (error) {
      console.error(`[TrafficAgent] Decision error:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ACT: Execute advanced traffic management with algorithmic incentives
  async act(decision, eventData) {
    try {
      const stationId = eventData.stationId;
      const action = decision.action;
      const autonomyLevel = decision.autonomyLevel;

      console.log(
        `[TrafficAgent] Executing ${action} on ${stationId} (Autonomy Level: ${autonomyLevel})`,
      );

      let result = {
        success: true,
        message: "",
        stationId,
        responseTime: 0,
        accuracy: 1.0,
        autonomyLevel,
      };

      const startTime = Date.now();

      switch (action) {
        case "execute_dynamic_incentive_engine":
          // Advanced algorithmic incentive system
          await this.simulateDelay(2000);
          result = await this.executeIncentiveEngine(decision, eventData);
          break;

        case "implement_surge_pricing":
          // Dynamic surge pricing implementation
          await this.simulateDelay(1000);
          result = await this.executeSurgePricing(decision, eventData);
          break;

        case "deploy_attraction_incentives":
          // Attraction incentive deployment
          await this.simulateDelay(1500);
          result = await this.executeAttractionIncentives(decision, eventData);
          break;

        case "preemptive_demand_shaping":
          // Proactive demand management
          await this.simulateDelay(3000);
          result = await this.executePreemptiveDemandShaping(
            decision,
            eventData,
          );
          break;

        default:
          result.message = `Monitoring traffic at ${stationId} - no action required`;
          result.impact = { monitoringActive: true };
      }

      result.responseTime = Date.now() - startTime;

      return result;
    } catch (error) {
      console.error(`[TrafficAgent] Action error:`, error);
      return {
        success: false,
        error: error.message,
        stationId: eventData.stationId,
      };
    }
  }

  // VERIFY: Check if traffic management was effective
  async verify(actionResult, eventData) {
    try {
      // In a real system, this would check actual queue lengths and wait times
      // For now, we'll simulate verification based on action type

      const action = actionResult.message;
      let success = true;
      let reason = "Traffic management action completed successfully";
      let effectivenessScore = 0.8;

      // Simulate different success rates for different actions
      if (action.includes("incentive")) {
        // Incentives have variable success based on amount and timing
        const acceptanceRate = Math.random() * 0.4 + 0.3; // 30-70% acceptance
        effectivenessScore = acceptanceRate;

        if (acceptanceRate < 0.4) {
          success = false;
          reason = "Low incentive acceptance rate - users did not respond";
        } else {
          reason = `Incentive accepted by ${(acceptanceRate * 100).toFixed(
            1,
          )}% of users`;
        }
      } else if (action.includes("pricing")) {
        // Dynamic pricing usually works but may reduce satisfaction
        effectivenessScore = 0.75;
        reason =
          "Dynamic pricing reduced demand but may impact user satisfaction";
      }

      return {
        success,
        reason,
        metrics: {
          responseTime: actionResult.responseTime,
          accuracy: success ? 1.0 : 0.0,
          effectivenessScore,
          userAcceptanceRate: effectivenessScore,
        },
      };
    } catch (error) {
      console.error(`[TrafficAgent] Verification error:`, error);
      return {
        success: false,
        reason: `Verification failed: ${error.message}`,
      };
    }
  }

  // Advanced helper methods for algorithmic incentive calculation
  calculateAlgorithmicIncentive(
    queueLength,
    waitTime,
    nearbyStations,
    userProfile = {},
  ) {
    // Base formula: Incentive = (Time_Saved × Value_Time) + (Distance_Extra × Cost_Km)

    const valueOfTime = userProfile.timeValue || 150; // ₹150 per hour default
    const costPerKm = userProfile.travelCost || 8; // ₹8 per km default

    // Find best alternative station
    const bestAlternative = this.findBestAlternativeStation(nearbyStations);

    if (!bestAlternative) {
      return {
        totalCost: 0,
        acceptanceProbability: 0,
        expectedRevenue: 0,
        reason: "No suitable alternatives available",
      };
    }

    // Calculate time saved
    const timeSavedMinutes = waitTime - (bestAlternative.waitTime || 2);
    const timeSavedHours = Math.max(0, timeSavedMinutes / 60);
    const timeSavingValue = timeSavedHours * valueOfTime;

    // Calculate extra distance cost
    const extraDistance = bestAlternative.distance || 2;
    const extraDistanceCost = extraDistance * costPerKm;

    // Calculate base incentive
    const baseIncentive = timeSavingValue + extraDistanceCost;

    // Add urgency multiplier based on queue length
    const urgencyMultiplier = Math.min(1 + queueLength / 10, 2.0);
    const finalIncentive = Math.ceil(baseIncentive * urgencyMultiplier);

    // Calculate acceptance probability using behavioral economics
    const acceptanceProbability = this.calculateAcceptanceProbability(
      finalIncentive,
      timeSavedMinutes,
      extraDistance,
      userProfile,
    );

    // Calculate expected revenue impact
    const expectedRevenue = this.calculateExpectedRevenue(
      finalIncentive,
      acceptanceProbability,
      queueLength,
    );

    return {
      totalCost: finalIncentive,
      acceptanceProbability,
      expectedRevenue,
      breakdown: {
        timeSavingValue: Math.ceil(timeSavingValue),
        extraDistanceCost: Math.ceil(extraDistanceCost),
        urgencyMultiplier,
        baseIncentive: Math.ceil(baseIncentive),
      },
      alternativeStation: bestAlternative,
      timeSavedMinutes,
      extraDistance,
    };
  }

  findBestAlternativeStation(nearbyStations) {
    if (!nearbyStations || nearbyStations.length === 0) return null;

    // Score stations based on distance, queue length, and availability
    return nearbyStations
      .map((station) => ({
        ...station,
        score: this.calculateStationScore(station),
      }))
      .sort((a, b) => b.score - a.score)[0];
  }

  calculateStationScore(station) {
    const distanceScore = Math.max(0, 10 - station.distance); // Closer is better
    const queueScore = Math.max(0, 10 - (station.queueLength || 0)); // Less queue is better
    const availabilityScore = station.availableSlots > 0 ? 10 : 0;

    return distanceScore * 0.3 + queueScore * 0.5 + availabilityScore * 0.2;
  }

  calculateAcceptanceProbability(
    incentive,
    timeSaved,
    extraDistance,
    userProfile,
  ) {
    // Behavioral economics model for acceptance probability

    // Base acceptance based on incentive amount
    let baseAcceptance = Math.min(incentive / 100, 0.8); // Max 80% for high incentives

    // Time sensitivity factor
    const timeFactor = Math.min(timeSaved / 20, 0.3); // Up to 30% boost for time savings

    // Distance penalty
    const distancePenalty = Math.max(0, (extraDistance - 1) * 0.1); // Penalty for extra distance

    // User profile adjustments
    const urgencyBonus = (userProfile.urgencyLevel || 0.5) * 0.2;
    const pricesensitivity = (userProfile.priceSensitivity || 0.5) * 0.1;

    const finalProbability = Math.max(
      0.1,
      Math.min(
        0.9,
        baseAcceptance +
          timeFactor -
          distancePenalty +
          urgencyBonus +
          pricesensitivity,
      ),
    );

    return finalProbability;
  }

  calculateExpectedRevenue(incentive, acceptanceProbability, queueLength) {
    // Revenue from reduced wait times and improved satisfaction
    const revenuePerRedirect = 200; // Average revenue per successful redirect
    const expectedRedirects = Math.floor(queueLength * acceptanceProbability);
    const totalRevenue = expectedRedirects * revenuePerRedirect;
    const netRevenue = totalRevenue - incentive * expectedRedirects;

    return Math.max(0, netRevenue);
  }

  calculateSurgeMultiplier(utilizationRate, isPeakHour) {
    let baseMultiplier = 1.0;

    // Utilization-based surge
    if (utilizationRate > 0.9) baseMultiplier = 2.0;
    else if (utilizationRate > 0.8) baseMultiplier = 1.5;
    else if (utilizationRate > 0.7) baseMultiplier = 1.2;

    // Peak hour adjustment
    if (isPeakHour) baseMultiplier *= 1.2;

    return Math.min(baseMultiplier, 2.5); // Cap at 2.5x
  }

  estimateSurgeRevenue(queueLength, surgeMultiplier) {
    const baseRevenuePerUser = 100;
    const surgeRevenue = baseRevenuePerUser * (surgeMultiplier - 1);
    const expectedUsers = Math.floor(queueLength * 0.7); // 30% may leave due to surge

    return expectedUsers * surgeRevenue;
  }

  calculateDemandReduction(surgeMultiplier) {
    // Demand elasticity model
    const elasticity = -0.5; // 50% reduction for 100% price increase
    const priceIncrease = surgeMultiplier - 1;

    return Math.abs(elasticity * priceIncrease);
  }

  calculateAttractionIncentive(utilizationRate, isPeakHour) {
    const baseIncentive = 25;
    const utilizationFactor = (1 - utilizationRate) * 50; // More incentive for lower utilization
    const peakPenalty = isPeakHour ? -10 : 0; // Less incentive during peak hours

    const amount = Math.max(
      10,
      baseIncentive + utilizationFactor + peakPenalty,
    );
    const radius = 5; // 5km radius for attraction
    const expectedUsers = Math.floor((1 - utilizationRate) * 20); // More users for lower utilization

    return {
      amount,
      cost: amount * expectedUsers,
      expectedRevenue: amount * expectedUsers * 2.5, // 2.5x return expected
      radius,
      expectedUsers,
    };
  }

  calculatePreemptiveIncentives(mlData) {
    const timeToSurge = mlData.time_to_peak || 30; // minutes
    const surgeIntensity = mlData.predicted_demand / mlData.current_capacity;

    // Earlier intervention = smaller incentives needed
    const timeFactor = Math.max(0.5, 1 - timeToSurge / 60);
    const baseIncentive = 40 * surgeIntensity * timeFactor;

    return {
      incentiveAmount: Math.ceil(baseIncentive),
      targetUsers: Math.floor(mlData.predicted_demand * 0.3),
      interventionTime: timeToSurge,
      expectedEffectiveness: 0.7,
    };
  }

  determineIncentiveStrategy(queueLength, utilizationRate, isPeakHour) {
    if (queueLength >= this.thresholds.queueLength.critical) {
      return "aggressive_redirect";
    } else if (utilizationRate > this.thresholds.utilizationRate.high) {
      return "surge_pricing";
    } else if (utilizationRate < this.thresholds.utilizationRate.low) {
      return "attraction_incentives";
    } else if (isPeakHour) {
      return "peak_management";
    } else {
      return "balanced_approach";
    }
  }

  // Action execution methods
  async executeIncentiveEngine(decision, eventData) {
    const incentiveDetails = decision.impact.incentiveDetails;
    const targetUsers = decision.impact.targetUsers;

    // Simulate sending personalized incentives
    const notifications = [];
    for (const user of targetUsers) {
      notifications.push({
        userId: user.userId,
        incentiveAmount: incentiveDetails.totalCost,
        alternativeStation: incentiveDetails.alternativeStation.stationId,
        timeSaved: incentiveDetails.timeSavedMinutes,
        message: `🔔 Queue alert! Switch to ${incentiveDetails.alternativeStation.stationId} and save ${incentiveDetails.timeSavedMinutes} minutes + get ₹${incentiveDetails.totalCost} off!`,
      });
    }

    return {
      success: true,
      message: `Dynamic incentive engine executed: ₹${incentiveDetails.totalCost} incentives sent to ${targetUsers.length} users`,
      impact: {
        incentivesSent: notifications.length,
        totalIncentiveCost: incentiveDetails.totalCost * notifications.length,
        expectedAcceptance: Math.floor(
          notifications.length * incentiveDetails.acceptanceProbability,
        ),
        expectedRevenue: incentiveDetails.expectedRevenue,
        notifications,
        algorithmicPricing: true,
        acceptanceProbability: incentiveDetails.acceptanceProbability,
      },
    };
  }

  async executeSurgePricing(decision, eventData) {
    const surgeMultiplier = decision.impact.surgeMultiplier;
    const expectedRevenue = decision.impact.revenueImpact;
    const demandReduction = decision.impact.expectedDemandReduction;

    return {
      success: true,
      message: `Surge pricing activated: ${(
        (surgeMultiplier - 1) *
        100
      ).toFixed(0)}% increase`,
      impact: {
        surgeMultiplier,
        priceIncrease: ((surgeMultiplier - 1) * 100).toFixed(0) + "%",
        expectedRevenue,
        expectedDemandReduction: (demandReduction * 100).toFixed(0) + "%",
        duration: "2 hours",
        affectedUsers: "all_current_queue",
        pricingStrategy: "dynamic_surge",
      },
    };
  }

  async executeAttractionIncentives(decision, eventData) {
    const incentiveDetails = decision.impact;

    return {
      success: true,
      message: `Attraction incentives deployed: ₹${incentiveDetails.incentiveAmount} within ${incentiveDetails.targetRadius}km`,
      impact: {
        incentiveAmount: incentiveDetails.incentiveAmount,
        targetRadius: incentiveDetails.targetRadius,
        expectedNewUsers: incentiveDetails.expectedNewUsers,
        totalCost: incentiveDetails.costImpact,
        expectedRevenue: incentiveDetails.revenueImpact,
        broadcastRadius: incentiveDetails.targetRadius,
        attractionStrategy: "location_based_incentives",
      },
    };
  }

  async executePreemptiveDemandShaping(decision, eventData) {
    const preemptiveAction = decision.impact.preemptiveAction;

    return {
      success: true,
      message: `Preemptive demand shaping initiated: ${preemptiveAction.timeToSurge} minutes before predicted surge`,
      impact: {
        predictedSurge: preemptiveAction.predictedSurge,
        timeToSurge: preemptiveAction.timeToSurge,
        proactiveIncentives: preemptiveAction.proactiveIncentives,
        interventionType: "ml_predictive",
        expectedEffectiveness:
          preemptiveAction.proactiveIncentives.expectedEffectiveness,
        targetUsers: preemptiveAction.proactiveIncentives.targetUsers,
      },
    };
  }

  async findNearbyStations(stationId) {
    // In a real system, this would query the database for nearby stations
    // For now, return mock data
    return [
      { stationId: "ST002", distance: 2.5, queueLength: 2 },
      { stationId: "ST003", distance: 3.1, queueLength: 0 },
    ];
  }

  isPeakHour() {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    return (
      (currentTime >= 800 && currentTime <= 1000) ||
      (currentTime >= 1700 && currentTime <= 2000)
    );
  }

  identifyTargetUsers(eventData, context) {
    // In a real system, this would identify users in the queue or nearby
    // For now, return mock user list
    const queueLength = context.queueLength || 0;
    const targetCount = Math.min(queueLength, 10);

    return Array.from({ length: targetCount }, (_, i) => ({
      userId: `USR_${String(i + 1).padStart(6, "0")}`,
      position: i + 1,
      estimatedWaitTime: (i + 1) * 5,
    }));
  }

  // Helper method to get queue history for predictions
  getQueueHistory(stationId, currentQueue) {
    // In a real system, this would query Redis/MongoDB for historical data
    // For MVP, simulate with recent values based on current queue
    const baseQueue = currentQueue || 0;
    const history = [];

    // Generate last 10 data points with some realistic variation
    for (let i = 9; i >= 0; i--) {
      const variation = (Math.random() - 0.5) * 4; // ±2 variation
      const timeDecay = i * 0.1; // Slight trend over time
      const value = Math.max(0, Math.round(baseQueue + variation - timeDecay));
      history.push(value);
    }

    return history;
  }

  async simulateDelay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const trafficAgent = new TrafficAgent();

export default trafficAgent;
