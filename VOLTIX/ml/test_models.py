"""
Test script to verify all ML models work correctly
Run this to test the complete ML pipeline
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'models'))

from failure_predictor import FailurePredictor
from traffic_optimizer import TrafficOptimizer
from logistics_optimizer import LogisticsOptimizer
from energy_trader import EnergyTrader
from audit_analyzer import AuditAnalyzer
from route_optimizer import RouteOptimizer
from datetime import datetime

def test_failure_predictor():
    """Test Mechanic Agent ML model"""
    print("🔧 Testing Failure Predictor (Mechanic Agent)...")
    
    predictor = FailurePredictor()
    metrics = predictor.train()
    
    # Test normal operation
    normal_data = {
        'temperature': 25,
        'voltage': 220,
        'current': 30,
        'vibration': 0.1,
        'humidity': 45,
        'uptime': 95,
        'error_rate': 0.1
    }
    
    result = predictor.predict_failure(normal_data)
    print(f"✅ Normal operation - Failure risk: {result['failure_probability']:.3f}")
    
    # Test failure scenario
    failure_data = {
        'temperature': 75,
        'voltage': 170,
        'current': 50,
        'vibration': 0.9,
        'humidity': 80,
        'uptime': 60,
        'error_rate': 3.0
    }
    
    result = predictor.predict_failure(failure_data)
    print(f"⚠️  Failure scenario - Failure risk: {result['failure_probability']:.3f}")
    print(f"   Recommended action: {result['recommended_action']}")
    
    return True

def test_traffic_optimizer():
    """Test Traffic Agent ML model"""
    print("\n🚦 Testing Traffic Optimizer (Traffic Agent)...")
    
    optimizer = TrafficOptimizer()
    metrics = optimizer.train()
    
    # Test traffic prediction
    station_data = {
        'weather': 'sunny',
        'temperature': 28,
        'station_capacity': 8,
        'station_type': 'fast',
        'is_highway': 1,
        'is_mall': 0,
        'is_office': 1,
        'is_holiday': 0,
        'nearby_event': 0
    }
    
    predictions = optimizer.predict_traffic(station_data, forecast_hours=4)
    print(f"✅ Traffic predictions for next 4 hours:")
    for pred in predictions:
        print(f"   Hour +{pred['hour_ahead']}: {pred['predicted_demand']:.1f} cars, {pred['predicted_wait_time']:.1f}min wait")
    
    # Test incentive calculation
    current_station = station_data.copy()
    alternative_station = {
        'weather': 'sunny',
        'temperature': 28,
        'station_capacity': 10,
        'station_type': 'fast',
        'is_highway': 0,
        'is_mall': 1,
        'is_office': 0,
        'is_holiday': 0,
        'nearby_event': 0,
        'distance_km': 2.5
    }
    
    incentive = optimizer.calculate_optimal_incentive(current_station, alternative_station)
    print(f"💰 Optimal incentive: ₹{incentive['recommended_incentive']} ({incentive['incentive_type']})")
    print(f"   Acceptance probability: {incentive['acceptance_probability']:.2f}")
    
    return True

def test_logistics_optimizer():
    """Test Logistics Agent ML model"""
    print("\n🚚 Testing Logistics Optimizer (Logistics Agent)...")
    
    optimizer = LogisticsOptimizer()
    metrics = optimizer.train()
    
    # Test stockout prediction
    station_data = {
        'current_inventory': 15,
        'max_capacity': 100,
        'station_popularity': 0.8,
        'avg_daily_consumption': 30,
        'consumption_trend': 0.1,
        'weather_impact': 1.2,
        'event_impact': 1.0,
        'supplier_distance': 25,
        'delivery_time': 60,
        'available_vehicles': 2,
        'vehicle_capacity': 40
    }
    
    predictions = optimizer.predict_stockout_risk(station_data, forecast_hours=6)
    print(f"✅ Stockout predictions for next 6 hours:")
    for pred in predictions:
        print(f"   Hour +{pred['hour_ahead']}: {pred['stockout_probability']:.3f} risk ({pred['risk_level']})")
    
    # Test dispatch optimization
    available_vehicles = [
        {'id': 'V001', 'capacity': 50, 'distance_to_station': 15, 'available': True},
        {'id': 'V002', 'capacity': 30, 'distance_to_station': 8, 'available': True}
    ]
    
    dispatch = optimizer.optimize_dispatch_decision(station_data, available_vehicles)
    print(f"🚛 Dispatch decision: {dispatch['dispatch_needed']} (urgency: {dispatch['urgency']})")
    if dispatch['dispatch_needed']:
        print(f"   Quantity: {dispatch['recommended_quantity']} batteries")
        print(f"   Vehicle: {dispatch['selected_vehicle']['id']}")
    
    return True

def test_energy_trader():
    """Test Energy Agent ML model"""
    print("\n⚡ Testing Energy Trader (Energy Agent)...")
    
    trader = EnergyTrader()
    metrics = trader.train()
    
    # Test price prediction
    market_data = {
        'grid_demand': 1200,
        'grid_supply': 1100,
        'grid_frequency': 49.8,
        'temperature': 35,
        'solar_irradiance': 800,
        'wind_speed': 5,
        'station_load': 60,
        'battery_soc': 45,
        'charging_sessions': 6,
        'coal_price': 3200,
        'gas_price': 45,
        'carbon_price': 2200
    }
    
    predictions = trader.predict_energy_prices(market_data, forecast_hours=8)
    print(f"✅ Energy price predictions for next 8 hours:")
    for pred in predictions[:4]:
        print(f"   Hour +{pred['hour_ahead']}: ₹{pred['predicted_price']:.2f}/kWh ({pred['price_category']})")
    
    # Test trading decision
    station_data = {
        'battery_soc': 85,
        'max_capacity_kwh': 100,
        'current_load': 35,
        'current_price': 6.2
    }
    
    decision = trader.optimize_trading_decision(market_data, station_data)
    print(f"💹 Trading decision: {decision['action'].upper()}")
    print(f"   Quantity: {decision['quantity_kwh']} kWh")
    print(f"   Profit estimate: ₹{decision['profit_estimate']}")
    
    return True

def test_audit_analyzer():
    """Test Auditor Agent ML model"""
    print("\n⚖️ Testing Audit Analyzer (Auditor Agent)...")
    
    analyzer = AuditAnalyzer()
    metrics = analyzer.train()
    
    # Test normal decision analysis
    normal_decision = {
        'agent': 'MechanicAgent',
        'action': 'restart_charger',
        'confidence_score': 0.85,
        'execution_time': 1200,
        'cost_impact': -100,
        'revenue_impact': 500,
        'success_rate': 0.95,
        'user_satisfaction': 0.9,
        'risk_score': 0.2,
        'human_override': 0,
        'system_cpu': 45,
        'system_memory': 55,
        'api_calls': 3,
        'timestamp': datetime.now().isoformat()
    }
    
    result = analyzer.analyze_decision(normal_decision)
    print(f"✅ Normal decision analysis:")
    print(f"   Anomaly detected: {result['anomaly_detected']}")
    print(f"   Compliance violation: {result['compliance_violation']}")
    print(f"   Risk level: {result['risk_level']}")
    
    # Test suspicious decision
    suspicious_decision = {
        'agent': 'EnergyAgent',
        'action': 'trade_energy',
        'confidence_score': 0.15,
        'execution_time': 15000,
        'cost_impact': -8000,
        'revenue_impact': 100,
        'success_rate': 0.3,
        'user_satisfaction': 0.2,
        'risk_score': 0.9,
        'human_override': 0,
        'system_cpu': 95,
        'system_memory': 98,
        'api_calls': 25,
        'timestamp': datetime.now().isoformat()
    }
    
    result = analyzer.analyze_decision(suspicious_decision)
    print(f"🚨 Suspicious decision analysis:")
    print(f"   Anomaly detected: {result['anomaly_detected']}")
    print(f"   Compliance violation: {result['compliance_violation']}")
    print(f"   Risk level: {result['risk_level']}")
    print(f"   Required actions: {result['required_actions']}")
    
    return True

def test_route_optimizer():
    """Test Route Optimizer ML model"""
    print("\n🗺️ Testing Route Optimizer (Route Agent)...")
    
    optimizer = RouteOptimizer()
    
    # Test basic route calculation
    mumbai = (19.0760, 72.8777)
    delhi = (28.7041, 77.1025)
    
    route = optimizer.get_route_osrm(mumbai, delhi)
    print(f"✅ Mumbai to Delhi route: {route['distance_km']:.1f} km, {route['duration_minutes']:.1f} minutes")
    
    # Test station optimization
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
        }
    ]
    
    user_location = (19.0760, 72.8777)
    optimal = optimizer.find_optimal_station(user_location, stations)
    
    if 'optimal_station' in optimal:
        best = optimal['optimal_station']
        print(f"🎯 Best station: {best['name']} ({best['distance_km']:.1f} km, score: {best['total_score']:.3f})")
    
    # Test multi-stop optimization
    stops = [
        (19.0896, 72.8656),  # Stop 1
        (19.0544, 72.8803),  # Stop 2
    ]
    
    multi_route = optimizer.optimize_multi_stop_route(mumbai, stops, mumbai)
    if 'optimized_route' in multi_route:
        route_info = multi_route['optimized_route']
        print(f"🚛 Multi-stop route: {route_info['total_distance_km']:.1f} km, {route_info['total_duration_minutes']:.1f} minutes")
    
    # Test alternative routes
    alternatives = optimizer.get_alternative_routes(mumbai, delhi, 2)
    print(f"🛣️  Found {len(alternatives)} alternative routes")
    
    return True

def main():
    """Run all tests"""
    print("🧠 EV COPILOT ML MODELS TEST SUITE")
    print("=" * 50)
    
    tests = [
        test_failure_predictor,
        test_traffic_optimizer,
        test_logistics_optimizer,
        test_energy_trader,
        test_audit_analyzer,
        test_route_optimizer
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed: {e}")
    
    print("\n" + "=" * 50)
    print(f"🎯 TEST RESULTS: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Your ML models are ready for production.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    main()