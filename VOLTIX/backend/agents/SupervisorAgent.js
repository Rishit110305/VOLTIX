import BaseAgent from './BaseAgent.js';
import { decisionEngine } from '../services/notificationDispatch.js';

class SupervisorAgent extends BaseAgent {
  constructor() {
    super('SupervisorAgent');
    
    // Supervisor-specific configuration
    this.config = {
      ...this.config,
      requiresSupervisorApproval: false, // Supervisor doesn't need approval
      escalationThreshold: 0.9, // Very high threshold for supervisor escalation
      confidenceThreshold: 0.9,
      maxConcurrentAgents: 5
    };
    
    // Agent registry - will be populated dynamically
    this.agents = {};
    
    // Agent priorities (higher number = higher priority)
    this.agentPriorities = {
      mechanic: 5,    // Safety first
      auditor: 4,     // Compliance second
      logistics: 3,   // Service continuity
      traffic: 2,     // User experience
      energy: 1       // Optimization last
    };
    
    // Conflict resolution rules
    this.conflictRules = {
      'mechanic-traffic': 'mechanic', // Safety over user experience
      'mechanic-logistics': 'mechanic', // Safety over service
      'mechanic-energy': 'mechanic', // Safety over profit
      'logistics-traffic': 'logistics', // Service over user experience
      'logistics-energy': 'logistics', // Service over profit
      'traffic-energy': 'traffic' // User experience over profit
    };
    
    this.activeAgentSessions = new Map();
    this.agentPerformance = new Map();
    
    console.log('SupervisorAgent initialized - Ready to orchestrate agents');
  }

  // Dynamically load agents to avoid circular dependencies
  async loadAgents() {
    if (Object.keys(this.agents).length === 0) {
      try {
        const { default: mechanicAgent } = await import('./MechanicAgent.js');
        const { default: trafficAgent } = await import('./TrafficAgent.js');
        const { default: logisticsAgent } = await import('./LogisticsAgent.js');
        const { default: energyAgent } = await import('./EnergyAgent.js');
        const { default: auditorAgent } = await import('./AuditorAgent.js');
        
        this.agents = {
          mechanic: mechanicAgent,
          traffic: trafficAgent,
          logistics: logisticsAgent,
          energy: energyAgent,
          auditor: auditorAgent
        };
        
        console.log('All agents loaded successfully');
      } catch (error) {
        console.error('Failed to load agents:', error);
      }
    }
  }

  // DETECT: Always processes events to coordinate agents
  async detect(eventData) {
    return {
      shouldProcess: true,
      reason: 'Supervisor coordinates all agent activities',
      context: {
        eventType: eventData.type,
        stationId: eventData.stationId,
        requiresCoordination: true
      }
    };
  }

