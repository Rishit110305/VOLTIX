"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Hash,
  ExternalLink,
  Zap,
  Eye,
  Verified,
  AlertCircle,
  DollarSign,
  Timer,
  Gauge,
  Copy,
  ChevronDown,
  ChevronUp,
  Activity,
  Target,
  Wrench,
  Users,
  Battery,
  BarChart3
} from "lucide-react";
import { Decision } from "../../services/decisionsService";

interface DecisionCardProps {
  decision: Decision;
  onViewDetails: (decisionId: string) => void;
  onVerifyBlockchain: (decisionId: string) => void;
}

export function DecisionCard({ decision, onViewDetails, onVerifyBlockchain }: DecisionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'MechanicAgent': return <Wrench className="h-4 w-4" />;
      case 'TrafficAgent': return <Users className="h-4 w-4" />;
      case 'LogisticsAgent': return <Battery className="h-4 w-4" />;
      case 'EnergyAgent': return <Zap className="h-4 w-4" />;
      case 'AuditorAgent': return <Shield className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'MechanicAgent': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'TrafficAgent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'LogisticsAgent': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'EnergyAgent': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'AuditorAgent': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'in_progress': return <Activity className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'failed': return <AlertTriangle className="h-3 w-3" />;
      case 'cancelled': return <AlertCircle className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 0.7) return 'text-red-600';
    if (riskScore >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleVerifyBlockchain = async () => {
    setIsVerifying(true);
    try {
      await onVerifyBlockchain(decision.decisionId);
    } finally {
      setIsVerifying(false);
    }
  };

  const { date, time } = formatTimestamp(decision.timestamp);

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Badge className={getAgentColor(decision.agent)}>
              {getAgentIcon(decision.agent)}
              <span className="ml-1">{decision.agent}</span>
            </Badge>
            <Badge className={getStatusColor(decision.status)}>
              {getStatusIcon(decision.status)}
              <span className="ml-1 capitalize">{decision.status}</span>
            </Badge>
          </div>
          
          <div className="text-right text-sm text-gray-500">
            <div>{date}</div>
            <div>{time}</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            {decision.action}
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span>Station: {decision.stationId}</span>
            <span>•</span>
            <span>ID: {decision.decisionId}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(decision.decisionId)}
              className="h-4 w-4 p-0 ml-1"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className={`text-lg font-bold ${getConfidenceColor(decision.confidenceScore)}`}>
              {Math.round(decision.confidenceScore * 100)}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Confidence</div>
          </div>
          
          <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className={`text-lg font-bold ${getRiskColor(decision.riskScore)}`}>
              {Math.round(decision.riskScore * 100)}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Risk</div>
          </div>
          
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {Math.round(decision.impact.successRate * 100)}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Success</div>
          </div>
          
          <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-lg font-bold text-purple-600">
              {decision.mlMetrics.executionTime}ms
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Exec Time</div>
          </div>
        </div>

        {/* Explanation */}
        {decision.explanation && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">AI Explanation</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {isExpanded ? decision.explanation : `${decision.explanation.substring(0, 150)}...`}
            </p>
            {decision.explanation.length > 150 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 h-6 text-xs"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show More
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Blockchain Status */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Blockchain Audit</span>
            {decision.blockchainTx ? (
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <Verified className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>
          
          {decision.auditHash && (
            <div className="flex items-center gap-2">
              <Hash className="h-3 w-3 text-gray-500" />
              <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded">
                {decision.auditHash.substring(0, 8)}...
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(decision.auditHash!)}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Impact Metrics */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Impact Analysis
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cost Impact:</span>
                  <span className={decision.impact.costImpact < 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(decision.impact.costImpact)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Revenue Impact:</span>
                  <span className={decision.impact.revenueImpact > 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(decision.impact.revenueImpact)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>User Satisfaction:</span>
                  <span className="font-medium">
                    {Math.round(decision.impact.userSatisfaction * 100)}%
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Model Version:</span>
                  <span className="font-medium">{decision.mlMetrics.modelVersion}</span>
                </div>
              </div>
            </div>

            {/* Audit Results */}
            {decision.auditResults && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Audit Results</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Anomaly Detected:</span>
                    <Badge variant={decision.auditResults.anomalyDetected ? "destructive" : "default"}>
                      {decision.auditResults.anomalyDetected ? "Yes" : "No"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Compliance:</span>
                    <Badge variant={decision.auditResults.complianceViolation ? "destructive" : "default"}>
                      {decision.auditResults.complianceViolation ? "Violation" : "Compliant"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Audit Score:</span>
                    <span className="font-medium">
                      {Math.round(decision.auditResults.auditScore * 100)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Risk Assessment:</span>
                    <Badge className={
                      decision.auditResults.riskAssessment === 'critical' ? 'bg-red-100 text-red-800' :
                      decision.auditResults.riskAssessment === 'high' ? 'bg-orange-100 text-orange-800' :
                      decision.auditResults.riskAssessment === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {decision.auditResults.riskAssessment.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(decision.decisionId)}
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              Details
            </Button>
            
            {decision.blockchainTx && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerifyBlockchain}
                disabled={isVerifying}
                className="flex items-center gap-1"
              >
                {isVerifying ? (
                  <Activity className="h-3 w-3 animate-spin" />
                ) : (
                  <Verified className="h-3 w-3" />
                )}
                Verify
              </Button>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Expand
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}