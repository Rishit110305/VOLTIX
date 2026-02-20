// Simple Statistical Predictors - MVP Intelligence Layer
// Lightweight predictors for low-data environments

class SimplePredictors {
  
  // 1. Queue/Demand Predictor
  static predictQueue(history) {
    if (!Array.isArray(history) || history.length === 0) {
      return { predicted: 0, confidence: 0.1 };
    }

    // Calculate average
    const avg = history.reduce((sum, val) => sum + val, 0) / history.length;
    
    // Calculate trend (last - first)
    const trend = history.length > 1 ? history[history.length - 1] - history[0] : 0;
    
    // Predicted = avg + trend
    const predicted = Math.max(0, avg + trend);
    
    // Confidence based on data consistency and history length
    const variance = history.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / history.length;
    const consistency = Math.max(0, 1 - (variance / (avg + 1))); // Normalize variance
    const dataQuality = Math.min(history.length / 10, 1); // More data = higher confidence
    const confidence = Math.min(0.95, (consistency * 0.7) + (dataQuality * 0.3));
    
    return { 
      predicted: Math.round(predicted), 
      confidence: Math.round(confidence * 100) / 100,
      trend,
      average: Math.round(avg * 100) / 100,
      dataPoints: history.length
    };
  }

  // 2. Stockout Predictor
  static predictStockout(inventory, burnRate, threshold = 2) {
    if (!inventory || !burnRate || burnRate <= 0) {
      return { stockoutSoon: false, confidence: 0.1, hoursLeft: Infinity };
    }

    // Hours left = inventory / burn rate
    const hoursLeft = inventory / burnRate;
    
    // Stockout soon if hours left < threshold
    const stockoutSoon = hoursLeft < threshold;
    
    // Confidence based on burn rate stability and inventory level
    let confidence = 0.8; // Base confidence
    
    // Higher confidence for critical situations
    if (hoursLeft < 1) confidence = 0.95;
    else if (hoursLeft < threshold * 0.5) confidence = 0.9;
    else if (hoursLeft > threshold * 3) confidence = 0.6; // Less urgent = less confident
    
    // Adjust confidence based on inventory level
    if (inventory < 3) confidence = Math.min(confidence + 0.1, 0.95);
    
    return {
      stockoutSoon,
      confidence: Math.round(confidence * 100) / 100,
      hoursLeft: Math.round(hoursLeft * 100) / 100,
      threshold,
      urgencyLevel: hoursLeft < 1 ? 'critical' : hoursLeft < threshold ? 'high' : 'medium'
    };
  }

