"use client";

import { motion } from "framer-motion";
import {
  Battery,
  MapPin,
  Zap,
  Clock,
  BarChart3,
  Thermometer,
  Wifi,
  MoreVertical,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data for batteries
const BATTERIES = Array.from({ length: 8 }).map((_, i) => ({
  id: `BAT-${100 + i}`,
  status: i < 5 ? "ready" : i < 7 ? "charging" : "maintenance",
  charge: i < 5 ? 100 : i < 7 ? 45 + i * 10 : 0,
  cycles: 120 + i * 15,
  temp: 24 + (i % 3),
  health: i === 7 ? 78 : 98,
}));

interface StationDetailsProps {
  station: any; // Type this properly based on your data structure
  onBack: () => void;
}

export default function StationDetails({
  station,
  onBack,
}: StationDetailsProps) {
  if (!station) return null;

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-right duration-300">
      {/* Header / Nav */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Station {station.id}
            <Badge
              variant="outline"
              className="ml-2 bg-green-50 text-green-700 border-green-200"
            >
              Online
            </Badge>
          </h2>
          <p className="text-muted-foreground flex items-center gap-1 text-sm">
            <MapPin className="w-3.5 h-3.5" /> {station.address}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" className="rounded-xl">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Left Column: Stats & Overview */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="p-5 rounded-3xl border-0 shadow-sm bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Power
                </p>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-lg font-bold">150 kW</span>
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-muted-foreground mb-1">Avg Wait</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-lg font-bold">12 min</span>
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-muted-foreground mb-1">
                  Temperature
                </p>
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-red-500" />
                  <span className="text-lg font-bold">28°C</span>
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-muted-foreground mb-1">Network</p>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-lg font-bold">5G</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Live Status Card */}
          <Card className="p-6 rounded-3xl bg-slate-900 text-white border-0 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>

            <h3 className="font-semibold mb-6 flex items-center justify-between z-10 relative">
              Live Usage
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            </h3>

            <div className="space-y-4 relative z-10">
              <div>
                <div className="flex justify-between text-sm mb-2 opacity-80">
                  <span>Power Usage</span>
                  <span>78%</span>
                </div>
                <Progress value={78} className="h-2 bg-slate-700" />
                {/* Note: Tailwind color class for indicator 'bg-blue-500' would be standard, assumed global or default */}
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2 opacity-80">
                  <span>Occupancy</span>
                  <span>4/6 Slots</span>
                </div>
                <Progress value={66} className="h-2 bg-slate-700" />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Battery Inventory (Span 2) */}
        <div className="md:col-span-2 flex flex-col bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                Battery Inventory
                <Badge className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-full px-2">
                  {BATTERIES.length} Units
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                Real-time status of swap batteries
              </p>
            </div>

            <div className="flex gap-2 text-xs font-medium">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> 5
                Ready
              </span>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> 2
                Charging
              </span>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {BATTERIES.map((bat) => (
                <div
                  key={bat.id}
                  className={`p-4 rounded-2xl border transition-all hover:shadow-md flex items-center gap-4 ${
                    bat.status === "ready"
                      ? "bg-green-50/30 border-green-100 dark:bg-green-900/10 dark:border-green-900/30"
                      : bat.status === "charging"
                        ? "bg-amber-50/30 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30"
                        : "bg-gray-50 border-gray-100 dark:bg-gray-800/50 dark:border-gray-700"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      bat.status === "ready"
                        ? "bg-green-100 text-green-600"
                        : bat.status === "charging"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {bat.status === "charging" ? (
                      <Zap className="w-6 h-6" />
                    ) : (
                      <Battery className="w-6 h-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-sm">{bat.id}</h4>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                          bat.status === "ready"
                            ? "text-green-700 bg-green-100/50"
                            : bat.status === "charging"
                              ? "text-amber-700 bg-amber-100/50"
                              : "text-gray-500 bg-gray-100"
                        }`}
                      >
                        {bat.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Charge</span>
                        <span>{bat.charge}%</span>
                      </div>
                      <Progress value={bat.charge} className="h-1.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
