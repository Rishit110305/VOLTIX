"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  Zap, 
  Clock, 
  Battery, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Navigation,
  Route,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  RefreshCw,
  Gauge,
  Calendar,
  Building,
  Highway,
  ShoppingBag,
  Briefcase
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Station {
  station_id: string;
  name: string;
  city: string;
  station_type: 'standard' | 'fast' | 'ultra';
  capacity: number;
  max_inventory: number;
  latitude: number;
  longitude: number;
  is_highway: boolean;
  is_mall: boolean;
  is_office: boolean;
  installation_date: string;
  operator: string;
  // Real-time data (simulated)
  current_queue: number;
  available_slots: number;
  battery_inventory: number;
  health_status: 'excellent' | 'good' | 'fair' | 'maintenance';
  avg_wait_time: number;
  utilization_rate: number;
  last_updated: string;
}

interface StationsSliderProps {
  onStationSelect?: (station: Station) => void;
  selectedStation?: Station | null;
  className?: string;
}

export default function StationsSlider({ 
  onStationSelect, 
  selectedStation, 
  className = "" 
}: StationsSliderProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Load and process station data
  useEffect(() => {
    const loadStations = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll simulate the ML dataset with enhanced real-time data
        const mockStations: Station[] = [
          {
            station_id: "ST001",
            name: "EV Station 1",
            city: "Kolkata",
            station_type: "standard",
            capacity: 14,
            max_inventory: 121,
            latitude: 24.163779073319986,
            longitude: 72.52454057283066,
            is_highway: false,
            is_mall: false,
            is_office: true,
            installation_date: "2023-08-25T00:00:00",
            operator: "Operator_8",
            current_queue: 3,
            available_slots: 11,
            battery_inventory: 98,
            health_status: "good",
            avg_wait_time: 8,
            utilization_rate: 78,
            last_updated: new Date().toISOString()
          },
          {
            station_id: "ST002",
            name: "EV Station 2",
            city: "Bangalore",
            station_type: "fast",
            capacity: 5,
            max_inventory: 137,
            latitude: 30.47595130161139,
            longitude: 74.15783420967001,
            is_highway: false,
            is_mall: false,
            is_office: false,
            installation_date: "2023-11-11T00:00:00",
            operator: "Operator_9",
            current_queue: 8,
            available_slots: 0,
            battery_inventory: 124,
            health_status: "excellent",
            avg_wait_time: 15,
            utilization_rate: 95,
            last_updated: new Date().toISOString()
          },
          {
            station_id: "ST003",
            name: "EV Station 3",
            city: "Mumbai",
            station_type: "standard",
            capacity: 13,
            max_inventory: 64,
            latitude: 20.31388957385997,
            longitude: 90.77010288039739,
            is_highway: false,
            is_mall: false,
            is_office: false,
            installation_date: "2023-07-25T00:00:00",
            operator: "Operator_5",
            current_queue: 1,
            available_slots: 12,
            battery_inventory: 45,
            health_status: "fair",
            avg_wait_time: 3,
            utilization_rate: 45,
            last_updated: new Date().toISOString()
          },
          {
            station_id: "ST004",
            name: "EV Station 4",
            city: "Bangalore",
            station_type: "standard",
            capacity: 12,
            max_inventory: 67,
            latitude: 33.61990950584,
            longitude: 96.00332895916222,
            is_highway: true,
            is_mall: false,
            is_office: false,
            installation_date: "2022-12-28T00:00:00",
            operator: "Operator_7",
            current_queue: 0,
            available_slots: 12,
            battery_inventory: 58,
            health_status: "maintenance",
            avg_wait_time: 0,
            utilization_rate: 0,
            last_updated: new Date().toISOString()
          },
          {
            station_id: "ST005",
            name: "EV Station 5",
            city: "Chennai",
            station_type: "standard",
            capacity: 6,
            max_inventory: 130,
            latitude: 14.987059503200456,
            longitude: 87.21314624626548,
            is_highway: false,
            is_mall: false,
            is_office: false,
            installation_date: "2021-09-02T00:00:00",
            operator: "Operator_2",
            current_queue: 2,
            available_slots: 4,
            battery_inventory: 112,
            health_status: "good",
            avg_wait_time: 6,
            utilization_rate: 67,
            last_updated: new Date().toISOString()
          },
          {
            station_id: "ST006",
            name: "EV Station 6",
            city: "Delhi",
            station_type: "ultra",
            capacity: 13,
            max_inventory: 63,
            latitude: 27.636343888123363,
            longitude: 77.46968229536922,
            is_highway: false,
            is_mall: false,
            is_office: true,
            installation_date: "2021-12-08T00:00:00",
            operator: "Operator_2",
            current_queue: 5,
            available_slots: 8,
            battery_inventory: 48,
            health_status: "excellent",
            avg_wait_time: 12,
            utilization_rate: 85,
            last_updated: new Date().toISOString()
          }
        ];

        setStations(mockStations);
        setFilteredStations(mockStations);
        setLoading(false);
      } catch (error) {
        console.error('Error loading stations:', error);
        setLoading(false);
      }
    };

    loadStations();
  }, []);

  // Filter stations
  useEffect(() => {
    let filtered = stations;

    if (searchTerm) {
      filtered = filtered.filter(station => 
        station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.station_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.operator.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCity !== "all") {
      filtered = filtered.filter(station => station.city === filterCity);
    }

    if (filterType !== "all") {
      filtered = filtered.filter(station => station.station_type === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(station => station.health_status === filterStatus);
    }

    setFilteredStations(filtered);
    setCurrentIndex(0);
  }, [stations, searchTerm, filterCity, filterType, filterStatus]);

  // Helper functions
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'fair': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'maintenance': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'fair': return <AlertTriangle className="h-4 w-4" />;
      case 'maintenance': return <AlertTriangle className="h-4 w-4" />;
      default: return <Gauge className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ultra': return 'bg-purple-500 text-white';
      case 'fast': return 'bg-blue-500 text-white';
      case 'standard': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getLocationIcons = (station: Station) => {
    const icons = [];
    if (station.is_highway) icons.push(<Highway key="highway" className="h-3 w-3" />);
    if (station.is_mall) icons.push(<ShoppingBag key="mall" className="h-3 w-3" />);
    if (station.is_office) icons.push(<Briefcase key="office" className="h-3 w-3" />);
    return icons;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatInstallationDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  // Navigation functions
  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + 3 >= filteredStations.length ? 0 : prev + 3
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev - 3 < 0 ? Math.max(0, filteredStations.length - 3) : prev - 3
    );
  };

  const visibleStations = filteredStations.slice(currentIndex, currentIndex + 3);

  if (loading) {
    return (
      <div className={`${className} space-y-6`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Loading Station Data</h3>
              <p className="text-gray-600 dark:text-gray-400">Fetching real-time station information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">EV Charging Stations</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time monitoring of {stations.length} stations across India
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Refresh data
            window.location.reload();
          }}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
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
                  placeholder="Search stations, cities, operators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="Mumbai">🏙️ Mumbai</SelectItem>
                <SelectItem value="Delhi">🏛️ Delhi</SelectItem>
                <SelectItem value="Bangalore">🌆 Bangalore</SelectItem>
                <SelectItem value="Chennai">🏖️ Chennai</SelectItem>
                <SelectItem value="Kolkata">🏘️ Kolkata</SelectItem>
                <SelectItem value="Pune">🏞️ Pune</SelectItem>
                <SelectItem value="Hyderabad">🏢 Hyderabad</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ultra">⚡ Ultra Fast</SelectItem>
                <SelectItem value="fast">🔋 Fast</SelectItem>
                <SelectItem value="standard">🔌 Standard</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="excellent">✅ Excellent</SelectItem>
                <SelectItem value="good">🟢 Good</SelectItem>
                <SelectItem value="fair">🟡 Fair</SelectItem>
                <SelectItem value="maintenance">🔴 Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Station Slider */}
      <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Station Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {currentIndex + 1}-{Math.min(currentIndex + 3, filteredStations.length)} of {filteredStations.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={prevSlide}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextSlide}
                disabled={currentIndex + 3 >= filteredStations.length}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No stations found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filter settings
              </p>
            </div>
          ) : (
            <div ref={sliderRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {visibleStations.map((station) => (
                <Card 
                  key={station.station_id} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedStation?.station_id === station.station_id 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                  onClick={() => onStationSelect?.(station)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {station.name}
                          <Badge className={getTypeColor(station.station_type)}>
                            {station.station_type.toUpperCase()}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3" />
                          {station.city} • {station.station_id}
                          <div className="flex items-center gap-1 ml-2">
                            {getLocationIcons(station)}
                          </div>
                        </CardDescription>
                      </div>
                      
                      <Badge className={getHealthColor(station.health_status)}>
                        {getHealthIcon(station.health_status)}
                        <span className="ml-1 capitalize">{station.health_status}</span>
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="h-4 w-4 text-blue-600" />
                          <div className="text-2xl font-bold text-blue-600">
                            {station.current_queue}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Queue Length</div>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Zap className="h-4 w-4 text-green-600" />
                          <div className="text-2xl font-bold text-green-600">
                            {station.available_slots}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Available</div>
                      </div>
                    </div>

                    {/* Battery Inventory */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="flex items-center gap-1">
                          <Battery className="h-4 w-4" />
                          Battery Inventory
                        </span>
                        <span className="font-medium">
                          {station.battery_inventory}/{station.max_inventory}
                        </span>
                      </div>
                      <Progress 
                        value={(station.battery_inventory / station.max_inventory) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Utilization Rate */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          Utilization Rate
                        </span>
                        <span className="font-medium">{station.utilization_rate}%</span>
                      </div>
                      <Progress value={station.utilization_rate} className="h-2" />
                    </div>

                    {/* Wait Time */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Avg Wait Time
                      </span>
                      <span className="font-medium">{station.avg_wait_time} min</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to station
                          console.log('Navigate to station:', station.station_id);
                        }}
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        Navigate
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Optimize route
                          console.log('Optimize route for:', station.station_id);
                        }}
                      >
                        <Route className="h-3 w-3 mr-1" />
                        Route
                      </Button>
                    </div>

                    {/* Last Updated */}
                    <div className="text-xs text-gray-500 border-t pt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Updated: {formatTimestamp(station.last_updated)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}