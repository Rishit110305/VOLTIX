import BaseAgent from "./BaseAgent.js";
import blockchainService from "../services/blockchainService.js";
import DecisionLog from "../models/DecisionLog.js";
import { decisionEngine } from "../services/notificationDispatch.js";

class AuditorAgent extends BaseAgent {
  constructor() {
    super("AuditorAgent");
    
    // Auditor-specific configuration
    this.config = {
      ...this.config,
      requiresSupervisorApproval: false, // Auditor doesn't need approval
      escalationThreshold: 0.9, // Very high threshold
      confidenceThreshold: 0.95 // High confidence required
    };
    
    this.auditRules = {
      // Risk thresholds
      HIGH_RISK_THRESHOLD: 0.8,
      MEDIUM_RISK_THRESHOLD: 0.5,
      
      // Cost impact thresholds
      HIGH_COST_IMPACT: 1000,
      MEDIUM_COST_IMPACT: 500,
      
      // Confidence thresholds
      MIN_CONFIDENCE: 0.7,
      
      // Compliance rules
      REQUIRED_FIELDS: ['agent', 'action', 'stationId', 'timestamp', 'mlMetrics', 'impact'],
      MAX_EXECUTION_TIME: 30000, // 30 seconds
      
      // SLA thresholds
      MAX_RESPONSE_TIME: 5000, // 5 seconds
      MIN_SUCCESS_RATE: 0.95
    };
  }

  // DETECT: Check if this is an audit-worthy event
  async detect(eventData) {
    // Auditor processes all events for compliance monitoring
    return {
      shouldProcess: true,
      reason: 'Auditor monitors all system events for compliance',
      context: {
        eventType: eventData.type,
        requiresAudit: true
      }
    };
  }

