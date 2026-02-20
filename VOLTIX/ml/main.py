"""
Main FastAPI service for EV Copilot ML Models
Integrates all 5 agent ML models into a single API service
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import os
import sys
from datetime import datetime

# Add models directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'models'))

# Import all ML models
from failure_predictor import FailurePredictor
from traffic_optimizer import TrafficOptimizer
from logistics_optimizer import LogisticsOptimizer
from energy_trader import EnergyTrader
from audit_analyzer import AuditAnalyzer
from route_optimizer import RouteOptimizer

# Initialize FastAPI app
app = FastAPI(
    title="EV Copilot ML Service",
    description="Machine Learning service for the 5 specialized agents",
    version="1.0.0"
)

# Initialize ML models
failure_model = FailurePredictor()
traffic_model = TrafficOptimizer()
logistics_model = LogisticsOptimizer()
energy_model = EnergyTrader()
audit_model = AuditAnalyzer()
route_model = RouteOptimizer()

# Global model status
models_trained = {
    'failure': False,
    'traffic': False,
    'logistics': False,
    'energy': False,
    'audit': False,
    'route': True  # Route optimizer doesn't need training
}

# Pydantic models for API requests/responses
class SensorData(BaseModel):
    temperature: float = 25
    voltage: float = 220
    current: float = 30
    vibration: float = 0.1
    humidity: float = 45
    uptime: float = 95
    error_rate: float = 0.1

class StationData(BaseModel):
    weather: str = 'sunny'
    temperature: float = 25
    station_capacity: int = 8
    station_type: str = 'standard'
    is_highway: int = 0
    is_mall: int = 0
    is_office: int = 0
    is_holiday: int = 0
    nearby_event: int = 0

class IncentiveRequest(BaseModel):
    current_station: StationData
    alternative_station: StationData
    user_profile: Optional[Dict[str, Any]] = None

class LogisticsData(BaseModel):
    current_inventory: int = 50
    max_capacity: int = 100
    station_popularity: float = 0.5
    avg_daily_consumption: float = 25
    consumption_trend: float = 0
    weather_impact: float = 1.0
    event_impact: float = 1.0
    supplier_distance: float = 20
    delivery_time: float = 45
    available_vehicles: int = 3
    vehicle_capacity: int = 50

class MarketData(BaseModel):
    grid_demand: float = 1000
    grid_supply: float = 1100
    grid_frequency: float = 50
    temperature: float = 25
    solar_irradiance: float = 500
    wind_speed: float = 10
    station_load: float = 50
    battery_soc: float = 60
    charging_sessions: int = 4
    coal_price: float = 3000
    gas_price: float = 40
    carbon_price: float = 2000

class RouteRequest(BaseModel):
    start_coords: List[float]  # [lat, lon]
    end_coords: List[float]    # [lat, lon]
    profile: str = 'driving'

class StationOptimizationRequest(BaseModel):
    user_location: List[float]  # [lat, lon]
    stations: List[Dict[str, Any]]
    preferences: Optional[Dict[str, Any]] = None

class MultiStopRouteRequest(BaseModel):
    start_location: List[float]  # [lat, lon]
    stops: List[List[float]]     # List of [lat, lon] coordinates
    end_location: Optional[List[float]] = None  # [lat, lon], if None returns to start

class DecisionData(BaseModel):
    agent: str
    action: str
    confidence_score: float = 0.8
    execution_time: float = 1000
    cost_impact: float = 0
    revenue_impact: float = 0
    success_rate: float = 0.9
    user_satisfaction: float = 0.8
    risk_score: float = 0.2
    human_override: int = 0
    system_cpu: float = 50
    system_memory: float = 60
    api_calls: int = 5
    timestamp: str = None

# Startup event to train models
@app.on_event("startup")
async def startup_event():
    """Train all models on startup"""
    print("🚀 Starting EV Copilot ML Service...")
    
    try:
        print("Training Failure Predictor...")
        failure_model.train()
        models_trained['failure'] = True
        
        print("Training Traffic Optimizer...")
        traffic_model.train()
        models_trained['traffic'] = True
        
        print("Training Logistics Optimizer...")
        logistics_model.train()
        models_trained['logistics'] = True
        
        print("Training Energy Trader...")
        energy_model.train()
        models_trained['energy'] = True
        
        print("Training Audit Analyzer...")
        audit_model.train()
        models_trained['audit'] = True
        
        print("✅ All models trained successfully!")
        
    except Exception as e:
        print(f"❌ Error training models: {e}")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models_trained": models_trained,
        "service": "EV Copilot ML Service"
    }

# MECHANIC AGENT ENDPOINTS
@app.post("/mechanic/predict-failure")
async def predict_failure(sensor_data: SensorData):
    """Predict hardware failure probability"""
    if not models_trained['failure']:
        raise HTTPException(status_code=503, detail="Failure model not trained")
    
    try:
        result = failure_model.predict_failure(sensor_data.dict())
        return {
            "success": True,
            "prediction": result,
            "agent": "MechanicAgent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# TRAFFIC AGENT ENDPOINTS
@app.post("/traffic/predict-demand")
async def predict_traffic_demand(station_data: StationData, forecast_hours: int = 4):
    """Predict traffic demand and wait times"""
    if not models_trained['traffic']:
        raise HTTPException(status_code=503, detail="Traffic model not trained")
    
    try:
        predictions = traffic_model.predict_traffic(station_data.dict(), forecast_hours)
        return {
            "success": True,
            "predictions": predictions,
            "agent": "TrafficAgent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/traffic/calculate-incentive")
async def calculate_incentive(request: IncentiveRequest):
    """Calculate optimal incentive for driver rerouting"""
    if not models_trained['traffic']:
        raise HTTPException(status_code=503, detail="Traffic model not trained")
    
    try:
        # Add distance to alternative station data
        request.alternative_station.distance_km = 2.5  # Default
        
        incentive = traffic_model.calculate_optimal_incentive(
            request.current_station.dict(),
            request.alternative_station.dict(),
            request.user_profile
        )
        return {
            "success": True,
            "incentive": incentive,
            "agent": "TrafficAgent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# LOGISTICS AGENT ENDPOINTS
@app.post("/logistics/predict-stockout")
async def predict_stockout(logistics_data: LogisticsData, forecast_hours: int = 6):
    """Predict stockout risk"""
    if not models_trained['logistics']:
        raise HTTPException(status_code=503, detail="Logistics model not trained")
    
    try:
        predictions = logistics_model.predict_stockout_risk(
            logistics_data.dict(), forecast_hours
        )
        return {
            "success": True,
            "predictions": predictions,
            "agent": "LogisticsAgent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/logistics/optimize-dispatch")
async def optimize_dispatch(logistics_data: LogisticsData):
    """Optimize dispatch decision"""
    if not models_trained['logistics']:
        raise HTTPException(status_code=503, detail="Logistics model not trained")
    
    try:
        # Mock available vehicles
        available_vehicles = [
            {'id': 'V001', 'capacity': 50, 'distance_to_station': 15, 'available': True},
            {'id': 'V002', 'capacity': 30, 'distance_to_station': 8, 'available': True}
        ]
        
        decision = logistics_model.optimize_dispatch_decision(
            logistics_data.dict(), available_vehicles
        )
        return {
            "success": True,
            "decision": decision,
            "agent": "LogisticsAgent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ENERGY AGENT ENDPOINTS
@app.post("/energy/predict-prices")
async def predict_energy_prices(market_data: MarketData, forecast_hours: int = 24):
    """Predict energy prices"""
    if not models_trained['energy']:
        raise HTTPException(status_code=503, detail="Energy model not trained")
    
    try:
        predictions = energy_model.predict_energy_prices(
            market_data.dict(), forecast_hours
        )
        return {
            "success": True,
            "predictions": predictions,
            "agent": "EnergyAgent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/energy/optimize-trading")
async def optimize_trading(market_data: MarketData, station_data: Dict[str, Any]):
    """Optimize energy trading decision"""
    if not models_trained['energy']:
        raise HTTPException(status_code=503, detail="Energy model not trained")
    
    try:
        decision = energy_model.optimize_trading_decision(
            market_data.dict(), station_data
        )
        return {
            "success": True,
            "decision": decision,
            "agent": "EnergyAgent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# AUDITOR AGENT ENDPOINTS
@app.post("/audit/analyze-decision")
async def analyze_decision(decision_data: DecisionData):
    """Analyze decision for anomalies and compliance"""
    if not models_trained['audit']:
        raise HTTPException(status_code=503, detail="Audit model not trained")
    
    try:
        if decision_data.timestamp is None:
            decision_data.timestamp = datetime.now().isoformat()
        
        analysis = audit_model.analyze_decision(decision_data.dict())
        return {
            "success": True,
            "analysis": analysis,
            "agent": "AuditorAgent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/audit/batch-analyze")
async def batch_analyze_decisions(decisions: List[DecisionData]):
    """Analyze multiple decisions in batch"""
    if not models_trained['audit']:
        raise HTTPException(status_code=503, detail="Audit model not trained")
    
    try:
        decisions_dict = []
        for i, decision in enumerate(decisions):
            if decision.timestamp is None:
                decision.timestamp = datetime.now().isoformat()
            decision_dict = decision.dict()
            decision_dict['id'] = f"decision_{i}"
            decisions_dict.append(decision_dict)
        
        analysis = audit_model.batch_audit_analysis(decisions_dict)
        return {
            "success": True,
            "analysis": analysis,
            "agent": "AuditorAgent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ROUTE OPTIMIZER ENDPOINTS
@app.post("/route/calculate")
async def calculate_route(request: RouteRequest):
    """Calculate route between two points"""
    try:
        start_coords = tuple(request.start_coords)
        end_coords = tuple(request.end_coords)
        
        route = route_model.get_route_osrm(start_coords, end_coords, request.profile)
        
        return {
            "success": True,
            "route": route,
            "service": "RouteOptimizer"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/route/optimize-station")
async def optimize_station_selection(request: StationOptimizationRequest):
    """Find optimal charging station"""
    try:
        user_location = tuple(request.user_location)
        
        result = route_model.find_optimal_station(
            user_location, 
            request.stations, 
            request.preferences
        )
        
        return {
            "success": True,
            "optimization": result,
            "service": "RouteOptimizer"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/route/multi-stop")
async def optimize_multi_stop_route(request: MultiStopRouteRequest):
    """Optimize multi-stop route (TSP)"""
    try:
        start_location = tuple(request.start_location)
        stops = [tuple(stop) for stop in request.stops]
        end_location = tuple(request.end_location) if request.end_location else None
        
        result = route_model.optimize_multi_stop_route(
            start_location, stops, end_location
        )
        
        return {
            "success": True,
            "optimized_route": result,
            "service": "RouteOptimizer"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/route/alternatives")
async def get_alternative_routes(request: RouteRequest, num_alternatives: int = 3):
    """Get alternative routes between two points"""
    try:
        start_coords = tuple(request.start_coords)
        end_coords = tuple(request.end_coords)
        
        routes = route_model.get_alternative_routes(
            start_coords, end_coords, num_alternatives
        )
        
        return {
            "success": True,
            "routes": routes,
            "total_routes": len(routes),
            "service": "RouteOptimizer"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/route/risk-assessment")
async def assess_route_risk(request: RouteRequest, weather_conditions: Optional[Dict[str, Any]] = None):
    """Assess risk for a given route"""
    try:
        start_coords = tuple(request.start_coords)
        end_coords = tuple(request.end_coords)
        
        # Get route first
        route = route_model.get_route_osrm(start_coords, end_coords, request.profile)
        
        if not route['success']:
            raise HTTPException(status_code=400, detail="Could not calculate route")
        
        # Calculate risk
        risk_assessment = route_model.calculate_route_risk(route, weather_conditions)
        
        return {
            "success": True,
            "route": route,
            "risk_assessment": risk_assessment,
            "service": "RouteOptimizer"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# COMBINED ENDPOINTS
@app.post("/agents/comprehensive-analysis")
async def comprehensive_analysis(
    sensor_data: SensorData,
    station_data: StationData,
    logistics_data: LogisticsData,
    market_data: MarketData,
    user_location: Optional[List[float]] = None
):
    """Run analysis for all agents including route optimization"""
    results = {}
    
    try:
        # Mechanic Agent
        if models_trained['failure']:
            results['mechanic'] = failure_model.predict_failure(sensor_data.dict())
        
        # Traffic Agent
        if models_trained['traffic']:
            results['traffic'] = traffic_model.predict_traffic(station_data.dict(), 4)
        
        # Logistics Agent
        if models_trained['logistics']:
            results['logistics'] = logistics_model.predict_stockout_risk(logistics_data.dict(), 6)
        
        # Energy Agent
        if models_trained['energy']:
            results['energy'] = energy_model.predict_energy_prices(market_data.dict(), 8)
        
        # Route Optimizer (if user location provided)
        if user_location and models_trained['route']:
            # Create sample stations for demonstration
            sample_stations = [
                {
                    'station_id': 'ST001',
                    'name': 'Sample Station A',
                    'latitude': user_location[0] + 0.01,
                    'longitude': user_location[1] + 0.01,
                    'queue_length': 3,
                    'price_per_kwh': 6.0,
                    'rating': 4.2
                },
                {
                    'station_id': 'ST002',
                    'name': 'Sample Station B', 
                    'latitude': user_location[0] - 0.01,
                    'longitude': user_location[1] - 0.01,
                    'queue_length': 7,
                    'price_per_kwh': 5.5,
                    'rating': 4.0
                }
            ]
            
            results['route_optimization'] = route_model.find_optimal_station(
                tuple(user_location), sample_stations
            )
        
        return {
            "success": True,
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Model management endpoints
@app.post("/models/retrain/{model_name}")
async def retrain_model(model_name: str):
    """Retrain a specific model"""
    try:
        if model_name == "failure":
            failure_model.train()
            models_trained['failure'] = True
        elif model_name == "traffic":
            traffic_model.train()
            models_trained['traffic'] = True
        elif model_name == "logistics":
            logistics_model.train()
            models_trained['logistics'] = True
        elif model_name == "energy":
            energy_model.train()
            models_trained['energy'] = True
        elif model_name == "audit":
            audit_model.train()
            models_trained['audit'] = True
        else:
            raise HTTPException(status_code=400, detail="Invalid model name")
        
        return {
            "success": True,
            "message": f"{model_name} model retrained successfully",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models/status")
async def get_models_status():
    """Get status of all models"""
    return {
        "models_trained": models_trained,
        "timestamp": datetime.now().isoformat(),
        "total_models": len(models_trained),
        "trained_models": sum(models_trained.values())
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )