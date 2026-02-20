export const getDistanceKm = (loc1, loc2) => {
  if (!loc1 || !loc2) return Infinity;
  
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(loc1.lat * Math.PI / 180) *
    Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
    
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const isWithinRadius = (centerLoc, targetLoc, radiusKm) => {
  const distance = getDistanceKm(centerLoc, targetLoc);
  return distance <= radiusKm;
};

export const findNearbyStations = (userLocation, stations, maxDistanceKm = 10) => {
  return stations.filter(station => {
    const stationLocation = {
      lat: station.location.coordinates[1],
      lng: station.location.coordinates[0]
    };
    return isWithinRadius(userLocation, stationLocation, maxDistanceKm);
  });
};