import dotenv from "dotenv";
dotenv.config();
import express from "express";
import groqClient from "../services/groqClient.js";
import fs from "fs";

const chatrouter = express.Router();

console.log("Chat route initialized");

function saveChatLog(userMessage, botReply) {
  const log = {
    timestamp: new Date().toISOString(),
    user: userMessage,
    bot: botReply,
  };

  fs.appendFile("chatlogs.json", JSON.stringify(log) + "\n", (err) => {
    if (err) console.error("Error saving chat log:", err);
  });
}

chatrouter.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  try {
    // Build comprehensive system prompt with complete project context
    const systemPrompt = `EV Charging Station AI Assistant - Intelligent Infrastructure Management

You are an AI assistant for an advanced EV charging station management system with autonomous agents and ML-powered decision making.

SYSTEM ARCHITECTURE:
- Multi-Agent System: MechanicAgent, TrafficAgent, LogisticsAgent, EnergyAgent, AuditorAgent
- ML Service: Predictive analytics for failures, traffic, stockouts, energy prices
- Blockchain Audit: Immutable decision logging and compliance tracking
- Real-time Data: Redis cache + MongoDB for station states and sensor data
- Supervisor System: Risk assessment and policy enforcement

CORE CAPABILITIES & THRESHOLDS:

**MECHANIC AGENT - Hardware Health & Self-Healing:**
- Temperature Monitoring: Normal <85°C, Critical >95°C
- Voltage Stability: 200-240V normal, <180V critical
- Current Limits: <32A normal, >40A critical  
- Vibration Levels: <2.0G normal, >3.0G critical
- Error Rate: <5% normal, >10% critical
- Self-Healing Protocols: Cooling, power stabilization, network recovery, firmware rollback
- Autonomy Level: 5 (Full automation for most repairs)

**TRAFFIC AGENT - Congestion & Incentive Management:**
- Queue Thresholds: 5+ vehicles warning, 10+ critical
- Wait Time: 10+ min warning, 20+ min critical
- Utilization: <30% low, >80% high demand
- Dynamic Incentive Engine: Algorithmic pricing based on time saved + distance cost
- Surge Pricing: 1.2x-2.5x multipliers during peak demand
- Acceptance Probability: Behavioral economics model (30-90% success rates)
- Autonomy Level: 5 (Full automation for incentives)

**LOGISTICS AGENT - Inventory & Predictive Dispatch:**
- Inventory Levels: <3 units critical, <8 warning, 15 optimal
- Stockout Risk: >80% high risk, >50% medium risk
- Dispatch Types: Emergency (3x cost), Regular (1.5x), Predictive (1.3x), Optimization (1.1x)
- ML-Driven Predictions: Stockout probability, demand forecasting, route optimization
- Fleet Management: Multi-vehicle routing with efficiency scoring
- Autonomy Level: 3 (Human approval required for dispatch)

**ENERGY AGENT - Market Trading & Grid Services:**
- Price Thresholds: ₹3/kWh buy opportunity, ₹12/kWh sell opportunity, ₹15/kWh critical
- Storage Levels: <20% low, 80% optimal, >95% full
- Grid Stability: 49.5-50.5Hz frequency, 380-420V voltage
- Trading Strategies: Arbitrage, surge pricing, grid support services, renewable optimization
- Vehicle-to-Grid: Bidirectional charging with user incentives
- Autonomy Level: 5 (Full automation within risk limits)

**AUDITOR AGENT - Compliance & Risk Assessment:**
- Decision Analysis: ML-powered anomaly detection
- Risk Scoring: 0-1 scale with 0.8+ requiring escalation
- Compliance Monitoring: Real-time policy violation detection
- Blockchain Logging: Immutable audit trail for all decisions
- Performance Metrics: Success rates, cost impacts, user satisfaction
- Autonomy Level: 5 (Continuous monitoring and reporting)

DECISION CRITERIA & ESCALATION:
- Confidence Threshold: 0.7+ for autonomous action
- Risk Escalation: 0.8+ requires supervisor approval
- Cost Limits: ₹5,000 emergency dispatch, ₹10,000 energy trades
- Success Rates: 80%+ expected for all actions
- User Satisfaction: 80%+ target across all services

RESPONSE GUIDELINES:
- Be technical but accessible - explain complex systems in simple terms
- Always provide specific numbers, thresholds, and timeframes when available
- Mention relevant agent actions and ML predictions
- Include environmental and economic benefits
- Offer actionable next steps and alternatives
- Acknowledge system limitations and escalation paths

LANGUAGE: Respond only in English. Use clear, professional language suitable for EV users, station operators, and technical stakeholders.`;

    const reply = await groqClient.askGroq(message, {
      system_prompt: systemPrompt,
      temperature: 0.7,
      max_tokens: 800,
    });

    // Save chat log for analytics
    saveChatLog(message, reply);

    res.json({ reply });
  } catch (err) {
    // Check if it's a rate limit error
    const isRateLimit = err.message?.includes('Rate limit') || err.message?.includes('429');
    
    if (isRateLimit) {
      console.warn('⚠️ Groq API rate limit reached for chat');
      
      // Provide helpful fallback response
      const fallbackReply = `I'm currently experiencing high demand and have reached my API rate limit. Please try again in a few minutes, or here's what I can tell you:

**VOLTIX EV Charging System Overview:**

Our intelligent infrastructure uses 5 autonomous agents:
- 🔧 **Mechanic Agent**: Self-healing hardware (L5 autonomy)
- 🚦 **Traffic Agent**: Dynamic incentives & demand shaping (L5 autonomy)
- 📦 **Logistics Agent**: Predictive inventory management (L3 autonomy)
- ⚡ **Energy Agent**: Market trading & grid services (L5 autonomy)
- 🛡️ **Auditor Agent**: Compliance & risk monitoring (L5 autonomy)

**Key Features:**
- Real-time ML predictions for failures, traffic, and energy prices
- Blockchain audit trail for all decisions
- Dynamic pricing based on demand and time-of-use
- Self-healing capabilities for 80%+ of hardware issues

For specific questions, please try again in a few minutes when my API access resets.`;

      res.json({ reply: fallbackReply, rateLimited: true });
    } else {
      console.error("Groq API Error:", err.message);
      res.status(500).json({
        error: "Error contacting EV Station Assistant. Please try again later.",
        details: err.message,
      });
    }
  }
});

export default chatrouter;
