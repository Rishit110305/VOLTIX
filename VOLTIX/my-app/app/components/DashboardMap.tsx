"use client";

import { useState, useEffect } from "react";
import { Zap, Clock, AlertTriangle, MapPin } from "lucide-react";

interface Station {
  id: string;
  from: string;
  to: string;
  status: string;
  statusLabel: string;
  power: string;
  vehicle: string;
  owner: string;
  ownerAvatar: string;
  address: string;
  timeRemaining: string;
  batteryLevel: number;
  lat?: number;
  lng?: number;
}

interface DashboardMapProps {
  stations?: Station[];
  selectedStation?: Station | null;
  onStationSelect?: (station: Station) => void;
  className?: string;
}

export default function DashboardMap({
  stations = [],
  selectedStation,
  onStationSelect,
  className = "h-full w-full",
}: DashboardMapProps) {
  const [showMap, setShowMap] = useState(false);

  // Check if leaflet is available
  useEffect(() => {
    const checkLeaflet = async () => {
      try {
        await import("leaflet");
        await import("react-leaflet");
        setShowMap(true);
      } catch (error) {
        console.log("Leaflet not available, showing fallback");
        setShowMap(false);
      }
    };
    checkLeaflet();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "queued":
        return "bg-amber-500";
      case "maintenance":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!showMap) {
    // Fallback UI when leaflet is not available
    return (
      <div
        className={`${className} bg-slate-100 dark:bg-slate-900 rounded-lg p-6`}
      >
        <div className="text-center mb-6">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-semibold mb-2">Station Locations</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Interactive map view (install leaflet to enable full map)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {stations.map((station) => (
            <div
              key={station.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                selectedStation?.id === station.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onClick={() => onStationSelect?.(station)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-semibold text-sm">
                  Station {station.id}
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-white text-xs ${getStatusColor(
                    station.status,
                  )}`}
                >
                  {station.statusLabel}
                </span>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {station.address}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {station.power}
                </span>
                {station.status !== "maintenance" && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {station.batteryLevel}% • {station.timeRemaining}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              // Install leaflet command
              console.log(
                "To enable full map: npm install leaflet react-leaflet",
              );
            }}
            className="text-xs text-blue-500 hover:text-blue-600 underline"
          >
            Enable Interactive Map (install leaflet)
          </button>
        </div>
      </div>
    );
  }

  // If leaflet is available, dynamically import the real map component
  const MapContainer = require("react-leaflet").MapContainer;
  const TileLayer = require("react-leaflet").TileLayer;
  const Marker = require("react-leaflet").Marker;
  const Circle = require("react-leaflet").Circle;
  const Popup = require("react-leaflet").Popup;

  // Rest of the original map code would go here...
  return (
    <div
      className={`${className} bg-slate-100 dark:bg-slate-900 animate-pulse flex items-center justify-center`}
    >
      <div className="text-muted-foreground">Map component loading...</div>
    </div>
  );
}
