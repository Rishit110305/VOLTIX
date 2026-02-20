"use client";

import { useState, useEffect, useCallback } from "react";

interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

interface LocationData {
  coordinates: LocationCoordinates;
  timestamp: number;
  address?: string;
}

interface LocationError {
  code: number;
  message: string;
}

interface UseLiveLocationReturn {
  location: LocationData | null;
  error: LocationError | null;
  loading: boolean;
  isSupported: boolean;
  requestLocation: () => void;
  watchLocation: () => void;
  stopWatching: () => void;
  clearLocation: () => void;
}

const LOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
};

export const useLiveLocation = (): UseLiveLocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Check if geolocation is supported
  const isSupported =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  // Get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (
    lat: number,
    lng: number,
  ): Promise<string> => {
    try {
      // Using a free geocoding service (you can replace with your preferred service)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      );

      if (response.ok) {
        const data = await response.json();
        return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch (error) {
      console.warn("Failed to get address:", error);
    }

    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  // Handle successful location retrieval
  const handleLocationSuccess = useCallback(
    async (position: GeolocationPosition) => {
      const { coords, timestamp } = position;

      const locationData: LocationData = {
        coordinates: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          altitude: coords.altitude,
          altitudeAccuracy: coords.altitudeAccuracy,
          heading: coords.heading,
          speed: coords.speed,
        },
        timestamp,
      };

      // Get address in background
      try {
        const address = await getAddressFromCoordinates(
          coords.latitude,
          coords.longitude,
        );
        locationData.address = address;
      } catch (error) {
        console.warn("Failed to get address:", error);
      }

      setLocation(locationData);
      setError(null);
      setLoading(false);
    },
    [],
  );

  // Handle location errors
  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    const locationError: LocationError = {
      code: error.code,
      message: getErrorMessage(error.code),
    };

    setError(locationError);
    setLocation(null);
    setLoading(false);
  }, []);

  // Get error message based on error code
  const getErrorMessage = (code: number): string => {
    switch (code) {
      case 1:
        return "Location access denied by user";
      case 2:
        return "Location information unavailable";
      case 3:
        return "Location request timed out";
      default:
        return "An unknown error occurred while retrieving location";
    }
  };

  // Request location once
  const requestLocation = useCallback(() => {
    if (!isSupported) {
      setError({
        code: -1,
        message: "Geolocation is not supported by this browser",
      });
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      LOCATION_OPTIONS,
    );
  }, [isSupported, handleLocationSuccess, handleLocationError]);

  // Start watching location changes
  const watchLocation = useCallback(() => {
    if (!isSupported) {
      setError({
        code: -1,
        message: "Geolocation is not supported by this browser",
      });
      return;
    }

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    setLoading(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      LOCATION_OPTIONS,
    );

    setWatchId(id);
  }, [isSupported, watchId, handleLocationSuccess, handleLocationError]);

  // Stop watching location changes
  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setLoading(false);
    }
  }, [watchId]);

  // Clear location data
  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
    setLoading(false);
    stopWatching();
  }, [stopWatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    location,
    error,
    loading,
    isSupported,
    requestLocation,
    watchLocation,
    stopWatching,
    clearLocation,
  };
};

// Helper hook for one-time location request (useful after signup)
export const useLocationOnSignup = () => {
  const { requestLocation, location, error, loading } = useLiveLocation();
  const [hasRequested, setHasRequested] = useState(false);

  const requestLocationAfterSignup = useCallback(() => {
    if (!hasRequested) {
      setHasRequested(true);
      requestLocation();
    }
  }, [hasRequested, requestLocation]);

  return {
    location,
    error,
    loading,
    requestLocationAfterSignup,
    hasRequested,
  };
};

export default useLiveLocation;