  // DECIDE: Determine audit actions needed
  async decide(eventData, context) {
    try {
      // Auditor's main decision is always to audit
      return {
        success: true,
        action: 'audit_system_event',
        confidence: 0.95,
        riskScore: 0.1,
        impact: {
          costImpact: -5, // Small cost for audit processing
          revenueImpact: 0,
          successRate: 0.99,
          userSatisfaction: 0.8,
          riskScore: 0.1
        },
        reasoning: 'Continuous compliance monitoring required',
        priority: 'medium'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ACT: Perform audit activities
  async act(decision, eventData) {
    try {
      const startTime = Date.now();
      
      // Perform system health audit
      const auditResult = await this.performSystemAudit(eventData);
      
      return {
        success: true,
        message: `System audit completed: ${auditResult.checksPerformed} checks, ${auditResult.issuesFound} issues found`,
        stationId: eventData.stationId,
        responseTime: Date.now() - startTime,
        accuracy: 1.0,
        impact: auditResult
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stationId: eventData.stationId
      };
    }
  }

  // VERIFY: Verify audit completion
  async verify(actionResult, eventData) {
    return {
      success: actionResult.success,
      reason: actionResult.success ? 'Audit completed successfully' : 'Audit failed',
      metrics: {
        responseTime: actionResult.responseTime,
        accuracy: actionResult.accuracy || 1.0,
        effectivenessScore: actionResult.success ? 0.95 : 0.1
      }
    };
  }

  // Perform system audit
  async performSystemAudit(eventData) {
    let checksPerformed = 0;
    let issuesFound = 0;
    const issues = [];
    
    // Check 1: Event data integrity
    checksPerformed++;
    if (!eventData.eventId || !eventData.timestamp || !eventData.stationId) {
      issuesFound++;
      issues.push('Missing required event fields');
    }
    
    // Check 2: Timestamp validity
    checksPerformed++;
    const eventTime = new Date(eventData.timestamp);
    const now = new Date();
    if (Math.abs(now - eventTime) > 10 * 60 * 1000) { // 10 minutes tolerance
      issuesFound++;
      issues.push('Event timestamp outside acceptable range');
    }
    
    // Check 3: Station ID format
    checksPerformed++;
    if (eventData.stationId && !/^ST\d{3}$/.test(eventData.stationId)) {
      issuesFound++;
      issues.push('Invalid station ID format');
    }
    
    return {
      checksPerformed,
      issuesFound,
      issues,
      complianceScore: issuesFound === 0 ? 1.0 : Math.max(0, 1 - (issuesFound / checksPerformed))
    };
  }

  // Main audit function - called after every agent decision
  async auditDecision(decisionData, io) {
    try {
      console.log(`Auditing decision: ${decisionData.agent} - ${decisionData.action}`);
      
      // STEP 1: Validate decision data
      const validation = this.validateDecision(decisionData);
      if (!validation.isValid) {
        await this.reportViolation('DATA_VALIDATION_FAILED', decisionData, validation.errors, io);
        return { success: false, errors: validation.errors };
      }
      
      // STEP 2: Analyze decision quality
      const qualityAnalysis = this.analyzeDecisionQuality(decisionData);
      
      // STEP 3: Check compliance
      const complianceCheck = this.checkCompliance(decisionData);
      
      // STEP 4: Assess risk
      const riskAssessment = this.assessRisk(decisionData);
      
      // STEP 5: Write to blockchain
      const auditResult = await blockchainService.auditDecision({
        ...decisionData,
        auditMetrics: {
          quality: qualityAnalysis,
          compliance: complianceCheck,
          risk: riskAssessment
        }
      });
      
      // STEP 6: Check for violations and alerts
      await this.checkViolations(decisionData, qualityAnalysis, complianceCheck, riskAssessment, io);
      
      console.log(`Decision audited successfully: ${auditResult.decisionId}`);
      
      return {
        success: true,
        auditResult,
        analysis: {
          quality: qualityAnalysis,
          compliance: complianceCheck,
          risk: riskAssessment
        }
      };
      
    } catch (error) {
      console.error(`Audit failed:`, error);
      await this.reportViolation('AUDIT_SYSTEM_ERROR', decisionData, [error.message], io);
      throw error;
    }
  }

  // Validate decision data structure and content
  validateDecision(decisionData) {
    const errors = [];
    
    // Check required fields
    for (const field of this.auditRules.REQUIRED_FIELDS) {
      if (!decisionData[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Validate agent name
    const validAgents = ['MechanicAgent', 'TrafficAgent', 'LogisticsAgent', 'EnergyAgent', 'AuditorAgent'];
    if (decisionData.agent && !validAgents.includes(decisionData.agent)) {
      errors.push(`Invalid agent: ${decisionData.agent}`);
    }
    
    // Validate station ID format
    if (decisionData.stationId && !/^ST\d{3}$/.test(decisionData.stationId)) {
      errors.push(`Invalid station ID format: ${decisionData.stationId}`);
    }
    
    // Validate timestamp
    if (decisionData.timestamp) {
      const timestamp = new Date(decisionData.timestamp);
      const now = new Date();
      const timeDiff = Math.abs(now - timestamp);
      
      if (timeDiff > 5 * 60 * 1000) { // 5 minutes tolerance
        errors.push(`Timestamp too old or in future: ${decisionData.timestamp}`);
      }
    }
    
    // Validate ML metrics
    if (decisionData.mlMetrics) {
      if (typeof decisionData.mlMetrics.confidenceScore !== 'number' || 
          decisionData.mlMetrics.confidenceScore < 0 || 
          decisionData.mlMetrics.confidenceScore > 1) {
        errors.push('Invalid confidence score');
      }
      
      if (typeof decisionData.mlMetrics.executionTime !== 'number' || 
          decisionData.mlMetrics.executionTime < 0) {
        errors.push('Invalid execution time');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Analyze decision quality
  analyzeDecisionQuality(decisionData) {
    const quality = {
      score: 0,
      factors: {},
      grade: 'F'
    };
    
    // Confidence score factor (40% weight)
    const confidence = decisionData.mlMetrics?.confidenceScore || 0;
    quality.factors.confidence = {
      score: confidence,
      weight: 0.4,
      status: confidence >= this.auditRules.MIN_CONFIDENCE ? 'PASS' : 'FAIL'
    };
    
    // Execution time factor (20% weight)
    const executionTime = decisionData.mlMetrics?.executionTime || 0;
    const timeScore = Math.max(0, 1 - (executionTime / this.auditRules.MAX_EXECUTION_TIME));
    quality.factors.executionTime = {
      score: timeScore,
      weight: 0.2,
      status: executionTime <= this.auditRules.MAX_EXECUTION_TIME ? 'PASS' : 'FAIL'
    };
    
    // Impact assessment factor (30% weight)
    const successRate = decisionData.impact?.successRate || 0;
    quality.factors.impact = {
      score: successRate,
      weight: 0.3,
      status: successRate >= this.auditRules.MIN_SUCCESS_RATE ? 'PASS' : 'FAIL'
    };
    
    // Data completeness factor (10% weight)
    const completeness = this.calculateCompleteness(decisionData);
    quality.factors.completeness = {
      score: completeness,
      weight: 0.1,
      status: completeness >= 0.8 ? 'PASS' : 'FAIL'
    };
    
    // Calculate overall score
    quality.score = Object.values(quality.factors).reduce((sum, factor) => {
      return sum + (factor.score * factor.weight);
    }, 0);
    
    // Assign grade
    if (quality.score >= 0.9) quality.grade = 'A';
    else if (quality.score >= 0.8) quality.grade = 'B';
    else if (quality.score >= 0.7) quality.grade = 'C';
    else if (quality.score >= 0.6) quality.grade = 'D';
    else quality.grade = 'F';
    
    return quality;
  }

  // Check compliance with rules and regulations
  checkCompliance(decisionData) {
    const compliance = {
      status: 'COMPLIANT',
      violations: [],
      checks: {}
    };
    
    // Check 1: Risk threshold compliance
    const riskScore = decisionData.impact?.riskScore || 0;
    compliance.checks.riskThreshold = {
      status: riskScore <= this.auditRules.HIGH_RISK_THRESHOLD ? 'PASS' : 'FAIL',
      value: riskScore,
      threshold: this.auditRules.HIGH_RISK_THRESHOLD
    };
    
    if (riskScore > this.auditRules.HIGH_RISK_THRESHOLD) {
      compliance.violations.push('HIGH_RISK_DECISION');
    }
    
    // Check 2: Cost impact compliance
    const costImpact = Math.abs(decisionData.impact?.costImpact || 0);
    compliance.checks.costImpact = {
      status: costImpact <= this.auditRules.HIGH_COST_IMPACT ? 'PASS' : 'FAIL',
      value: costImpact,
      threshold: this.auditRules.HIGH_COST_IMPACT
    };
    
    if (costImpact > this.auditRules.HIGH_COST_IMPACT) {
      compliance.violations.push('HIGH_COST_IMPACT');
    }
    
    // Check 3: Confidence threshold compliance
    const confidence = decisionData.mlMetrics?.confidenceScore || 0;
    compliance.checks.confidence = {
      status: confidence >= this.auditRules.MIN_CONFIDENCE ? 'PASS' : 'FAIL',
      value: confidence,
      threshold: this.auditRules.MIN_CONFIDENCE
    };
    
    if (confidence < this.auditRules.MIN_CONFIDENCE) {
      compliance.violations.push('LOW_CONFIDENCE_DECISION');
    }
    
    // Check 4: Response time compliance
    const responseTime = decisionData.mlMetrics?.executionTime || 0;
    compliance.checks.responseTime = {
      status: responseTime <= this.auditRules.MAX_RESPONSE_TIME ? 'PASS' : 'FAIL',
      value: responseTime,
      threshold: this.auditRules.MAX_RESPONSE_TIME
    };
    
    if (responseTime > this.auditRules.MAX_RESPONSE_TIME) {
      compliance.violations.push('SLOW_RESPONSE_TIME');
    }
    
    // Overall compliance status
    if (compliance.violations.length > 0) {
      compliance.status = 'NON_COMPLIANT';
    }
    
    return compliance;
  }

  // Assess risk level of the decision
  assessRisk(decisionData) {
    const risk = {
      level: 'LOW',
      score: 0,
      factors: []
    };
    
    // Factor 1: Financial risk
    const costImpact = Math.abs(decisionData.impact?.costImpact || 0);
    if (costImpact > this.auditRules.HIGH_COST_IMPACT) {
      risk.factors.push('HIGH_FINANCIAL_IMPACT');
      risk.score += 0.3;
    }
    
    // Factor 2: Operational risk
    const successRate = decisionData.impact?.successRate || 1;
    if (successRate < this.auditRules.MIN_SUCCESS_RATE) {
      risk.factors.push('LOW_SUCCESS_PROBABILITY');
      risk.score += 0.2;
    }
    
    // Factor 3: Safety risk
    if (decisionData.triggerEvent === 'emergency' || 
        decisionData.priority === 'urgent') {
      risk.factors.push('EMERGENCY_SITUATION');
      risk.score += 0.4;
    }
    
    // Factor 4: Confidence risk
    const confidence = decisionData.mlMetrics?.confidenceScore || 0;
    if (confidence < this.auditRules.MIN_CONFIDENCE) {
      risk.factors.push('LOW_CONFIDENCE');
      risk.score += 0.1;
    }
    
    // Determine risk level
    if (risk.score >= this.auditRules.HIGH_RISK_THRESHOLD) {
      risk.level = 'HIGH';
    } else if (risk.score >= this.auditRules.MEDIUM_RISK_THRESHOLD) {
      risk.level = 'MEDIUM';
    }
    
    return risk;
  }

  // Check for violations and send alerts
  async checkViolations(decisionData, quality, compliance, risk, io) {
    const violations = [];
    
    // Quality violations
    if (quality.grade === 'F') {
      violations.push({
        type: 'QUALITY_FAILURE',
        severity: 'high',
        message: `Decision quality grade F (score: ${quality.score.toFixed(2)})`
      });
    }
    
    // Compliance violations
    if (compliance.status === 'NON_COMPLIANT') {
      violations.push({
        type: 'COMPLIANCE_VIOLATION',
        severity: 'critical',
        message: `Compliance violations: ${compliance.violations.join(', ')}`
      });
    }
    
    // Risk violations
    if (risk.level === 'HIGH') {
      violations.push({
        type: 'HIGH_RISK_DECISION',
        severity: 'critical',
        message: `High risk decision (score: ${risk.score.toFixed(2)})`
      });
    }
    
    // Send notifications for violations
    for (const violation of violations) {
      await this.reportViolation(violation.type, decisionData, [violation.message], io);
    }
  }

  // Report violation to notification system
  async reportViolation(violationType, decisionData, errors, io) {
    try {
      await decisionEngine({
        eventType: 'COMPLIANCE_VIOLATION',
        payload: {
          stationId: decisionData.stationId,
          agentType: 'auditor',
          violation: violationType,
          agent: decisionData.agent,
          action: decisionData.action,
          errors: errors,
          severity: 'critical',
          decisionsAnalyzed: 1,
          issuesFound: errors.length
        },
        context: {
          source: 'auditor_agent',
          decisionData
        },
        io
      });
      
      console.log(`[AUDITOR] Violation reported: ${violationType}`);
      
    } catch (error) {
      console.error('[AUDITOR] Failed to report violation:', error);
    }
  }

  // Calculate data completeness score
  calculateCompleteness(decisionData) {
    const totalFields = this.auditRules.REQUIRED_FIELDS.length;
    const presentFields = this.auditRules.REQUIRED_FIELDS.filter(field => 
      decisionData[field] !== undefined && decisionData[field] !== null
    ).length;
    
    return presentFields / totalFields;
  }

  // Generate audit report
  async generateAuditReport(filters = {}) {
    try {
      const searchResult = await blockchainService.searchAuditLogs(filters);
      const stats = await blockchainService.getAuditStats();
      
      if (!searchResult.success || !stats.success) {
        throw new Error('Failed to generate audit report');
      }
      
      const report = {
        summary: {
          totalDecisions: stats.stats.database.totalDecisions,
          blockchainCoverage: stats.stats.database.blockchainCoverage,
          reportPeriod: {
            startDate: filters.startDate || 'All time',
            endDate: filters.endDate || 'Present'
          }
        },
        decisions: searchResult.decisions.map(decision => ({
          decisionId: decision.decisionId,
          agent: decision.agent,
          action: decision.action,
          stationId: decision.stationId,
          timestamp: decision.timestamp,
          auditHash: decision.auditHash,
          blockchainTx: decision.blockchainTx,
          hasBlockchainRecord: !!decision.blockchainTx
        })),
        pagination: searchResult.pagination
      };
      
      return {
        success: true,
        report
      };
      
    } catch (error) {
      console.error('[AUDITOR] Report generation failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const auditorAgent = new AuditorAgent();

export default auditorAgent;