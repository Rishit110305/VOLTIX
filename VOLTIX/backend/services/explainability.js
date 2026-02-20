import groqClient from './groqClient.js';

class ExplainabilityService {
  
  // Generate comprehensive explanation for agent decisions using Groq
  async generateExplanation(data) {
    try {
      const {
        stationState,
        prediction,
        agentAction,
        agent,
        stationId,
        context,
        impact,
        confidence,
        riskScore
      } = data;

      // Build structured data for Groq
      const decisionData = {
        agent: agent || 'Unknown',
        action: agentAction || 'Unknown',
        stationId: stationId || 'Unknown',
        context: context || {},
        impact: impact || {},
        confidence: confidence || 0.7,
        riskScore: riskScore || 0.3,
        predictionInsights: prediction || null,
        stationState: stationState || {}
      };

      const explanation = await groqClient.explainAgentDecision(decisionData);
      
      return {
        success: true,
        explanation,
        decisionId: data.decisionId,
        agent: data.agent,
        timestamp: new Date().toISOString(),
        confidence: confidence || 0.7
      };
      
    } catch (error) {
      // Check if it's a rate limit error
      const isRateLimit = error.message?.includes('Rate limit') || error.message?.includes('429');
      
      if (isRateLimit) {
        console.warn('⚠️ Groq API rate limit reached - using fallback explanation');
      } else {
        console.error('Explainability service error:', error.message);
      }
      
      // Fallback explanation if Groq fails
      const fallbackExplanation = this.generateFallbackExplanation(data);
      
      return {
        success: false,
        error: isRateLimit ? 'Rate limit reached' : error.message,
        explanation: fallbackExplanation,
        fallback: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Generate fallback explanation when Groq is unavailable
  generateFallbackExplanation(data) {
    const { agent, agentAction, impact, confidence } = data;
    
    const templates = {
      MechanicAgent: `Hardware maintenance action "${agentAction}" was triggered due to sensor readings exceeding normal thresholds. This proactive measure helps prevent equipment failure and ensures continuous service availability.`,
      
      TrafficAgent: `Traffic management action "${agentAction}" was implemented to optimize user experience. Expected impact: ${impact?.costImpact ? `₹${Math.abs(impact.costImpact)} cost` : 'cost optimization'} with ${((impact?.successRate || 0.8) * 100).toFixed(0)}% success rate.`,
      
      LogisticsAgent: `Inventory management action "${agentAction}" was initiated to prevent service disruption. This ensures adequate supply levels and maintains operational continuity.`,
      
      EnergyAgent: `Energy optimization action "${agentAction}" was executed to maximize efficiency and cost-effectiveness. This balances grid stability with operational profitability.`,
      
      AuditorAgent: `Compliance monitoring detected the need for "${agentAction}". This ensures system integrity and regulatory compliance while maintaining audit trail transparency.`
    };

    const baseExplanation = templates[agent] || `Agent "${agent}" executed "${agentAction}" based on system analysis and operational requirements.`;
    
    return `${baseExplanation} Decision confidence: ${((confidence || 0.7) * 100).toFixed(0)}%. This action is designed to optimize system performance and user satisfaction.`;
  }

  // Generate system status explanation
  async explainSystemStatus(systemData) {
    try {
      const explanation = await groqClient.explainSystemStatus(systemData);
      
      return {
        success: true,
        explanation,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('System explanation error:', error);
      
      // Fallback system status explanation
      const fallbackExplanation = this.generateSystemStatusFallback(systemData);
      
      return {
        success: false,
        error: error.message,
        explanation: fallbackExplanation,
        fallback: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Fallback system status explanation
  generateSystemStatusFallback(systemData) {
    const {
      totalStations = 0,
      activeStations = 0,
      avgQueueLength = 0,
      avgWaitTime = 0,
      uptime = 0
    } = systemData;

    const healthScore = activeStations / Math.max(totalStations, 1);
    let healthStatus = 'Good';
    
    if (healthScore < 0.8) healthStatus = 'Needs Attention';
    if (healthScore < 0.6) healthStatus = 'Critical';

    return `System Status: ${healthStatus}. ${activeStations}/${totalStations} stations active. Average queue: ${avgQueueLength} vehicles, wait time: ${avgWaitTime} minutes. System uptime: ${uptime}%. ${healthScore < 0.9 ? 'Recommend monitoring inactive stations.' : 'All systems operating normally.'}`;
  }

  // Explain ML prediction results using Groq
  async explainPrediction(predictionData) {
    try {
      const prompt = `
PREDICTION ANALYSIS:

Model Type: ${predictionData.modelType || 'Statistical Predictor'}
Prediction: ${JSON.stringify(predictionData.prediction, null, 2)}
Confidence: ${predictionData.confidence || 'N/A'}
Input Features: ${JSON.stringify(predictionData.features, null, 2)}

Explain this prediction in simple terms:
1. What the prediction means practically
2. How confident we should be
3. What actions should be taken
4. What could affect accuracy

Keep it concise and actionable.`;

      const explanation = await groqClient.askGroq(prompt, {
        system_prompt: "You are an ML interpretation expert. Explain predictions clearly for EV charging station operators.",
        temperature: 0.3,
        max_tokens: 300
      });

      return {
        success: true,
        explanation,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Prediction explanation error:', error);
      
      const fallbackExplanation = `Prediction analysis: ${predictionData.modelType || 'Statistical model'} indicates ${JSON.stringify(predictionData.prediction)} with ${((predictionData.confidence || 0.7) * 100).toFixed(0)}% confidence. Monitor system closely and take appropriate action based on prediction outcomes.`;
      
      return {
        success: false,
        error: error.message,
        explanation: fallbackExplanation,
        fallback: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test Groq connection
  async testGroqConnection() {
    try {
      const result = await groqClient.testConnection();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get threshold explanations (static data)
  getThresholdExplanations() {
    return {
      mechanic: {
        temperature: "Temperature above 85°C triggers cooling protocols. Above 95°C requires immediate shutdown for safety.",
        voltage: "Voltage must stay between 200-240V. Outside this range can damage equipment or create safety hazards.",
        current: "Current above 32A indicates overload. Above 40A triggers emergency shutdown.",
        vibration: "Vibration above 2.0G suggests mechanical issues. Above 3.0G requires immediate inspection."
      },
      traffic: {
        queue: "5+ vehicles in queue triggers incentive offers. 10+ vehicles activates surge pricing and alternative routing.",
        waitTime: "Wait times above 10 minutes prompt user notifications. Above 20 minutes triggers emergency capacity measures.",
        utilization: "Below 30% utilization activates attraction incentives. Above 80% implements demand management."
      },
      logistics: {
        inventory: "Below 8 units triggers restock planning. Below 3 units activates emergency dispatch.",
        stockout: "Above 50% stockout risk initiates predictive dispatch. Above 80% triggers emergency protocols."
      },
      energy: {
        price: "Below ₹3/kWh creates buying opportunities. Above ₹12/kWh enables profitable selling.",
        storage: "Below 20% storage requires charging. Above 95% enables grid services and energy sales.",
        grid: "Frequency outside 49.5-50.5Hz or voltage outside 380-420V triggers grid support services."
      }
    };
  }

  // Get decision criteria explanations (static data)
  getDecisionCriteriaExplanations() {
    return {
      autonomyLevels: {
        1: "Manual Control - Human operator required for all decisions",
        2: "Human Approval - System recommends, human approves",
        3: "Human Oversight - System acts, human can override",
        4: "Supervised Automation - System acts with human monitoring",
        5: "Full Automation - System acts independently within parameters"
      },
      riskThresholds: {
        low: "0.0-0.3: Low risk, autonomous action permitted",
        medium: "0.3-0.6: Medium risk, enhanced monitoring",
        high: "0.6-0.8: High risk, supervisor notification required",
        critical: "0.8-1.0: Critical risk, human approval mandatory"
      },
      confidenceThresholds: {
        minimum: "0.7: Minimum confidence for autonomous action",
        preferred: "0.8: Preferred confidence for complex decisions",
        high: "0.9+: High confidence enables advanced automation"
      }
    };
  }
}

const explainabilityService = new ExplainabilityService();
export default explainabilityService;