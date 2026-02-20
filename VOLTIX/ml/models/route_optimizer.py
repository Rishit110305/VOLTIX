"""
Route Optimizer using OpenStreetMap data
Integrates with Traffic Agent and Logistics Agent for optimal routing
"""

import numpy as np
import pandas as pd
import requests
import json
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
import math
import warnings
warnings.filterwarnings('ignore')

class RouteOptimizer:
    def __init__(self):
        self.osrm_base_url = "http://router.project-osrm.org"
        self.overpass_url = "http://overpass-api.de/api/interpreter"
        self.cache = {}  # Simple caching for API calls
        
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate haversine distance between two points in kilometers"""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = (math.sin(dlat/2)**2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2)
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def get_route_osrm(self, start_coords: Tuple[float, float], 
                       end_coords: Tuple[float, float],
                       profile: str = "driving") -> Dict:
        """Get route from OSRM API"""
        
        # Create cache key
        cache_key = f"{start_coords}_{end_coords}_{profile}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            # OSRM expects lon,lat format
            start_lon, start_lat = start_coords[1], start_coords[0]
            end_lon, end_lat = end_coords[1], end_coords[0]
            
            url = f"{self.osrm_base_url}/route/v1/{profile}/{start_lon},{start_lat};{end_lon},{end_lat}"
            params = {
                'overview': 'full',
                'geometries': 'geojson',
                'steps': 'true'
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data['code'] == 'Ok' and data['routes']:
                    route = data['routes'][0]
                    
                    result = {
                        'distance_km': route['distance'] / 1000,
                        'duration_minutes': route['duration'] / 60,
                        'geometry': route['geometry'],
                        'steps': route['legs'][0]['steps'] if route['legs'] else [],
                        'success': True,
                        'source': 'osrm'
                    }
                    
                    # Cache the result
                    self.cache[cache_key] = result
                    return result
            
            # Fallback to haversine calculation
            return self._fallback_route_calculation(start_coords, end_coords)
            
        except Exception as e:
            print(f"OSRM API error: {e}")
            return self._fallback_route_calculation(start_coords, end_coords)
    
    def _fallback_route_calculation(self, start_coords: Tuple[float, float], 
                                   end_coords: Tuple[float, float]) -> Dict:
        """Fallback route calculation using haversine distance"""
        
        distance_km = self.calculate_distance(
            start_coords[0], start_coords[1],
            end_coords[0], end_coords[1]
        )
        
        # Estimate duration based on average city speed (25 km/h)
        duration_minutes = (distance_km / 25) * 60
        
        return {
            'distance_km': distance_km,
            'duration_minutes': duration_minutes,
            'geometry': None,
            'steps': [],
            'success': True,
            'source': 'fallback'
        }
    
    def find_optimal_station(self, user_location: Tuple[float, float],
                           stations: List[Dict],
                           preferences: Dict = None) -> Dict:
        """Find optimal charging station based on multiple criteria"""
        
        if not stations:
            return {'error': 'No stations provided'}
        
        preferences = preferences or {}
        
        # Weight factors
        distance_weight = preferences.get('distance_weight', 0.4)
        queue_weight = preferences.get('queue_weight', 0.3)
        price_weight = preferences.get('price_weight', 0.2)
        rating_weight = preferences.get('rating_weight', 0.1)
        
        station_scores = []
        
        for station in stations:
            try:
                # Get route to station
                station_coords = (station['latitude'], station['longitude'])
                route = self.get_route_osrm(user_location, station_coords)
                
                if not route['success']:
                    continue
                
                # Calculate individual scores (0-1, lower is better)
                distance_score = min(route['distance_km'] / 50, 1.0)  # Normalize to 50km max
                queue_score = min(station.get('queue_length', 0) / 20, 1.0)  # Normalize to 20 cars max
                price_score = min(station.get('price_per_kwh', 5) / 10, 1.0)  # Normalize to ₹10/kWh max
                rating_score = 1 - (station.get('rating', 3) / 5)  # Invert rating (5 stars = 0 score)
                
                # Calculate weighted total score
                total_score = (
                    distance_score * distance_weight +
                    queue_score * queue_weight +
                    price_score * price_weight +
                    rating_score * rating_weight
                )
                
                station_info = {
                    'station_id': station.get('station_id'),
                    'name': station.get('name'),
                    'distance_km': route['distance_km'],
                    'duration_minutes': route['duration_minutes'],
                    'queue_length': station.get('queue_length', 0),
                    'price_per_kwh': station.get('price_per_kwh', 5),
                    'rating': station.get('rating', 3),
                    'total_score': total_score,
                    'route': route,
                    'scores': {
                        'distance': distance_score,
                        'queue': queue_score,
                        'price': price_score,
                        'rating': rating_score
                    }
                }
                
                station_scores.append(station_info)
                
            except Exception as e:
                print(f"Error processing station {station.get('station_id')}: {e}")
                continue
        
        if not station_scores:
            return {'error': 'No valid stations found'}
        
        # Sort by total score (lower is better)
        station_scores.sort(key=lambda x: x['total_score'])
        
        return {
            'optimal_station': station_scores[0],
            'alternatives': station_scores[1:5],  # Top 5 alternatives
            'total_stations_evaluated': len(station_scores)
        }
    
    def optimize_multi_stop_route(self, start_location: Tuple[float, float],
                                 stops: List[Tuple[float, float]],
                                 end_location: Tuple[float, float] = None) -> Dict:
        """Optimize route for multiple stops (Traveling Salesman Problem)"""
        
        if not stops:
            return {'error': 'No stops provided'}
        
        # If no end location, return to start
        if end_location is None:
            end_location = start_location
        
        # For small number of stops, use brute force
        if len(stops) <= 8:
            return self._brute_force_tsp(start_location, stops, end_location)
        else:
            return self._nearest_neighbor_tsp(start_location, stops, end_location)
    
    def _brute_force_tsp(self, start: Tuple[float, float], 
                        stops: List[Tuple[float, float]],
                        end: Tuple[float, float]) -> Dict:
        """Brute force solution for small TSP instances"""
        
        from itertools import permutations
        
        best_distance = float('inf')
        best_route = None
        best_duration = 0
        
        # Try all permutations of stops
        for perm in permutations(stops):
            total_distance = 0
            total_duration = 0
            route_segments = []
            
            # Start to first stop
            current_location = start
            for next_location in list(perm) + [end]:
                route = self.get_route_osrm(current_location, next_location)
                if route['success']:
                    total_distance += route['distance_km']
                    total_duration += route['duration_minutes']
                    route_segments.append({
                        'from': current_location,
                        'to': next_location,
                        'distance_km': route['distance_km'],
                        'duration_minutes': route['duration_minutes']
                    })
                    current_location = next_location
                else:
                    total_distance = float('inf')
                    break
            
            if total_distance < best_distance:
                best_distance = total_distance
                best_duration = total_duration
                best_route = {
                    'stops_order': list(perm),
                    'segments': route_segments,
                    'total_distance_km': total_distance,
                    'total_duration_minutes': total_duration
                }
        
        return {
            'optimized_route': best_route,
            'method': 'brute_force',
            'stops_count': len(stops)
        }
    
    def _nearest_neighbor_tsp(self, start: Tuple[float, float],
                             stops: List[Tuple[float, float]],
                             end: Tuple[float, float]) -> Dict:
        """Nearest neighbor heuristic for larger TSP instances"""
        
        unvisited = stops.copy()
        route_order = []
        current_location = start
        total_distance = 0
        total_duration = 0
        route_segments = []
        
        # Visit nearest unvisited stop
        while unvisited:
            nearest_stop = None
            nearest_distance = float('inf')
            nearest_route = None
            
            for stop in unvisited:
                route = self.get_route_osrm(current_location, stop)
                if route['success'] and route['distance_km'] < nearest_distance:
                    nearest_distance = route['distance_km']
                    nearest_stop = stop
                    nearest_route = route
            
            if nearest_stop is None:
                break
            
            # Move to nearest stop
            route_order.append(nearest_stop)
            unvisited.remove(nearest_stop)
            total_distance += nearest_route['distance_km']
            total_duration += nearest_route['duration_minutes']
            route_segments.append({
                'from': current_location,
                'to': nearest_stop,
                'distance_km': nearest_route['distance_km'],
                'duration_minutes': nearest_route['duration_minutes']
            })
            current_location = nearest_stop
        
        # Return to end location
        final_route = self.get_route_osrm(current_location, end)
        if final_route['success']:
            total_distance += final_route['distance_km']
            total_duration += final_route['duration_minutes']
            route_segments.append({
                'from': current_location,
                'to': end,
                'distance_km': final_route['distance_km'],
                'duration_minutes': final_route['duration_minutes']
            })
        
        return {
            'optimized_route': {
                'stops_order': route_order,
                'segments': route_segments,
                'total_distance_km': total_distance,
                'total_duration_minutes': total_duration
            },
            'method': 'nearest_neighbor',
            'stops_count': len(stops)
        }
    
    def get_traffic_conditions(self, route_coords: List[Tuple[float, float]]) -> Dict:
        """Get traffic conditions along a route (mock implementation)"""
        
        # In a real implementation, this would call traffic APIs like Google Maps, HERE, etc.
        # For now, we'll simulate traffic conditions
        
        traffic_segments = []
        
        for i in range(len(route_coords) - 1):
            start_coord = route_coords[i]
            end_coord = route_coords[i + 1]
            
            # Simulate traffic conditions
            current_hour = datetime.now().hour
            
            # Peak hours have higher traffic
            if current_hour in [8, 9, 17, 18, 19]:
                traffic_level = np.random.choice(['moderate', 'heavy'], p=[0.3, 0.7])
                delay_factor = np.random.uniform(1.3, 2.0)
            elif current_hour in [7, 10, 16, 20]:
                traffic_level = np.random.choice(['light', 'moderate'], p=[0.4, 0.6])
                delay_factor = np.random.uniform(1.1, 1.4)
            else:
                traffic_level = 'light'
                delay_factor = np.random.uniform(1.0, 1.2)
            
            segment_distance = self.calculate_distance(
                start_coord[0], start_coord[1],
                end_coord[0], end_coord[1]
            )
            
            traffic_segments.append({
                'start': start_coord,
                'end': end_coord,
                'distance_km': segment_distance,
                'traffic_level': traffic_level,
                'delay_factor': delay_factor,
                'estimated_delay_minutes': (delay_factor - 1) * (segment_distance / 30) * 60
            })
        
        total_delay = sum(segment['estimated_delay_minutes'] for segment in traffic_segments)
        
        return {
            'segments': traffic_segments,
            'total_delay_minutes': total_delay,
            'overall_traffic_level': self._get_overall_traffic_level(traffic_segments),
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_overall_traffic_level(self, segments: List[Dict]) -> str:
        """Determine overall traffic level from segments"""
        
        traffic_scores = {'light': 1, 'moderate': 2, 'heavy': 3}
        avg_score = np.mean([traffic_scores[seg['traffic_level']] for seg in segments])
        
        if avg_score <= 1.3:
            return 'light'
        elif avg_score <= 2.3:
            return 'moderate'
        else:
            return 'heavy'
    
    def calculate_route_risk(self, route: Dict, weather_conditions: Dict = None) -> Dict:
        """Calculate risk score for a route based on various factors"""
        
        weather_conditions = weather_conditions or {}
        
        # Base risk factors
        distance_risk = min(route['distance_km'] / 100, 1.0)  # Longer routes = higher risk
        
        # Weather risk
        weather = weather_conditions.get('condition', 'clear')
        weather_risk_map = {
            'clear': 0.1,
            'cloudy': 0.2,
            'light_rain': 0.4,
            'heavy_rain': 0.7,
            'storm': 0.9,
            'fog': 0.6
        }
        weather_risk = weather_risk_map.get(weather, 0.2)
        
        # Time of day risk
        current_hour = datetime.now().hour
        if 22 <= current_hour or current_hour <= 5:  # Night time
            time_risk = 0.3
        elif 6 <= current_hour <= 9 or 17 <= current_hour <= 20:  # Rush hours
            time_risk = 0.4
        else:
            time_risk = 0.1
        
        # Route complexity risk (based on number of turns/steps)
        steps_count = len(route.get('steps', []))
        complexity_risk = min(steps_count / 50, 1.0)
        
        # Calculate overall risk score
        risk_factors = {
            'distance': distance_risk,
            'weather': weather_risk,
            'time_of_day': time_risk,
            'complexity': complexity_risk
        }
        
        # Weighted average
        weights = {'distance': 0.2, 'weather': 0.3, 'time_of_day': 0.3, 'complexity': 0.2}
        overall_risk = sum(risk_factors[factor] * weights[factor] for factor in risk_factors)
        
        # Risk level classification
        if overall_risk <= 0.3:
            risk_level = 'low'
        elif overall_risk <= 0.6:
            risk_level = 'medium'
        else:
            risk_level = 'high'
        
        return {
            'overall_risk_score': round(overall_risk, 3),
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'recommendations': self._get_risk_recommendations(risk_level, risk_factors)
        }
    
    def _get_risk_recommendations(self, risk_level: str, risk_factors: Dict) -> List[str]:
        """Get safety recommendations based on risk factors"""
        
        recommendations = []
        
        if risk_level == 'high':
            recommendations.append("Consider postponing the trip if possible")
        
        if risk_factors['weather'] > 0.5:
            recommendations.append("Drive carefully due to adverse weather conditions")
            recommendations.append("Increase following distance and reduce speed")
        
        if risk_factors['time_of_day'] > 0.25:
            recommendations.append("Be extra cautious during rush hour or night driving")
        
        if risk_factors['distance'] > 0.5:
            recommendations.append("Plan rest stops for long journey")
            recommendations.append("Ensure vehicle is in good condition")
        
        if risk_factors['complexity'] > 0.5:
            recommendations.append("Use GPS navigation for complex route")
            recommendations.append("Review route before starting")
        
        return recommendations
    
    def get_alternative_routes(self, start_coords: Tuple[float, float],
                              end_coords: Tuple[float, float],
                              num_alternatives: int = 3) -> List[Dict]:
        """Get alternative routes between two points"""
        
        routes = []
        
        # Get primary route
        primary_route = self.get_route_osrm(start_coords, end_coords)
        if primary_route['success']:
            primary_route['route_type'] = 'primary'
            primary_route['route_id'] = 1
            routes.append(primary_route)
        
        # Generate alternative routes by adding waypoints
        for i in range(num_alternatives - 1):
            try:
                # Create intermediate waypoint
                lat_offset = np.random.uniform(-0.01, 0.01)
                lon_offset = np.random.uniform(-0.01, 0.01)
                
                mid_lat = (start_coords[0] + end_coords[0]) / 2 + lat_offset
                mid_lon = (start_coords[1] + end_coords[1]) / 2 + lon_offset
                waypoint = (mid_lat, mid_lon)
                
                # Route via waypoint
                route1 = self.get_route_osrm(start_coords, waypoint)
                route2 = self.get_route_osrm(waypoint, end_coords)
                
                if route1['success'] and route2['success']:
                    alternative_route = {
                        'distance_km': route1['distance_km'] + route2['distance_km'],
                        'duration_minutes': route1['duration_minutes'] + route2['duration_minutes'],
                        'route_type': 'alternative',
                        'route_id': i + 2,
                        'waypoint': waypoint,
                        'segments': [route1, route2],
                        'success': True,
                        'source': 'generated'
                    }
                    routes.append(alternative_route)
                    
            except Exception as e:
                print(f"Error generating alternative route {i+1}: {e}")
                continue
        
        return routes

# Example usage and testing
if __name__ == "__main__":
    optimizer = RouteOptimizer()
    
    # Test basic route calculation
    print("🗺️ Testing Route Optimizer")
    print("=" * 40)
    
    # Mumbai to Delhi coordinates
    mumbai = (19.0760, 72.8777)
    delhi = (28.7041, 77.1025)
    
    print("Testing basic route calculation...")
    route = optimizer.get_route_osrm(mumbai, delhi)
    print(f"Mumbai to Delhi: {route['distance_km']:.1f} km, {route['duration_minutes']:.1f} minutes")
    
    # Test station optimization
    print("\nTesting station optimization...")
    
    # Sample stations near Mumbai
    stations = [
        {
            'station_id': 'ST001',
            'name': 'Station A',
            'latitude': 19.0896,
            'longitude': 72.8656,
            'queue_length': 5,
            'price_per_kwh': 6.5,
            'rating': 4.2
        },
        {
            'station_id': 'ST002', 
            'name': 'Station B',
            'latitude': 19.0544,
            'longitude': 72.8803,
            'queue_length': 2,
            'price_per_kwh': 7.0,
            'rating': 4.5
        },
        {
            'station_id': 'ST003',
            'name': 'Station C', 
            'latitude': 19.1136,
            'longitude': 72.8697,
            'queue_length': 8,
            'price_per_kwh': 5.5,
            'rating': 3.8
        }
    ]
    
    user_location = (19.0760, 72.8777)  # Mumbai center
    optimal = optimizer.find_optimal_station(user_location, stations)
    
    if 'optimal_station' in optimal:
        best = optimal['optimal_station']
        print(f"Best station: {best['name']} ({best['distance_km']:.1f} km, {best['duration_minutes']:.1f} min)")
        print(f"Queue: {best['queue_length']} cars, Price: ₹{best['price_per_kwh']}/kWh")
    
    # Test multi-stop optimization
    print("\nTesting multi-stop route optimization...")
    
    stops = [
        (19.0896, 72.8656),  # Stop 1
        (19.0544, 72.8803),  # Stop 2
        (19.1136, 72.8697)   # Stop 3
    ]
    
    multi_route = optimizer.optimize_multi_stop_route(mumbai, stops, mumbai)
    if 'optimized_route' in multi_route:
        route_info = multi_route['optimized_route']
        print(f"Optimized route: {route_info['total_distance_km']:.1f} km, {route_info['total_duration_minutes']:.1f} minutes")
        print(f"Method: {multi_route['method']}, Stops: {multi_route['stops_count']}")
    
    print("\n✅ Route Optimizer testing completed!")