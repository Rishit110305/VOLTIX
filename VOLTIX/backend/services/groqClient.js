import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

class GroqClient {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.baseURL = "https://api.groq.com/openai/v1/chat/completions";

    if (!this.apiKey) {
      console.warn("GROQ_API_KEY not found in environment variables");
    }
  }

  async askGroq(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error("Groq API key not configured");
    }

    const {
      model = "llama-3.3-70b-versatile", // Updated to supported model
      temperature = 0.3,
      max_tokens = 500,
      system_prompt = null,
    } = options;

    try {
      const messages = [];

      if (system_prompt) {
        messages.push({
          role: "system",
          content: system_prompt,
        });
      }

      messages.push({
        role: "user",
        content: prompt,
      });

      const response = await axios.post(
        this.baseURL,
        {
          model,
          messages,
          temperature,
          max_tokens,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout
        },
      );

      if (response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content.trim();
      } else {
        throw new Error("Invalid response format from Groq API");
      }
    } catch (error) {
      if (error.response) {
        // API error response
        const status = error.response.status;
        const message =
          error.response.data?.error?.message || error.response.statusText;
        throw new Error(`Groq API error (${status}): ${message}`);
      } else if (error.request) {
        // Network error
        throw new Error("Network error: Unable to reach Groq API");
      } else {
        // Other error
        throw new Error(`Groq client error: ${error.message}`);
      }
    }
  }

  // Specialized method for agent decision explanations
  async explainAgentDecision(decisionData) {
    const systemPrompt = `You are an AI explainability expert for EV charging station management systems. 
Your job is to explain agent decisions in clear, human-readable language that both technical operators and end users can understand.

Focus on:
1. WHY the decision was made (root cause)
2. WHAT the expected outcome is
3. HOW this benefits users and operations
4. WHAT risks were considered

Keep explanations concise, practical, and actionable.`;

    const prompt = this.buildDecisionPrompt(decisionData);

    return await this.askGroq(prompt, {
      system_prompt: systemPrompt,
      temperature: 0.2,
      max_tokens: 400,
    });
  }

  // Specialized method for system status explanations
  async explainSystemStatus(statusData) {
    const systemPrompt = `You are a system analyst for EV charging infrastructure. 
Explain system status, performance metrics, and operational insights in clear, actionable language.

Focus on:
1. Overall system health
2. Key performance indicators
3. Areas needing attention
4. Recommended actions

Be concise and focus on actionable insights.`;

    const prompt = this.buildStatusPrompt(statusData);

    return await this.askGroq(prompt, {
      system_prompt: systemPrompt,
      temperature: 0.2,
      max_tokens: 350,
    });
  }

  // Build decision explanation prompt
  buildDecisionPrompt(decisionData) {
    const {
      agent,
      action,
      stationId,
      context,
      impact,
      confidence,
      riskScore,
      predictionInsights,
    } = decisionData;

    return `AGENT DECISION ANALYSIS:

Agent: ${agent}
Action: ${action}
Station: ${stationId}
Confidence: ${(confidence * 100).toFixed(1)}%
Risk Score: ${(riskScore * 100).toFixed(1)}%

CONTEXT:
${JSON.stringify(context, null, 2)}

EXPECTED IMPACT:
- Cost: ₹${impact?.costImpact || 0}
- Revenue: ₹${impact?.revenueImpact || 0}
- Success Rate: ${((impact?.successRate || 0) * 100).toFixed(1)}%

PREDICTION INSIGHTS:
${
  predictionInsights
    ? JSON.stringify(predictionInsights, null, 2)
    : "No prediction data available"
}

Explain this decision in 2-3 sentences focusing on the business rationale and user benefit.`;
  }

  // Build system status prompt
  buildStatusPrompt(statusData) {
    return `SYSTEM STATUS OVERVIEW:

Current Metrics:
${JSON.stringify(statusData, null, 2)}

Provide a brief status summary highlighting:
1. Overall system health
2. Key performance indicators
3. Any areas needing attention
4. Recommended actions

Keep it concise and actionable.`;
  }

  // Test connection to Groq API
  async testConnection() {
    try {
      const response = await this.askGroq(
        "Test connection - respond with 'OK'",
        {
          max_tokens: 10,
        },
      );
      return { success: true, response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get available models (if supported by API)
  async getModels() {
    try {
      const response = await axios.get(
        "https://api.groq.com/openai/v1/models",
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get models: ${error.message}`);
    }
  }
}

// Create singleton instance
const groqClient = new GroqClient();

export default groqClient;
