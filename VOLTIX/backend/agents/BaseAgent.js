import mlService from '../services/mlService.js';
import { decisionEngine } from '../services/notificationDispatch.js';

class BaseAgent {
  constructor(agentName) {
    this.agentName = agentName;
    this.isActive = true;
    this.processedEvents = 0;
    this.successfulActions = 0;
    this.failedActions = 0;
    this.lastActivity = new Date();
    
    // Agent configuration
    this.config = {
      maxRetries: 3,
      timeoutMs: 30000,
      requiresSupervisorApproval: false,
      escalationThreshold: 0.8, // Risk score threshold for escalation
      confidenceThreshold: 0.7   // Minimum confidence for autonomous action
    };
    
    console.log(`[${this.agentName}] Agent initialized`);
  }

  // MAIN LIFECYCLE METHOD - All agents follow this pattern
  async processEvent(eventData, io) {
    const startTime = Date.now();
    let decisionData = null;
    
    try {
      console.log(`[${this.agentName}] Starting lifecycle for event: ${eventData.type}`);
      this.lastActivity = new Date();
      this.processedEvents++;
      
      // STEP 1: DETECT - Does this agent care about this event?
      const detectionResult = await this.detect(eventData);
      if (!detectionResult.shouldProcess) {
        console.log(`[${this.agentName}] Event ignored: ${detectionResult.reason}`);
        return { success: true, action: 'ignored', reason: detectionResult.reason };
      }
      
      console.log(`[${this.agentName}] Event detected: ${detectionResult.reason}`);
      
      // STEP 2: DECIDE - What should this agent do?
      const decision = await this.decide(eventData, detectionResult.context);
      if (!decision.success) {
        throw new Error(`Decision failed: ${decision.error}`);
      }
      
      console.log(`[${this.agentName}] Decision made: ${decision.action} (confidence: ${decision.confidence})`);
      
      // Prepare decision data for audit
      decisionData = {
        agent: this.agentName,
        stationId: eventData.stationId,
        action: decision.action,
        timestamp: new Date(),
        triggerEvent: this.mapTriggerEvent(eventData.type),
        context: {
          inputData: eventData.data,
          environmentalFactors: eventData.environmentalFactors || {},
          stationContext: eventData.stationContext || {},
          detectionContext: detectionResult.context
        },
        mlMetrics: {
          confidenceScore: decision.confidence,
          executionTime: Date.now() - startTime,
          modelVersion: decision.modelVersion || '1.0.0',
          featuresUsed: decision.featuresUsed || []
        },
        impact: decision.impact || {
          costImpact: 0,
          revenueImpact: 0,
          successRate: 0.8,
          userSatisfaction: 0.8,
          riskScore: decision.riskScore || 0.3
        },
        systemMetrics: {
          cpuUsage: process.cpuUsage ? this.getCpuUsage() : 50,
          memoryUsage: this.getMemoryUsage(),
          apiCalls: decision.apiCalls || 1,
          networkLatency: decision.networkLatency || 0,
          databaseQueries: decision.databaseQueries || 0
        },
        priority: decision.priority || 'medium'
      };
      
      // STEP 3: SUPERVISOR APPROVAL (if required)
      if (this.config.requiresSupervisorApproval || decision.riskScore > this.config.escalationThreshold) {
        const approval = await this.requestSupervisorApproval(decision, decisionData);
        if (!approval.approved) {
          console.log(`[${this.agentName}] Action blocked by supervisor: ${approval.reason}`);
          
          // Audit the blocked decision
          if (auditorAgent && this.agentName !== 'AuditorAgent') {
            await auditorAgent.auditDecision({
              ...decisionData,
              action: `${decision.action}_BLOCKED`,
              supervisorOverride: true,
              blockReason: approval.reason
            }, io);
          }
          
          return { success: false, action: 'blocked', reason: approval.reason };
        }
        console.log(`[${this.agentName}] Supervisor approved action`);
      }
      
      // STEP 4: ACT - Execute the decision
      const actionResult = await this.act(decision, eventData);
      if (!actionResult.success) {
        throw new Error(`Action failed: ${actionResult.error}`);
      }
      
      console.log(`[${this.agentName}] Action executed: ${actionResult.message}`);
      
      // Update decision data with action results
      decisionData.impact = {
        ...decisionData.impact,
        ...actionResult.impact
      };
      decisionData.mlMetrics.executionTime = Date.now() - startTime;
      
      // STEP 5: VERIFY - Did the action succeed?
      const verificationResult = await this.verify(actionResult, eventData);
      if (!verificationResult.success) {
        console.log(`[${this.agentName}] Verification failed: ${verificationResult.reason}`);
        
        // STEP 6: ESCALATE - Handle failure
        await this.escalate(decision, actionResult, verificationResult, eventData, io);
        this.failedActions++;
        
        // Audit the failed decision with explainability
        if (auditorAgent && this.agentName !== 'AuditorAgent') {
          await auditorAgent.auditDecision({
            ...decisionData,
            action: `${decision.action}_FAILED`,
            verificationFailure: verificationResult.reason
          }, io);
        }
        
        // Log failed decision
        try {
          const { default: decisionLogger } = await import('../services/decisionLogger.js');
          await decisionLogger.logDecision({
            ...decisionData,
            action: `${decision.action}_FAILED`,
            verificationFailure: verificationResult.reason
          }, io);
        } catch (logError) {
          console.error(`[${this.agentName}] Failed decision logging error:`, logError);
        }
        
        return { 
          success: false, 
          action: decision.action, 
          error: verificationResult.reason,
          escalated: true 
        };
      }
      
      console.log(`[${this.agentName}] Action verified successfully`);
      this.successfulActions++;
      
      // STEP 7: AUDIT - Record successful decision with explainability
      if (auditorAgent && this.agentName !== 'AuditorAgent') {
        await auditorAgent.auditDecision(decisionData, io);
      }
      
      // Log decision with explainability and blockchain audit
      try {
        const { default: decisionLogger } = await import('../services/decisionLogger.js');
        const logResult = await decisionLogger.logDecision(decisionData, io);
        
        if (logResult.success) {
          console.log(`[${this.agentName}] Decision logged with explanation: ${logResult.decisionId}`);
        } else {
          console.warn(`[${this.agentName}] Decision logging failed: ${logResult.error}`);
        }
      } catch (logError) {
        console.error(`[${this.agentName}] Decision logger error:`, logError);
      }
      
      // Send success notification if significant impact
      if (decision.impact?.revenueImpact > 100 || decision.riskScore > 0.5) {
        await this.notifySuccess(decision, actionResult, io);
      }
      
      return {
        success: true,
        action: decision.action,
        result: actionResult,
        verification: verificationResult,
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error(`[${this.agentName}] Lifecycle error:`, error);
      this.failedActions++;
      
      // Audit the error with explainability
      if (auditorAgent && this.agentName !== 'AuditorAgent' && decisionData) {
        await auditorAgent.auditDecision({
          ...decisionData,
          action: `${decisionData.action}_ERROR`,
          systemError: error.message
        }, io);
      }
      
      // Log error decision
      try {
        const { default: decisionLogger } = await import('../services/decisionLogger.js');
        await decisionLogger.logDecision({
          ...decisionData,
          action: `${decisionData.action}_ERROR`,
          systemError: error.message
        }, io);
      } catch (logError) {
        console.error(`[${this.agentName}] Error decision logging failed:`, logError);
      }
      
      // Escalate system errors
      await this.escalateSystemError(error, eventData, io);
      
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  // STEP 1: DETECT - Override in child classes
  async detect(eventData) {
    // Default implementation - child classes should override
    return {
      shouldProcess: false,
      reason: 'Base agent does not process events',
      context: {}
    };
  }

  // STEP 2: DECIDE - Override in child classes
  async decide(eventData, context) {
    // Default implementation - child classes should override
    return {
      success: false,
      error: 'Base agent cannot make decisions'
    };
  }

  // STEP 4: ACT - Override in child classes
  async act(decision, eventData) {
    // Default implementation - child classes should override
    return {
      success: false,
      error: 'Base agent cannot execute actions'
    };
  }

  // STEP 5: VERIFY - Override in child classes
  async verify(actionResult, eventData) {
    // Default verification - child classes can override
    return {
      success: actionResult.success,
      reason: actionResult.success ? 'Action completed successfully' : 'Action failed',
      metrics: {
        responseTime: actionResult.responseTime || 0,
        accuracy: actionResult.accuracy || 1.0
      }
    };
  }

  // STEP 6: ESCALATE - Common escalation logic
  async escalate(decision, actionResult, verificationResult, eventData, io) {
    try {
      console.log(`[${this.agentName}] Escalating failed action: ${decision.action}`);
      
      // Determine escalation severity
      const severity = this.calculateEscalationSeverity(decision, verificationResult);
      
      // Send escalation notification
      await decisionEngine({
        eventType: 'AGENT_ESCALATION',
        payload: {
          stationId: eventData.stationId,
          agentType: this.agentName.toLowerCase().replace('agent', ''),
          action: decision.action,
          failure: verificationResult.reason,
          severity: severity,
          riskScore: decision.riskScore || 0.5,
          requiresHumanIntervention: severity === 'critical'
        },
        context: {
          source: 'agent_escalation',
          originalEvent: eventData,
          decision: decision,
          actionResult: actionResult
        },
        io
      });
      
      // Log escalation
      console.log(`[${this.agentName}] Escalation notification sent (severity: ${severity})`);
      
    } catch (error) {
      console.error(`[${this.agentName}] Escalation failed:`, error);
    }
  }

  // System error escalation
  async escalateSystemError(error, eventData, io) {
    try {
      await decisionEngine({
        eventType: 'SYSTEM_ERROR',
        payload: {
          stationId: eventData.stationId,
          agentType: this.agentName.toLowerCase().replace('agent', ''),
          error: error.message,
          severity: 'critical',
          requiresHumanIntervention: true
        },
        context: {
          source: 'system_error',
          agent: this.agentName,
          originalEvent: eventData
        },
        io
      });
    } catch (escalationError) {
      console.error(`[${this.agentName}] System error escalation failed:`, escalationError);
    }
  }

  // Success notification
  async notifySuccess(decision, actionResult, io) {
    try {
      await decisionEngine({
        eventType: 'AGENT_SUCCESS',
        payload: {
          stationId: actionResult.stationId,
          agentType: this.agentName.toLowerCase().replace('agent', ''),
          action: decision.action,
          impact: decision.impact,
          message: actionResult.message
        },
        context: {
          source: 'agent_success',
          agent: this.agentName
        },
        io
      });
    } catch (error) {
      console.error(`[${this.agentName}] Success notification failed:`, error);
    }
  }

  // Request supervisor approval
  async requestSupervisorApproval(decision, decisionData) {
    // In a real system, this would integrate with a human approval workflow
    // For now, we'll auto-approve based on risk thresholds
    
    const riskScore = decision.riskScore || 0;
    const confidence = decision.confidence || 0;
    
    if (riskScore > 0.9 || confidence < 0.5) {
      return {
        approved: false,
        reason: `High risk (${riskScore.toFixed(2)}) or low confidence (${confidence.toFixed(2)})`
      };
    }
    
    return {
      approved: true,
      reason: 'Automated approval based on risk assessment'
    };
  }

  // Calculate escalation severity
  calculateEscalationSeverity(decision, verificationResult) {
    const riskScore = decision.riskScore || 0;
    const impact = Math.abs(decision.impact?.costImpact || 0);
    
    if (riskScore > 0.8 || impact > 1000) return 'critical';
    if (riskScore > 0.6 || impact > 500) return 'high';
    if (riskScore > 0.4 || impact > 100) return 'medium';
    return 'low';
  }

  // Map event types to trigger events
  mapTriggerEvent(eventType) {
    const mapping = {
      'station_update': 'routine_monitoring',
      'sensor_reading': 'threshold_breach',
      'user_event': 'user_request',
      'energy_update': 'external_event',
      'emergency': 'emergency'
    };
    
    return mapping[eventType] || 'system_alert';
  }

  // System metrics helpers
  getCpuUsage() {
    // Simplified CPU usage calculation
    return Math.floor(Math.random() * 30) + 20; // 20-50%
  }

  getMemoryUsage() {
    const used = process.memoryUsage();
    return Math.floor((used.heapUsed / used.heapTotal) * 100);
  }

  // Get agent statistics
  getStats() {
    const successRate = this.processedEvents > 0 ? 
      (this.successfulActions / this.processedEvents * 100).toFixed(2) : 0;
    
    return {
      agentName: this.agentName,
      isActive: this.isActive,
      processedEvents: this.processedEvents,
      successfulActions: this.successfulActions,
      failedActions: this.failedActions,
      successRate: `${successRate}%`,
      lastActivity: this.lastActivity,
      uptime: Date.now() - this.startTime || 0
    };
  }

  // Agent configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log(`[${this.agentName}] Configuration updated`);
  }

  // Stop agent
  stop() {
    this.isActive = false;
    console.log(`🛑 [${this.agentName}] Agent stopped`);
  }

  // Start agent
  start() {
    this.isActive = true;
    this.startTime = Date.now();
    console.log(`[${this.agentName}] Agent started`);
  }

  // Audit decision helper method (avoids circular dependency)
  async auditDecision(decisionData, io) {
    try {
      // Dynamic import to avoid circular dependency
      const { default: auditorAgent } = await import('./AuditorAgent.js');
      await auditorAgent.auditDecision(decisionData, io);
    } catch (error) {
      console.error(`[${this.agentName}] Audit failed:`, error);
    }
  }
}

export default BaseAgent;