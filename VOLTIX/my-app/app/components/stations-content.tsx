"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Battery, Zap, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StationDetails from "./station-details";

// Mock data (shared with HomeContent effectively via duplication or potentially context later)
// ideally this should be in a shared data file
const stationsData = [
  {
    id: "ST-4012",
    from: "Mumbai Central",
    to: "Andheri West",
    status: "active",
    statusLabel: "Charging",
    power: "150 kW",
    address: "Plot 12, MIDC Industrial Area, Andheri East, Mumbai 400093",
    batteriesAvailable: 5,
  },
  {
    id: "ST-4015",
    from: "Bandra Station",
    to: "Powai Hub",
    status: "active",
    statusLabel: "Charging",
    power: "50 kW",
    address: "Hiranandani Gardens, Powai, Mumbai 400076",
    batteriesAvailable: 2,
  },
  {
    id: "ST-4018",
    from: "Thane West",
    to: "Navi Mumbai",
    status: "queued",
    statusLabel: "Queued",
    power: "22 kW",
    address: "Sector 15, CBD Belapur, Navi Mumbai 400614",
    batteriesAvailable: 0,
  },
  {
    id: "ST-4021",
    from: "Juhu Beach",
    to: "Santacruz",
    status: "maintenance",
    statusLabel: "Maintenance",
    power: "0 kW",
    address: "Juhu Tara Road, Santacruz West, Mumbai 400049",
    batteriesAvailable: 0,
  },
  {
    id: "ST-4025",
    from: "Dadar TT",
    to: "Lower Parel",
    status: "active",
    statusLabel: "Charging",
    power: "120 kW",
    address: "Phoenix Mills Compound, Lower Parel, Mumbai 400013",
    batteriesAvailable: 6,
  },
];

interface StationsContentProps {
  selectedStationId?: string | null;
  onStationSelect?: (stationId: string | null) => void;
}

export default function StationsContent({
  selectedStationId,
  onStationSelect,
}: StationsContentProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Find selected station object if ID is provided
  const selectedStation = selectedStationId
    ? stationsData.find((s) => s.id === selectedStationId)
    : null;

  // Handle internal selection vs parent selection
  // If parent controls state (onStationSelect provided), use that.
  // Otherwise use local state (which isn't implemented here fully as we rely on props for the lift).

  const handleSelect = (id: string | null) => {
    if (onStationSelect) {
      onStationSelect(id);
    }
  };

  const filteredStations = stationsData.filter(
    (station) =>
      station.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-[calc(100vh-140px)] rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
      <AnimatePresence mode="wait">
        {selectedStation ? (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="h-full"
          >
            <StationDetails
              station={selectedStation}
              onBack={() => handleSelect(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full flex flex-col space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">Charging Stations</h2>
                <p className="text-muted-foreground">
                  Manage and track all connected stations
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search stations..."
                  className="pl-9 rounded-xl bg-white dark:bg-slate-800"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-4">
              {filteredStations.map((station) => (
                <Card
                  key={station.id}
                  className="p-4 rounded-2xl border hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group bg-white dark:bg-slate-800"
                  onClick={() => handleSelect(station.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm group-hover:text-blue-600 transition-colors">
                          {station.id}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 h-5"
                        >
                          {station.statusLabel}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-full"
                    >
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {station.address}
                    </p>
                  </div>

                  <div className="pt-3 border-t flex justify-between items-center text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Battery className="w-3.5 h-3.5" />
                      {station.batteriesAvailable} Batteries Available
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                      {station.power}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
