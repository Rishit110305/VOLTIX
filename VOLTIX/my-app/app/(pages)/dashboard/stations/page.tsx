"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  MapPin, 
  Battery, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Gauge,
  Thermometer,
  Wifi,
  WifiOff
} from "lucide-react";
import StationDetails from "../../../components/station-details";
import { connectSocket, getSocket } from "../../../config/socket";

interface Station {
  id: string;
  name: string;
  city: string;
  type: string;
  capacity: number;
  maxInventory: number;
  latitude: number;
  longitude: number;
  isHighway: boolean;
  isMall: boolean;
  isOffice: boolean;
  installationDate: string;
  operator: string;
  status: 'operational' | 'busy' | 'maintenance' | 'error' | 'offline';
  health: {
    uptime: number;
    activeChargers: number;
    totalChargers: number;
    faultCount1h: number;
    faultCount24h: number;
    mtbf: number;
    temperature: number;
    lastMaintenance: string;
  };
  demand: {
    swapRequestsPerMin: number;
    queueLength: number;
    avgWaitTime: number;
    surgeFactor: number;
    peakHourMultiplier: number;
    predictedCongestion: 'low' | 'medium' | 'high';
  };
  inventory: {
    chargedBatteries: number;
    unchargedBatteries: number;
    totalBatteries: number;
    maxCapacity: number;
    chargedRatio: number;
    swapToChargeImbalance: number;
    predictedStockout: number | null;
  };
  errors: {
    recentErrors: Array<{
      code: string;
      message: string;
      timestamp: string;
      severity: 'low' | 'medium' | 'high';
      resolved: boolean;
    }>;
    recurringFaults: number;
    lastResolvedIncident: string;
  };
}

interface SystemOverview {
  totalStations: number;
  statusBreakdown: {
    operational: number;
    busy: number;
    maintenance: number;
    error: number;
    offline: number;
  };
  avgMetrics: {
    uptime: number;
    queueLength: number;
    chargedRatio: number;
    waitTime: number;
  };
  alerts: {
    criticalErrors: number;
    stockoutWarnings: number;
    congestionAlerts: number;
    maintenanceRequired: number;
  };
}

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [systemOverview, setSystemOverview] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCity, setFilterCity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // Fetch stations data
  const fetchStations = async () => {
    try {
      const response = await fetch('/api/stations', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStations(result.data.stations);
          setLastUpdate(new Date());
          setIsConnected(true);
        }
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      setIsConnected(false);
    }
  };

  // Fetch system overview
  const fetchSystemOverview = async () => {
    try {
      const response = await fetch('/api/stations/overview/system', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSystemOverview(result.data.overview);
        }
      }
    } catch (error) {
      console.error('Error fetching system overview:', error);
    }
  };

  // Socket connection and real-time updates
  useEffect(() => {
    const socket = connectSocket();
    
    // Join system overview room for real-time updates
    socket.emit('join-system-overview');
    
    // Listen for station list updates
    socket.on('stations-list-update', (data) => {
      if (data.stations) {
        setStations(data.stations);
        setLastUpdate(new Date());
        setIsConnected(true);
      }
    });
    
    // Listen for system overview updates
    socket.on('system-overview-update', (data) => {
      if (data.overview) {
        setSystemOverview(data.overview);
      }
    });
    
    // Listen for station alerts
    socket.on('station-alerts', (data) => {
      console.log('Station alerts received:', data.alerts);
    });
    
    // Handle connection status
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to station updates');
    });
    
    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from station updates');
    });
    
    return () => {
      socket.emit('leave-system-overview');
      socket.off('stations-list-update');
      socket.off('system-overview-update');
      socket.off('station-alerts');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStations(), fetchSystemOverview()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Filter stations
  useEffect(() => {
    let filtered = stations;

    if (searchQuery) {
      filtered = filtered.filter(station => 
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.operator.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCity !== "all") {
      filtered = filtered.filter(station => station.city === filterCity);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(station => station.status === filterStatus);
    }

    setFilteredStations(filtered);
  }, [stations, searchQuery, filterCity, filterStatus]);

  // Get unique cities
  const cities = [...new Set(stations.map(station => station.city))];

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'busy': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'maintenance': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'offline': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4" />;
      case 'busy': return <Users className="h-4 w-4" />;
      case 'maintenance': return <Clock className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'offline': return <WifiOff className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card>
          <CardContent className="flex items-center justify-center py-24">
            <div className="text-center space-y-4">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Loading EV Copilot</h3>
                <p className="text-gray-600 dark:text-gray-400">Connecting to station network...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">EV Copilot - Station Network</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Real-time monitoring and AI-powered management of EV charging stations
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-red-600">Disconnected</span>
              </>
            )}
          </div>
          
          {lastUpdate && (
            <div className="text-sm text-gray-500">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStations();
              fetchSystemOverview();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      {systemOverview && (
        <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>
              Real-time status of the entire EV charging network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{systemOverview.totalStations}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Stations</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{systemOverview.statusBreakdown.operational}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Operational</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{systemOverview.statusBreakdown.busy}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Busy</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{systemOverview.alerts.criticalErrors}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Critical Alerts</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{systemOverview.avgMetrics.uptime.toFixed(1)}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Uptime</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{systemOverview.avgMetrics.chargedRatio.toFixed(1)}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Battery Level</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-400px)]">
        {/* Left Panel - Station List */}
        <div className="lg:col-span-1">
          <Card className="h-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Stations ({filteredStations.length})
              </CardTitle>
              
              {/* Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search stations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={filterCity} onValueChange={setFilterCity}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="All Cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="h-[calc(100vh-600px)] overflow-y-auto">
                {filteredStations.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">No stations found</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Try adjusting your search or filters
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {filteredStations.map((station) => (
                      <div
                        key={station.id}
                        onClick={() => setSelectedStation(station)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          selectedStation?.id === station.id 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-sm">{station.name}</h3>
                            <p className="text-xs text-gray-500">{station.id}</p>
                          </div>
                          <Badge className={getStatusColor(station.status)}>
                            {getStatusIcon(station.status)}
                            <span className="ml-1 capitalize">{station.status}</span>
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Queue:</span>
                            <span className={`font-medium ${station.demand.queueLength > 5 ? 'text-red-600' : 'text-green-600'}`}>
                              {station.demand.queueLength} vehicles
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Batteries:</span>
                            <span className={`font-medium ${station.inventory.chargedRatio < 20 ? 'text-red-600' : 'text-green-600'}`}>
                              {station.inventory.chargedBatteries}/{station.inventory.maxCapacity}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
                            <span className={`font-medium ${station.health.uptime < 90 ? 'text-red-600' : 'text-green-600'}`}>
                              {station.health.uptime.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        {station.inventory.predictedStockout && station.inventory.predictedStockout < 60 && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-400">
                            ⚠️ Stockout in {station.inventory.predictedStockout}min
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Station Details */}
        <div className="lg:col-span-2">
          {selectedStation ? (
            <StationDetails station={selectedStation} />
          ) : (
            <Card className="h-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200 dark:border-gray-700">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <MapPin className="h-16 w-16 mx-auto text-gray-300" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Select a Station</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Choose a station from the list to view detailed metrics and AI insights
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