  // DECIDE: Coordinate agent responses
  async decide(eventData, context) {
    try {
      console.log(`[SupervisorAgent] Coordinating agents for event: ${eventData.type}`);
      
      // Get all agent detection results
      const agentDetections = await this.getAgentDetections(eventData);
      
      // Filter agents that want to process this event
      const interestedAgents = agentDetections.filter(detection => detection.shouldProcess);
      
      if (interestedAgents.length === 0) {
        return {
          success: true,
          action: 'monitor',
          confidence: 1.0,
          riskScore: 0.1,
          impact: {
            costImpact: 0,
            revenueImpact: 0,
            successRate: 1.0,
            userSatisfaction: 0.8,
            riskScore: 0.1
          },
          reasoning: 'No agents interested in this event',
          agentPlan: []
        };
      }
      
      // Resolve conflicts and create execution plan
      const executionPlan = await this.createExecutionPlan(interestedAgents, eventData);
      
      // Calculate overall impact and risk
      const overallImpact = this.calculateOverallImpact(executionPlan);
      const overallRisk = this.calculateOverallRisk(executionPlan);
      
      return {
        success: true,
        action: 'coordinate_agents',
        confidence: 0.9,
        riskScore: overallRisk,
        impact: overallImpact,
        reasoning: `Coordinating ${executionPlan.length} agents: ${executionPlan.map(p => p.agent).join(', ')}`,
        agentPlan: executionPlan,
        priority: this.determinePriority(executionPlan)
      };
      
    } catch (error) {
      console.error(`[SupervisorAgent] Decision error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ACT: Execute coordinated agent plan
  async act(decision, eventData) {
    try {
      const stationId = eventData.stationId;
      const agentPlan = decision.agentPlan;
      
      console.log(`[SupervisorAgent] Executing coordination plan for ${stationId}`);
      
      let result = {
        success: true,
        message: '',
        stationId,
        responseTime: 0,
        accuracy: 1.0
      };
      
      const startTime = Date.now();
      const agentResults = [];
      
      if (agentPlan.length === 0) {
        result.message = `Monitoring ${stationId} - no agent actions required`;
        result.impact = { monitoringActive: true };
        result.responseTime = Date.now() - startTime;
        return result;
      }
      
      // Ensure agents are loaded before execution
      await this.loadAgents();
      
      // Execute agents in priority order
      for (const planItem of agentPlan) {
        try {
          console.log(`[SupervisorAgent] Executing ${planItem.agent} agent`);
          
          const agent = this.agents[planItem.agent];
          if (!agent) {
            console.error(`❌ Agent not found: ${planItem.agent}`);
            continue;
          }
          
          // Track agent session
          const sessionId = `${planItem.agent}_${Date.now()}`;
          this.activeAgentSessions.set(sessionId, {
            agent: planItem.agent,
            startTime: Date.now(),
            eventData,
            status: 'running'
          });
          
          // Execute agent lifecycle
          const agentResult = await agent.processEvent(eventData, this.io);
          
          // Update session
          this.activeAgentSessions.set(sessionId, {
            ...this.activeAgentSessions.get(sessionId),
            status: agentResult.success ? 'completed' : 'failed',
            result: agentResult,
            endTime: Date.now()
          });
          
          agentResults.push({
            agent: planItem.agent,
            success: agentResult.success,
            action: agentResult.action,
            result: agentResult,
            executionTime: agentResult.executionTime || 0
          });
          
          // Update agent performance tracking
          this.updateAgentPerformance(planItem.agent, agentResult);
          
          console.log(`[SupervisorAgent] ${planItem.agent} completed: ${agentResult.action}`);
          
        } catch (agentError) {
          console.error(`[SupervisorAgent] Agent ${planItem.agent} failed:`, agentError);
          
          agentResults.push({
            agent: planItem.agent,
            success: false,
            error: agentError.message,
            executionTime: 0
          });
        }
      }
      
      // Analyze results and create summary
      const successfulAgents = agentResults.filter(r => r.success);
      const failedAgents = agentResults.filter(r => !r.success);
      
      result.message = `Agent coordination completed: ${successfulAgents.length}/${agentResults.length} agents successful`;
      result.impact = {
        agentsExecuted: agentResults.length,
        successfulAgents: successfulAgents.length,
        failedAgents: failedAgents.length,
        totalExecutionTime: agentResults.reduce((sum, r) => sum + r.executionTime, 0),
        agentResults: agentResults.map(r => ({
          agent: r.agent,
          action: r.action,
          success: r.success
        }))
      };
      
      result.responseTime = Date.now() - startTime;
      result.accuracy = successfulAgents.length / agentResults.length;
      
      // Send coordination summary notification
      await this.sendCoordinationSummary(eventData, agentResults);
      
      return result;
      
    } catch (error) {
      console.error(`[SupervisorAgent] Action error:`, error);
      return {
        success: false,
        error: error.message,
        stationId: eventData.stationId
      };
    }
  }

  // VERIFY: Check coordination effectiveness
  async verify(actionResult, eventData) {
    try {
      const agentResults = actionResult.impact?.agentResults || [];
      const successRate = actionResult.accuracy || 0;
      
      let success = true;
      let reason = 'Agent coordination completed successfully';
      let effectivenessScore = successRate;
      
      // Check if critical agents succeeded
      const criticalAgents = ['mechanic', 'auditor'];
      const criticalFailures = agentResults.filter(r => 
        criticalAgents.includes(r.agent) && !r.success
      );
      
      if (criticalFailures.length > 0) {
        success = false;
        reason = `Critical agent failures: ${criticalFailures.map(f => f.agent).join(', ')}`;
        effectivenessScore = 0.3;
      } else if (successRate < 0.5) {
        success = false;
        reason = `Low coordination success rate: ${(successRate * 100).toFixed(1)}%`;
        effectivenessScore = successRate;
      } else {
        reason = `Coordination successful: ${(successRate * 100).toFixed(1)}% agent success rate`;
      }
      
      return {
        success,
        reason,
        metrics: {
          responseTime: actionResult.responseTime,
          accuracy: successRate,
          effectivenessScore,
          coordinationQuality: effectivenessScore
        }
      };
      
    } catch (error) {
      console.error(`[SupervisorAgent] Verification error:`, error);
      return {
        success: false,
        reason: `Verification failed: ${error.message}`
      };
    }
  }

  // Helper methods
  async getAgentDetections(eventData) {
    await this.loadAgents(); // Ensure agents are loaded
    const detections = [];
    
    for (const [agentName, agent] of Object.entries(this.agents)) {
      try {
        const detection = await agent.detect(eventData);
        detections.push({
          agent: agentName,
          ...detection
        });
      } catch (error) {
        console.error(`❌ [SupervisorAgent] ${agentName} detection failed:`, error);
        detections.push({
          agent: agentName,
          shouldProcess: false,
          reason: `Detection failed: ${error.message}`
        });
      }
    }
    
    return detections;
  }

  async createExecutionPlan(interestedAgents, eventData) {
    // Sort agents by priority
    const sortedAgents = interestedAgents.sort((a, b) => 
      this.agentPriorities[b.agent] - this.agentPriorities[a.agent]
    );
    
    // Check for conflicts and resolve them
    const executionPlan = [];
    const conflictGroups = this.identifyConflicts(sortedAgents);
    
    for (const group of conflictGroups) {
      if (group.length === 1) {
        // No conflict, add to plan
        executionPlan.push({
          agent: group[0].agent,
          priority: this.agentPriorities[group[0].agent],
          reason: group[0].reason
        });
      } else {
        // Resolve conflict
        const winner = this.resolveConflict(group);
        executionPlan.push({
          agent: winner.agent,
          priority: this.agentPriorities[winner.agent],
          reason: winner.reason,
          conflictResolution: `Won conflict against: ${group.filter(g => g.agent !== winner.agent).map(g => g.agent).join(', ')}`
        });
      }
    }
    
    return executionPlan;
  }

  identifyConflicts(agents) {
    // For now, assume all agents can run in parallel
    // In a real system, you'd identify actual conflicts based on resources or actions
    return agents.map(agent => [agent]);
  }

  resolveConflict(conflictingAgents) {
    // Use priority-based resolution
    return conflictingAgents.reduce((winner, current) => 
      this.agentPriorities[current.agent] > this.agentPriorities[winner.agent] ? current : winner
    );
  }

  calculateOverallImpact(executionPlan) {
    // Estimate combined impact of all planned agents
    return {
      costImpact: -100 * executionPlan.length, // Estimated cost per agent
      revenueImpact: 200 * executionPlan.length, // Estimated revenue per agent
      successRate: 0.85, // Conservative estimate
      userSatisfaction: 0.8,
      riskScore: Math.min(0.3 + (executionPlan.length * 0.1), 0.8)
    };
  }

  calculateOverallRisk(executionPlan) {
    // Calculate combined risk of all planned agents
    const baseRisk = 0.2;
    const agentRisk = executionPlan.length * 0.05; // Each agent adds 5% risk
    const priorityRisk = executionPlan.some(p => p.priority >= 4) ? 0.1 : 0; // High priority agents add risk
    
    return Math.min(baseRisk + agentRisk + priorityRisk, 0.9);
  }

  determinePriority(executionPlan) {
    const maxPriority = Math.max(...executionPlan.map(p => p.priority));
    
    if (maxPriority >= 5) return 'urgent';
    if (maxPriority >= 4) return 'high';
    if (maxPriority >= 2) return 'medium';
    return 'low';
  }

  updateAgentPerformance(agentName, result) {
    const current = this.agentPerformance.get(agentName) || {
      totalExecutions: 0,
      successfulExecutions: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      successRate: 0
    };
    
    current.totalExecutions++;
    if (result.success) current.successfulExecutions++;
    current.totalExecutionTime += result.executionTime || 0;
    current.averageExecutionTime = current.totalExecutionTime / current.totalExecutions;
    current.successRate = current.successfulExecutions / current.totalExecutions;
    
    this.agentPerformance.set(agentName, current);
  }

  async sendCoordinationSummary(eventData, agentResults) {
    try {
      await decisionEngine({
        eventType: 'AGENT_COORDINATION',
        payload: {
          stationId: eventData.stationId,
          agentType: 'supervisor',
          totalAgents: agentResults.length,
          successfulAgents: agentResults.filter(r => r.success).length,
          failedAgents: agentResults.filter(r => !r.success).length,
          actions: agentResults.map(r => `${r.agent}:${r.action}`).join(', '),
          coordinationTime: agentResults.reduce((sum, r) => sum + r.executionTime, 0)
        },
        context: {
          source: 'supervisor_agent',
          originalEvent: eventData,
          agentResults
        },
        io: this.io
      });
    } catch (error) {
      console.error(`[SupervisorAgent] Coordination summary failed:`, error);
    }
  }

  // 📊 Get supervisor statistics
  getCoordinationStats() {
    const activeSessions = Array.from(this.activeAgentSessions.values());
    const completedSessions = activeSessions.filter(s => s.status === 'completed');
    const failedSessions = activeSessions.filter(s => s.status === 'failed');
    
    return {
      activeSessions: activeSessions.filter(s => s.status === 'running').length,
      completedSessions: completedSessions.length,
      failedSessions: failedSessions.length,
      totalSessions: activeSessions.length,
      successRate: activeSessions.length > 0 ? 
        (completedSessions.length / activeSessions.length * 100).toFixed(2) + '%' : '0%',
      agentPerformance: Object.fromEntries(this.agentPerformance),
      averageCoordinationTime: completedSessions.length > 0 ?
        completedSessions.reduce((sum, s) => sum + (s.endTime - s.startTime), 0) / completedSessions.length : 0
    };
  }

  // Set IO reference for notifications
  setIO(io) {
    this.io = io;
  }
}

// Create singleton instance
const supervisorAgent = new SupervisorAgent();

export default supervisorAgent;