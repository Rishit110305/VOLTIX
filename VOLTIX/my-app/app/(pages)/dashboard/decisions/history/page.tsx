"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  History, 
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
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Download,
  FileText,
  Database
} from "lucide-react";
import { DecisionCard } from "../../../../components/decisions/DecisionCard";
import decisionsService, { Decision, DecisionStats } from "../../../../services/decisionsService";
import { toast } from "sonner";

export default function DecisionHistoryPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [filteredDecisions, setFilteredDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState<DecisionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTimeRange, setFilterTimeRange] = useState("7d");
  const [filterHasBlockchain, setFilterHasBlockchain] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDecisions, setTotalDecisions] = useState(0);
  const [selectedTab, setSelectedTab] = useState("all");

  const pageSize = 20;

  // Fetch decisions from API
  const fetchDecisions = useCallback(async () => {
    try {
      const filters: any = {};
      
      if (filterAgent !== "all") filters.agent = filterAgent;
      if (filterStatus !== "all") filters.status = filterStatus;
      if (filterHasBlockchain !== "all") filters.hasBlockchain = filterHasBlockchain === "true";
      
      // Add time range filter
      if (filterTimeRange !== "all") {
        const now = new Date();
        let startDate: Date;
        
        switch (filterTimeRange) {
          case "1h":
            startDate = new Date(now.getTime() - 60 * 60 * 1000);
            break;
          case "24h":
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case "7d":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "30d":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
        
        filters.startDate = startDate.toISOString();
      }

      const result = await decisionsService.getDecisions(
        filters,
        {
          limit: pageSize,
          skip: (currentPage - 1) * pageSize,
          sortBy: 'timestamp',
          sortOrder: -1
        }
      );

      if (result.success && result.data) {
        setDecisions(result.data.decisions);
        setTotalDecisions(result.data.pagination.total);
        setTotalPages(Math.ceil(result.data.pagination.total / pageSize));
      } else {
        console.error('Failed to fetch decisions:', result.message);
        toast.error('Failed to fetch decisions');
      }
    } catch (error) {
      console.error('Error fetching decisions:', error);
      toast.error('Error fetching decisions');
    }
  }, [filterAgent, filterStatus, filterTimeRange, filterHasBlockchain, currentPage]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const result = await decisionsService.getDecisionStats(filterTimeRange);
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [filterTimeRange]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDecisions(), fetchStats()]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchDecisions, fetchStats]);

  // Filter decisions based on search and selected tab
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

    // Tab-based filtering
    if (selectedTab !== "all") {
      switch (selectedTab) {
        case "successful":
          filtered = filtered.filter(d => d.status === 'completed' && d.impact.successRate >= 0.8);
          break;
        case "failed":
          filtered = filtered.filter(d => d.status === 'failed' || d.impact.successRate < 0.5);
          break;
        case "high-risk":
          filtered = filtered.filter(d => d.riskScore >= 0.7);
          break;
        case "blockchain":
          filtered = filtered.filter(d => d.blockchainTx);
          break;
        case "anomalies":
          filtered = filtered.filter(d => d.auditResults?.anomalyDetected);
          break;
      }
    }

    setFilteredDecisions(filtered);
  }, [decisions, searchTerm, selectedTab]);

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

  // Handle export
  const handleExport = async () => {
    try {
      // This would typically call an export API endpoint
      toast.success('Export started', {
        description: 'Your decision history export will be ready shortly'
      });
    } catch (error) {
      toast.error('Export failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading decision history...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Decision History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete audit trail of AI agent decisions with blockchain verification
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{totalDecisions}</div>
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
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.successRate}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
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
            
            <Select value={filterTimeRange} onValueChange={setFilterTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            
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
              <SelectTrigger className="w-40">
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

            <Select value={filterHasBlockchain} onValueChange={setFilterHasBlockchain}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Blockchain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Decision Categories */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All Decisions</TabsTrigger>
              <TabsTrigger value="successful">Successful</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
              <TabsTrigger value="high-risk">High Risk</TabsTrigger>
              <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
              <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
            </TabsList>
            
            <div className="p-6">
              <TabsContent value={selectedTab} className="mt-0">
                {/* Decisions List */}
                <div className="space-y-4">
                  {filteredDecisions.length === 0 ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold mb-2">No decisions found</h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {searchTerm || filterAgent !== "all" || filterStatus !== "all" 
                              ? "Try adjusting your filters" 
                              : "No decisions match the selected criteria"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {filteredDecisions.map((decision) => (
                        <DecisionCard
                          key={decision.decisionId}
                          decision={decision}
                          onViewDetails={handleViewDetails}
                          onVerifyBlockchain={handleVerifyDecision}
                        />
                      ))}
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalDecisions)} of {totalDecisions} decisions
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </Button>
                            
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1;
                                return (
                                  <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className="w-8 h-8 p-0"
                                  >
                                    {page}
                                  </Button>
                                );
                              })}
                              
                              {totalPages > 5 && (
                                <>
                                  <span className="px-2">...</span>
                                  <Button
                                    variant={currentPage === totalPages ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(totalPages)}
                                    className="w-8 h-8 p-0"
                                  >
                                    {totalPages}
                                  </Button>
                                </>
                              )}
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}