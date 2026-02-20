"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Brain, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Hash,
  ExternalLink,
  Zap,
  RefreshCw,
  Filter,
  Search,
  Eye,
  Verified,
  AlertCircle,
  DollarSign,
  Timer,
  Gauge,
  Copy,
  ChevronDown,
  ChevronUp,
  Database,
  Link
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DecisionStatsCards } from "./decision-stats-cards";

interface Decision {
  decisionId: string;
  timestamp: string;
  agent: string;
  action: string;
  stationId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  confidenceScore: number;
  riskScore: number;
  explanation?: string;
  auditHash?: string;
  blockchainTx?: string;
  blockNumber?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  explanationGenerated?: boolean;
  impact: {
    costImpact: number;
    revenueImpact: number;
    successRate: number;
    userSatisfaction: number;
  };
  mlMetrics: {
    confidenceScore: number;
    executionTime: number;
    modelVersion: string;
  };
  auditResults?: {
    anomalyDetected: boolean;
    complianceViolation: boolean;
    auditScore: number;
    riskAssessment: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface DecisionStats {
  totalDecisions: number;
  agentBreakdown: Record<string, number>;
  avgConfidence: number;
  avgRiskScore: number;
  totalCostImpact: number;
  totalRevenueImpact: number;
  explanationsGenerated: number;
  blockchainAudited: number;
  explanationRate: number;
  blockchainRate: number;
  timeRange: string;
}

export function DashboardDecisions() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [filteredDecisions, setFilteredDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState<DecisionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("live");
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch decisions from API
  const fetchDecisions = useCallback(async () => {
    try {
      const response = await fetch('/api/decisions?limit=20', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setDecisions(result.data.decisions);
        }
      } else {
        // Use mock data if API fails
        setDecisions(getMockDecisions());
      }
    } catch (error) {
      console.error('Error fetching decisions:', error);
      // Use mock data as fallback
      setDecisions(getMockDecisions());
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/decisions/stats/overview?timeRange=1h', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStats(result.data);
        }
      } else {
        // Use mock stats if API fails
        setStats(getMockStats());
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Use mock stats as fallback
      setStats(getMockStats());
    }
  }, []);

  // Mock data for demonstration
  const getMockDecisions = (): Decision[] => [
    {
      decisionId: "DEC_000001",
      timestamp: new Date().toISOString(),
      agent: "MechanicAgent",
      action: "FAILURE_DETECTED",
      stationId: "ST001",
      status: "completed",
      confidenceScore: 0.95,
      riskScore: 0.8,
      explanation: "Critical hardware failure detected in charging port 2. Voltage irregularities and temperature spikes indicate immediate maintenance required to prevent safety hazards and service disruption.",
      auditHash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
      blockchainTx: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
      blockNumber: 12345678,
      priority: "high",
      explanationGenerated: true,
      impact: {
        costImpact: -500,
        revenueImpact: 0,
        successRate: 0.92,
        userSatisfaction: 0.8
      },
      mlMetrics: {
        confidenceScore: 0.95,
        executionTime: 1250,
        modelVersion: "1.2.0"
      },
      auditResults: {
        anomalyDetected: false,
        complianceViolation: false,
        auditScore: 0.94,
        riskAssessment: "medium"
      }
    },
    {
      decisionId: "DEC_000002",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      agent: "TrafficAgent",
      action: "INCENTIVE_OFFERED",
      stationId: "ST002",
      status: "in_progress",
      confidenceScore: 0.87,
      riskScore: 0.3,
      explanation: "High congestion detected at Station ST002. Offering ₹50 incentive to redirect users to nearby Station ST007 with 5-minute walk distance. Expected to reduce wait times by 60%.",
      auditHash: "0x2b3c4d5e6f7890ab1234567890abcdef1234567890abcdef1234567890abcdef",
      blockchainTx: "0xbcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc",
      blockNumber: 12345679,
      priority: "medium",
      explanationGenerated: true,
      impact: {
        costImpact: -50,
        revenueImpact: 200,
        successRate: 0.78,
        userSatisfaction: 0.85
      },
      mlMetrics: {
        confidenceScore: 0.87,
        executionTime: 890,
        modelVersion: "1.1.5"
      },
      auditResults: {
        anomalyDetected: false,
        complianceViolation: false,
        auditScore: 0.89,
        riskAssessment: "low"
      }
    },
    {
      decisionId: "DEC_000003",
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      agent: "EnergyAgent",
      action: "GRID_OPTIMIZATION",
      stationId: "ST003",
      status: "completed",
      confidenceScore: 0.91,
      riskScore: 0.2,
      explanation: "Grid prices favorable for energy trading. Solar generation surplus of 150kWh available for sale back to grid at ₹8.5/kWh. Expected revenue: ₹1,275 with minimal risk.",
      auditHash: "0x3c4d5e6f7890ab1234567890abcdef1234567890abcdef1234567890abcdef12",
      blockchainTx: "0xcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
      blockNumber: 12345680,
      priority: "low",
      explanationGenerated: true,
      impact: {
        costImpact: -25,
        revenueImpact: 1275,
        successRate: 0.88,
        userSatisfaction: 0.9
      },
      mlMetrics: {
        confidenceScore: 0.91,
        executionTime: 1100,
        modelVersion: "1.3.0"
      },
      auditResults: {
        anomalyDetected: false,
        complianceViolation: false,
        auditScore: 0.91,
        riskAssessment: "low"
      }
    }
  ];

  const getMockStats = (): DecisionStats => ({
    totalDecisions: 247,
    agentBreakdown: {
      MechanicAgent: 45,
      TrafficAgent: 89,
      LogisticsAgent: 67,
      EnergyAgent: 34,
      AuditorAgent: 12
    },
    avgConfidence: 0.87,
    avgRiskScore: 0.35,
    totalCostImpact: -2450,
    totalRevenueImpact: 8750,
    explanationsGenerated: 235,
    blockchainAudited: 241,
    explanationRate: 95,
    blockchainRate: 98,
    timeRange: "1h"
  });

  // Show notification helper
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDecisions(), fetchStats()]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchDecisions, fetchStats]);

  // Filter decisions
  useEffect(() => {
    let filtered = decisions;

    if (searchTerm) {
      filtered = filtered.filter(decision => 
        decision.decisionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        decision.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        decision.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        decision.stationId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterAgent !== "all") {
      filtered = filtered.filter(decision => decision.agent === filterAgent);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(decision => decision.status === filterStatus);
    }

    setFilteredDecisions(filtered);
  }, [decisions, searchTerm, filterAgent, filterStatus]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'MechanicAgent': return <Shield className="h-5 w-5 text-red-500" />;
      case 'TrafficAgent': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'LogisticsAgent': return <Activity className="h-5 w-5 text-green-500" />;
      case 'EnergyAgent': return <Zap className="h-5 w-5 text-yellow-500" />;
      case 'AuditorAgent': return <Brain className="h-5 w-5 text-purple-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card>
          <CardContent className="flex items-center justify-center py-24">
            <div className="text-center space-y-4">
              <div className="relative">
                <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Loading Decision Analytics</h3>
                <p className="text-gray-600 dark:text-gray-400">Fetching real-time data from AI agents...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Notification */}
      {notification && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 px-6 py-4 rounded-xl relative backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="font-medium">{notification}</span>
          </div>
          <button
            className="absolute top-4 right-4 text-blue-600 hover:text-blue-800 transition-colors"
            onClick={() => setNotification(null)}
          >
            <span className="sr-only">Dismiss</span>
            ×
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Decision Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Real-time monitoring of autonomous agent decisions with blockchain verification
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchDecisions();
            fetchStats();
            showNotification('Data refreshed successfully!');
          }}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Enhanced Stats Overview */}
      <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Decision Overview</CardTitle>
          <CardDescription>
            Key metrics and performance indicators for AI decision making
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DecisionStatsCards 
            stats={stats} 
            loading={loading}
            disableAnimations={false}
          />
        </CardContent>
      </Card>

      {/* Enhanced Tabs for Live vs History */}
      <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Decision Monitoring
          </CardTitle>
          <CardDescription>
            Live decision tracking and blockchain audit trail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="live" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Live Decisions
              </TabsTrigger>
              <TabsTrigger value="blockchain" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Blockchain Audit
              </TabsTrigger>
            </TabsList>

        <TabsContent value="live" className="space-y-6 mt-6">
          {/* Enhanced Filters */}
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search decisions, agents, stations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterAgent} onValueChange={setFilterAgent}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    <SelectItem value="MechanicAgent">🔧 Mechanic Agent</SelectItem>
                    <SelectItem value="TrafficAgent">🚦 Traffic Agent</SelectItem>
                    <SelectItem value="LogisticsAgent">📦 Logistics Agent</SelectItem>
                    <SelectItem value="EnergyAgent">⚡ Energy Agent</SelectItem>
                    <SelectItem value="AuditorAgent">🛡️ Auditor Agent</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="in_progress">🔄 In Progress</SelectItem>
                    <SelectItem value="completed">✅ Completed</SelectItem>
                    <SelectItem value="failed">❌ Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Decisions List */}
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Decisions</span>
                <span className="text-sm font-normal text-gray-500">
                  {filteredDecisions.length} of {decisions.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDecisions.length === 0 ? (
                  <div className="text-center py-12">
                    {searchTerm || filterAgent !== "all" || filterStatus !== "all" ? (
                      <>
                        <Filter className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold mb-2">No decisions match your filters</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Try adjusting your filter settings
                        </p>
                      </>
                    ) : (
                      <>
                        <Activity className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold mb-2">No decisions found</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Waiting for agent decisions...
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  filteredDecisions.map((decision) => (
                <Card key={decision.decisionId} className="overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getAgentIcon(decision.agent)}
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {decision.decisionId}
                            {decision.priority && (
                              <Badge className={`${getPriorityColor(decision.priority)} text-xs px-2 py-0.5`}>
                                {decision.priority.toUpperCase()}
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span>{decision.agent}</span>
                            <span>•</span>
                            <span>{decision.stationId}</span>
                            <span>•</span>
                            <span>{formatTimestamp(decision.timestamp)}</span>
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(decision.status)}>
                          {getStatusIcon(decision.status)}
                          <span className="ml-1 capitalize">{decision.status}</span>
                        </Badge>
                        
                        {decision.blockchainTx && (
                          <Verified className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Action & Explanation */}
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Action: {decision.action}
                      </h4>
                      {decision.explanation && (
                        <div className="relative">
                          <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                            {decision.explanation}
                          </p>
                          {decision.explanationGenerated && (
                            <div className="absolute top-2 right-2">
                              <Brain className="h-4 w-4 text-blue-500" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Gauge className="h-4 w-4 text-blue-600" />
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(decision.confidenceScore * 100)}%
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Confidence</div>
                      </div>
                      
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <AlertTriangle className="h-4 w-4 text-gray-600" />
                          <div className={`text-2xl font-bold ${decision.riskScore >= 0.7 ? 'text-red-600' : decision.riskScore >= 0.4 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {Math.round(decision.riskScore * 100)}%
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Risk Score</div>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(decision.impact.revenueImpact)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Revenue Impact</div>
                      </div>
                      
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Timer className="h-4 w-4 text-purple-600" />
                          <div className="text-2xl font-bold text-purple-600">
                            {decision.mlMetrics.executionTime}ms
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Execution Time</div>
                      </div>
                    </div>

                    {/* Expandable Blockchain Section */}
                    {(decision.auditHash || decision.blockchainTx) && (
                      <div className="border-t pt-4">
                        <Button
                          variant="ghost"
                          onClick={() => setExpandedDecision(
                            expandedDecision === decision.decisionId ? null : decision.decisionId
                          )}
                          className="w-full justify-between p-0 h-auto font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Blockchain Audit Trail
                            <Badge variant="outline" className="text-xs">
                              Verified
                            </Badge>
                          </div>
                          {expandedDecision === decision.decisionId ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </Button>
                        
                        {expandedDecision === decision.decisionId && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {decision.auditHash && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Hash className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">Audit Hash:</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono break-all">
                                      {decision.auditHash}
                                    </code>
                                    <Button variant="outline" size="sm">
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              {decision.blockchainTx && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <ExternalLink className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">Transaction:</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono break-all">
                                      {decision.blockchainTx.substring(0, 20)}...
                                    </code>
                                    <Button variant="outline" size="sm">
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  {decision.blockNumber && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      Block: #{decision.blockNumber.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {decision.auditResults && (
                              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Audit Results</span>
                                  <Badge variant={decision.auditResults.complianceViolation ? "destructive" : "default"}>
                                    {decision.auditResults.complianceViolation ? "Non-Compliant" : "Compliant"}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Audit Score:</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Progress 
                                        value={decision.auditResults.auditScore * 100} 
                                        className="flex-1 h-2"
                                      />
                                      <span className="font-medium">
                                        {Math.round(decision.auditResults.auditScore * 100)}%
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Risk Assessment:</span>
                                    <div className="mt-1">
                                      <Badge variant={
                                        decision.auditResults.riskAssessment === 'high' ? 'destructive' :
                                        decision.auditResults.riskAssessment === 'medium' ? 'secondary' : 'default'
                                      }>
                                        {decision.auditResults.riskAssessment.toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blockchain" className="space-y-6 mt-6">
          {/* Blockchain Verification Progress */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Verification Progress</CardTitle>
                <CardDescription>
                  Overall progress of blockchain verification for all decisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Verification Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.blockchainAudited} / {stats.totalDecisions}
                    </span>
                  </div>
                  <Progress value={stats.blockchainRate} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>{stats.blockchainRate}% Complete</span>
                    <span>100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Blockchain Audits */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Blockchain Audits</CardTitle>
              <CardDescription>
                Latest blockchain verification results for decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {decisions.filter(d => d.blockchainTx).map((decision) => (
                  <div
                    key={decision.decisionId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Verified className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="font-semibold">{decision.decisionId}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatTimestamp(decision.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">Verified</div>
                        {decision.blockNumber && (
                          <div className="text-xs text-muted-foreground">
                            Block #{decision.blockNumber}
                          </div>
                        )}
                      </div>
                      
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}