  // 3. Failure Risk Estimator
  static estimateFailureRisk(metrics) {
    if (!metrics || typeof metrics !== 'object') {
      return { risk: 0.1, confidence: 0.1, factors: [] };
    }

    let risk = 0;
    const factors = [];
    
    // Temperature risk (0-0.4 contribution)
    if (metrics.temperature) {
      if (metrics.temperature > 95) {
        risk += 0.4;
        factors.push('Critical temperature (>95°C)');
      } else if (metrics.temperature > 85) {
        risk += 0.2;
        factors.push('High temperature (>85°C)');
      } else if (metrics.temperature > 75) {
        risk += 0.1;
        factors.push('Elevated temperature (>75°C)');
      }
    }

    // Voltage instability risk (0-0.3 contribution)
    if (metrics.voltage) {
      if (metrics.voltage < 180 || metrics.voltage > 260) {
        risk += 0.3;
        factors.push('Critical voltage instability');
      } else if (metrics.voltage < 200 || metrics.voltage > 240) {
        risk += 0.15;
        factors.push('Voltage outside normal range');
      }
    }

    // Error frequency risk (0-0.2 contribution)
    if (metrics.errorRate) {
      if (metrics.errorRate > 0.1) {
        risk += 0.2;
        factors.push('High error rate (>10%)');
      } else if (metrics.errorRate > 0.05) {
        risk += 0.1;
        factors.push('Elevated error rate (>5%)');
      }
    }

    // Vibration risk (0-0.1 contribution)
    if (metrics.vibration) {
      if (metrics.vibration > 3.0) {
        risk += 0.1;
        factors.push('Excessive vibration (>3.0G)');
      } else if (metrics.vibration > 2.0) {
        risk += 0.05;
        factors.push('High vibration (>2.0G)');
      }
    }

    // Current overload risk (0-0.1 contribution)
    if (metrics.current) {
      if (metrics.current > 40) {
        risk += 0.1;
        factors.push('Current overload (>40A)');
      } else if (metrics.current > 32) {
        risk += 0.05;
        factors.push('High current (>32A)');
      }
    }

    // Uptime degradation risk (0-0.1 contribution)
    if (metrics.uptime !== undefined) {
      if (metrics.uptime < 90) {
        risk += 0.1;
        factors.push('Low uptime (<90%)');
      } else if (metrics.uptime < 95) {
        risk += 0.05;
        factors.push('Reduced uptime (<95%)');
      }
    }

    // Cap risk between 0 and 1
    risk = Math.min(1.0, Math.max(0, risk));
    
    // Confidence based on number of metrics available
    const metricsCount = Object.keys(metrics).length;
    const confidence = Math.min(0.95, 0.5 + (metricsCount * 0.1));
    
    // Risk level classification
    let riskLevel = 'low';
    if (risk > 0.8) riskLevel = 'critical';
    else if (risk > 0.6) riskLevel = 'high';
    else if (risk > 0.3) riskLevel = 'medium';

    return {
      risk: Math.round(risk * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      factors,
      riskLevel,
      metricsAnalyzed: metricsCount,
      recommendation: this.getFailureRiskRecommendation(risk, factors)
    };
  }

  // Helper method for failure risk recommendations
  static getFailureRiskRecommendation(risk, factors) {
    if (risk > 0.8) {
      return 'Immediate action required - initiate emergency protocols';
    } else if (risk > 0.6) {
      return 'High risk detected - schedule immediate maintenance';
    } else if (risk > 0.3) {
      return 'Monitor closely - consider preventive maintenance';
    } else {
      return 'Normal operation - continue monitoring';
    }
  }

  // Utility method for demand pattern analysis
  static analyzeDemandPattern(history, timeWindow = 24) {
    if (!Array.isArray(history) || history.length < 3) {
      return { pattern: 'insufficient_data', confidence: 0.1 };
    }

    const recent = history.slice(-timeWindow);
    const avg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    
    // Detect patterns
    let pattern = 'stable';
    let confidence = 0.7;
    
    // Check for increasing trend
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const trendStrength = Math.abs(secondAvg - firstAvg) / avg;
    
    if (trendStrength > 0.3) {
      pattern = secondAvg > firstAvg ? 'increasing' : 'decreasing';
      confidence = Math.min(0.9, 0.6 + trendStrength);
    }
    
    // Check for volatility
    const variance = recent.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / recent.length;
    const volatility = Math.sqrt(variance) / avg;
    
    if (volatility > 0.5) {
      pattern = 'volatile';
      confidence = Math.max(0.5, confidence - 0.2);
    }

    return {
      pattern,
      confidence: Math.round(confidence * 100) / 100,
      volatility: Math.round(volatility * 100) / 100,
      trendStrength: Math.round(trendStrength * 100) / 100,
      average: Math.round(avg * 100) / 100
    };
  }

  // Energy price trend predictor
  static predictEnergyPrice(priceHistory, marketFactors = {}) {
    if (!Array.isArray(priceHistory) || priceHistory.length === 0) {
      return { predicted: 8, confidence: 0.1, trend: 'unknown' };
    }

    const recent = priceHistory.slice(-24); // Last 24 data points
    const avg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    
    // Calculate trend
    const trend = recent.length > 1 ? recent[recent.length - 1] - recent[0] : 0;
    let predicted = Math.max(0, avg + trend);
    
    // Apply market factors
    let marketAdjustment = 1.0;
    
    if (marketFactors.demand === 'high') marketAdjustment *= 1.2;
    else if (marketFactors.demand === 'low') marketAdjustment *= 0.9;
    
    if (marketFactors.weather === 'extreme') marketAdjustment *= 1.1;
    if (marketFactors.renewable === 'high') marketAdjustment *= 0.95;
    
    predicted *= marketAdjustment;
    
    // Confidence based on price stability
    const variance = recent.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / recent.length;
    const stability = Math.max(0, 1 - (variance / (avg + 1)));
    const confidence = Math.min(0.85, stability * 0.8 + 0.2);
    
    return {
      predicted: Math.round(predicted * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      trend: trend > 0.5 ? 'increasing' : trend < -0.5 ? 'decreasing' : 'stable',
      marketAdjustment: Math.round(marketAdjustment * 100) / 100,
      basePrice: Math.round(avg * 100) / 100
    };
  }
}

export default SimplePredictors;