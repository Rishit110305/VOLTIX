"use client";

import { useState, useEffect, useCallback } from "react";
import { useNotificationCenter } from "../../../../context/NotificationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ChevronUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DecisionCard } from "../../../../components/decisions/DecisionCard";
import decisionsService, { Decision, DecisionStats } from "../../../../services/decisionsService";
import { useSocket } from "../../../../hooks/useSocket";
import { toast } from "sonner";

export default function LiveDecisionsPage() {
  const { notifications } = useNotificationCenter();
  const socket = useSocket();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [filteredDecisions, setFilteredDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState<DecisionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch decisions from API
  const fetchDecisions = useCallback(async () => {
    try {
      const result = await decisionsService.getDecisions(
        {
          agent: filterAgent !== "all" ? filterAgent : undefined,
          status: filterStatus !== "all" ? filterStatus : undefined,
        },
        {
          limit: 50,
          sortBy: 'timestamp',
          sortOrder: -1
        }
      );

      if (result.success && result.data) {
        setDecisions(result.data.decisions);
      } else {
        console.error('Failed to fetch decisions:', result.message);
        toast.error('Failed to fetch decisions');
      }
    } catch (error) {
      console.error('Error fetching decisions:', error);
      toast.error('Error fetching decisions');
    }
  }, [filterAgent, filterStatus]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const result = await decisionsService.getDecisionStats('1h');
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDecisions(), fetchStats()]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchDecisions, fetchStats]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchDecisions();
        fetchStats();
      }, 30000); // Refresh every 30 seconds
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, fetchDecisions, fetchStats]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (socket) {
      const handleDecisionLogged = (data: any) => {
        console.log('New decision logged:', data);
        
        // Add new decision to the top of the list
        const newDecision: Decision = {
          decisionId: data.decisionId,
          timestamp: data.timestamp,
          agent: data.agent,
          action: data.action,
          stationId: data.stationId,
          status: 'completed',
          confidenceScore: 0.8,
          riskScore: 0.3,
          explanation: data.explanation,
          blockchainTx: data.blockchainVerified ? 'pending' : undefined,
          impact: data.impact || {
            costImpact: 0,
            revenueImpact: 0,
            successRate: 0.8,
            userSatisfaction: 0.8
          },
          mlMetrics: {
            confidenceScore: 0.8,
            executionTime: 1000,
            modelVersion: '1.0.0'
          }
        };

        setDecisions(prev => [newDecision, ...prev.slice(0, 49)]); // Keep only 50 decisions
        
        // Show toast notification
        toast.success(`New decision: ${data.agent} - ${data.action}`, {
          description: data.explanation?.substring(0, 100) + '...'
        });
      };

      socket.on('decision_logged', handleDecisionLogged);

      return () => {
        socket.off('decision_logged', handleDecisionLogged);
      };
    }
  }, [socket]);

  // Filter decisions based on search and filters
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

  // Handle decision verification
  const handleVerifyDecision = async (decisionId: string) => {
    try {
      const result = await decisionsService.verifyDecision(decisionId);
      if (result.success && result.data) {
        const verification = result.data.verification;
        const integrity = verification.database.integrity && 
                         (verification.blockchain.found ? verification.blockchain.integrity : true);
        
        toast.success(`Decision ${decisionId} verification completed`, {
          description: integrity ? 'Integrity verified ✅' : 'Integrity issues found ⚠️'
        });
      } else {
        toast.error('Verification failed');
      }
    } catch (error) {
      console.error('Error verifying decision:', error);
      toast.error('Error verifying decision');
    }
  };

  // Handle view details
  const handleViewDetails = (decisionId: string) => {
    // In a real app, this would navigate to a detailed view
    console.log('View details for:', decisionId);
    toast.info(`Viewing details for ${decisionId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading live decisions...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Decisions</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time AI agent decisions with blockchain audit trail
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={autoRefresh ? "default" : "secondary"} className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {autoRefresh ? "Live" : "Paused"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Pause" : "Resume"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchDecisions();
              fetchStats();
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalDecisions}</div>
                  <div className="text-sm text-muted-foreground">Total Decisions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.explanationRate}%</div>
                  <div className="text-sm text-muted-foreground">Explained</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.blockchainRate}%</div>
                  <div className="text-sm text-muted-foreground">Blockchain Verified</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{Math.round(stats.avgConfidence * 100)}%</div>
                  <div className="text-sm text-muted-foreground">Avg Confidence</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search decisions, agents, actions..."
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
                <SelectItem value="MechanicAgent">Mechanic Agent</SelectItem>
                <SelectItem value="TrafficAgent">Traffic Agent</SelectItem>
                <SelectItem value="LogisticsAgent">Logistics Agent</SelectItem>
                <SelectItem value="EnergyAgent">Energy Agent</SelectItem>
                <SelectItem value="AuditorAgent">Auditor Agent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Decisions List */}
      <div className="space-y-4">
        {filteredDecisions.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No decisions found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || filterAgent !== "all" || filterStatus !== "all" 
                    ? "Try adjusting your filters" 
                    : "Waiting for agent decisions..."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredDecisions.map((decision) => (
            <DecisionCard
              key={decision.decisionId}
              decision={decision}
              onViewDetails={handleViewDetails}
              onVerifyBlockchain={handleVerifyDecision}
            />
          ))
        )}
      </div>
    </div>
  );
}