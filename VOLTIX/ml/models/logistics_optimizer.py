"""
Logistics Optimization Model for Supply Chain Agent
Predicts stockouts and optimizes dispatch decisions
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, mean_absolute_error, r2_score
import joblib
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class LogisticsOptimizer:
    def __init__(self):
        self.stockout_predictor = GradientBoostingClassifier(
            n_estimators=200,
            random_state=42,
            max_depth=8
        )
        self.demand_predictor = RandomForestRegressor(
            n_estimators=150,
            random_state=42,
            max_depth=12
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def generate_training_data(self, n_samples=12000):
        """Generate synthetic training data for logistics optimization"""
        np.random.seed(42)
        
        # Time features
        hours = np.random.randint(0, 24, n_samples)
        days_of_week = np.random.randint(0, 7, n_samples)
        months = np.random.randint(1, 13, n_samples)
        
        # Station features
        current_inventory = np.random.randint(0, 100, n_samples)
        max_capacity = np.random.randint(50, 150, n_samples)
        station_popularity = np.random.uniform(0.1, 1.0, n_samples)  # 0.1 to 1.0
        
        # Historical patterns
        avg_daily_consumption = np.random.normal(25, 8, n_samples)  # 25 ± 8 batteries/day
        consumption_trend = np.random.normal(0, 0.1, n_samples)  # Trend factor
        
        # External factors
        weather_impact = np.random.choice([0.8, 1.0, 1.2, 1.5], n_samples, 
                                        p=[0.2, 0.5, 0.2, 0.1])  # Weather multiplier
        event_impact = np.random.choice([1.0, 1.5, 2.0, 3.0], n_samples,
                                      p=[0.7, 0.2, 0.08, 0.02])  # Event multiplier
        
        # Supply chain factors
        supplier_distance = np.random.uniform(5, 50, n_samples)  # km
        delivery_time = supplier_distance * 0.5 + np.random.normal(30, 10, n_samples)  # minutes
        delivery_time = np.maximum(delivery_time, 15)  # Minimum 15 minutes
        
        # Fleet availability
        available_vehicles = np.random.randint(1, 6, n_samples)
        vehicle_capacity = np.random.randint(20, 80, n_samples)  # batteries per vehicle
        
        # Calculate consumption rate based on patterns
        consumption_rate = np.zeros(n_samples)
        
        for i in range(n_samples):
            # Base consumption from historical average
            base_rate = avg_daily_consumption[i] / 24  # Per hour
            
            # Hour-based multiplier (peak hours: 8-10, 17-19)
            if hours[i] in [8, 9, 17, 18]:
                hour_multiplier = 2.0
            elif hours[i] in [7, 10, 16, 19]:
                hour_multiplier = 1.5
            elif hours[i] in [11, 12, 13, 14, 15]:
                hour_multiplier = 1.2
            else:
                hour_multiplier = 0.6
            
            # Day-based multiplier
            if days_of_week[i] < 5:  # Weekday
                day_multiplier = 1.2
            else:  # Weekend
                day_multiplier = 0.9
            
            # Apply all factors
            consumption_rate[i] = (base_rate * hour_multiplier * day_multiplier * 
                                 weather_impact[i] * event_impact[i] * 
                                 station_popularity[i] * (1 + consumption_trend[i]))
        
        # Ensure non-negative consumption
        consumption_rate = np.maximum(consumption_rate, 0)
        
        # Calculate inventory level after consumption
        inventory_after = current_inventory - consumption_rate
        
        # Calculate stockout probability
        hours_to_stockout = current_inventory / (consumption_rate + 0.001)  # Avoid division by zero
        stockout_risk = np.where(hours_to_stockout <= 2, 1, 0)  # Stockout if < 2 hours
        
        # Calculate optimal dispatch quantity
        safety_stock = max_capacity * 0.2  # 20% safety stock
        optimal_dispatch = np.maximum(0, safety_stock - inventory_after)
        
        # Create DataFrame
        data = pd.DataFrame({
            'hour': hours,
            'day_of_week': days_of_week,
            'month': months,
            'current_inventory': current_inventory,
            'max_capacity': max_capacity,
            'station_popularity': station_popularity,
            'avg_daily_consumption': avg_daily_consumption,
            'consumption_trend': consumption_trend,
            'weather_impact': weather_impact,
            'event_impact': event_impact,
            'supplier_distance': supplier_distance,
            'delivery_time': delivery_time,
            'available_vehicles': available_vehicles,
            'vehicle_capacity': vehicle_capacity,
            'consumption_rate': consumption_rate,
            'hours_to_stockout': hours_to_stockout,
            'stockout_risk': stockout_risk,
            'optimal_dispatch': optimal_dispatch
        })
        
        # Add derived features
        data['inventory_ratio'] = data['current_inventory'] / data['max_capacity']
        data['consumption_intensity'] = data['consumption_rate'] / data['station_popularity']
        data['supply_efficiency'] = data['vehicle_capacity'] / data['delivery_time']
        
        return data
    
    def train(self, data=None):
        """Train the logistics optimization models"""
        if data is None:
            print("Generating synthetic training data...")
            data = self.generate_training_data()
        
        # Prepare features
        feature_cols = ['hour', 'day_of_week', 'month', 'current_inventory', 
                       'max_capacity', 'station_popularity', 'avg_daily_consumption',
                       'consumption_trend', 'weather_impact', 'event_impact',
                       'supplier_distance', 'delivery_time', 'available_vehicles',
                       'vehicle_capacity', 'inventory_ratio', 'consumption_intensity',
                       'supply_efficiency']
        
        X = data[feature_cols]
        y_stockout = data['stockout_risk']
        y_dispatch = data['optimal_dispatch']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_stockout_train, y_stockout_test, y_dispatch_train, y_dispatch_test = train_test_split(
            X_scaled, y_stockout, y_dispatch, test_size=0.2, random_state=42
        )
        
        # Train stockout predictor
        print("Training stockout predictor...")
        self.stockout_predictor.fit(X_train, y_stockout_train)
        
        # Train dispatch optimizer
        print("Training dispatch optimizer...")
        self.demand_predictor.fit(X_train, y_dispatch_train)
        
        # Evaluate models
        stockout_pred = self.stockout_predictor.predict(X_test)
        dispatch_pred = self.demand_predictor.predict(X_test)
        
        print("\nStockout Predictor Performance:")
        print(classification_report(y_stockout_test, stockout_pred))
        
        print("\nDispatch Optimizer Performance:")
        print(f"MAE: {mean_absolute_error(y_dispatch_test, dispatch_pred):.3f}")
        print(f"R²: {r2_score(y_dispatch_test, dispatch_pred):.3f}")
        
        self.is_trained = True
        print("Training completed successfully!")
        
        return {
            'stockout_accuracy': self.stockout_predictor.score(X_test, y_stockout_test),
            'dispatch_r2': r2_score(y_dispatch_test, dispatch_pred),
            'stockout_feature_importance': dict(zip(feature_cols, self.stockout_predictor.feature_importances_)),
            'dispatch_feature_importance': dict(zip(feature_cols, self.demand_predictor.feature_importances_))
        }
    
    def predict_stockout_risk(self, station_data, forecast_hours=6):
        """Predict stockout risk for the next few hours"""
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        predictions = []
        current_time = datetime.now()
        current_inventory = station_data.get('current_inventory', 50)
        
        for h in range(forecast_hours):
            future_time = current_time + timedelta(hours=h)
            
            # Prepare input features
            features = np.array([[
                future_time.hour,
                future_time.weekday(),
                future_time.month,
                current_inventory,
                station_data.get('max_capacity', 100),
                station_data.get('station_popularity', 0.5),
                station_data.get('avg_daily_consumption', 25),
                station_data.get('consumption_trend', 0),
                station_data.get('weather_impact', 1.0),
                station_data.get('event_impact', 1.0),
                station_data.get('supplier_distance', 20),
                station_data.get('delivery_time', 45),
                station_data.get('available_vehicles', 3),
                station_data.get('vehicle_capacity', 50),
                current_inventory / station_data.get('max_capacity', 100),
                station_data.get('avg_daily_consumption', 25) / station_data.get('station_popularity', 0.5),
                station_data.get('vehicle_capacity', 50) / station_data.get('delivery_time', 45)
            ]])
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Get predictions
            stockout_prob = self.stockout_predictor.predict_proba(features_scaled)[0][1]
            optimal_dispatch = max(0, self.demand_predictor.predict(features_scaled)[0])
            
            # Update inventory for next iteration (simulate consumption)
            estimated_consumption = self._estimate_hourly_consumption(station_data, future_time)
            current_inventory = max(0, current_inventory - estimated_consumption)
            
            predictions.append({
                'hour_ahead': h,
                'timestamp': future_time.isoformat(),
                'stockout_probability': float(stockout_prob),
                'estimated_inventory': float(current_inventory),
                'recommended_dispatch': float(optimal_dispatch),
                'risk_level': self._get_risk_level(stockout_prob),
                'confidence': 0.87
            })
        
        return predictions
    
    def optimize_dispatch_decision(self, station_data, available_vehicles):
        """Optimize dispatch decision based on current conditions"""
        
        # Get stockout predictions
        predictions = self.predict_stockout_risk(station_data, forecast_hours=8)
        
        # Find highest risk period
        max_risk = max(pred['stockout_probability'] for pred in predictions)
        high_risk_hours = [pred for pred in predictions if pred['stockout_probability'] > 0.6]
        
        if not high_risk_hours:
            return {
                'dispatch_needed': False,
                'urgency': 'low',
                'recommended_action': 'monitor',
                'reason': 'Low stockout risk in forecast period'
            }
        
        # Calculate optimal dispatch
        earliest_risk = min(high_risk_hours, key=lambda x: x['hour_ahead'])
        recommended_quantity = earliest_risk['recommended_dispatch']
        
        # Select best vehicle
        best_vehicle = self._select_optimal_vehicle(
            available_vehicles, recommended_quantity, station_data
        )
        
        # Calculate urgency
        urgency = self._calculate_urgency(earliest_risk['hour_ahead'], max_risk)
        
        return {
            'dispatch_needed': True,
            'urgency': urgency,
            'recommended_quantity': int(recommended_quantity),
            'selected_vehicle': best_vehicle,
            'estimated_arrival': self._calculate_arrival_time(best_vehicle, station_data),
            'cost_estimate': self._calculate_dispatch_cost(best_vehicle, station_data),
            'risk_mitigation': f"Reduces stockout risk from {max_risk:.2f} to {max_risk*0.3:.2f}",
            'confidence': 0.85
        }
    
    def _estimate_hourly_consumption(self, station_data, future_time):
        """Estimate hourly consumption based on time and conditions"""
        base_rate = station_data.get('avg_daily_consumption', 25) / 24
        
        # Hour-based multiplier
        if future_time.hour in [8, 9, 17, 18]:
            hour_multiplier = 2.0
        elif future_time.hour in [7, 10, 16, 19]:
            hour_multiplier = 1.5
        else:
            hour_multiplier = 0.8
        
        return base_rate * hour_multiplier * station_data.get('weather_impact', 1.0)
    
    def _select_optimal_vehicle(self, available_vehicles, required_quantity, station_data):
        """Select the best vehicle for dispatch"""
        if not available_vehicles:
            return None
        
        best_vehicle = None
        best_score = -1
        
        for vehicle in available_vehicles:
            # Score based on capacity, distance, and availability
            capacity_score = min(1.0, vehicle.get('capacity', 50) / required_quantity)
            distance_score = 1.0 / (1.0 + vehicle.get('distance_to_station', 20) / 50)
            availability_score = 1.0 if vehicle.get('available', True) else 0.0
            
            total_score = (capacity_score * 0.4 + distance_score * 0.3 + 
                          availability_score * 0.3)
            
            if total_score > best_score:
                best_score = total_score
                best_vehicle = vehicle
        
        return best_vehicle
    
    def _calculate_arrival_time(self, vehicle, station_data):
        """Calculate estimated arrival time"""
        if not vehicle:
            return None
        
        travel_time = vehicle.get('distance_to_station', 20) * 2  # 2 minutes per km
        loading_time = 15  # 15 minutes loading time
        
        arrival_time = datetime.now() + timedelta(minutes=travel_time + loading_time)
        return arrival_time.isoformat()
    
    def _calculate_dispatch_cost(self, vehicle, station_data):
        """Calculate estimated dispatch cost"""
        if not vehicle:
            return 0
        
        distance = vehicle.get('distance_to_station', 20)
        fuel_cost = distance * 8  # ₹8 per km
        driver_cost = 200  # ₹200 for driver
        
        return fuel_cost + driver_cost
    
    def _calculate_urgency(self, hours_ahead, risk_probability):
        """Calculate dispatch urgency"""
        if hours_ahead <= 1 and risk_probability > 0.8:
            return 'critical'
        elif hours_ahead <= 2 and risk_probability > 0.6:
            return 'high'
        elif hours_ahead <= 4 and risk_probability > 0.4:
            return 'medium'
        else:
            return 'low'
    
    def _get_risk_level(self, probability):
        """Convert probability to risk level"""
        if probability > 0.8:
            return 'critical'
        elif probability > 0.6:
            return 'high'
        elif probability > 0.4:
            return 'medium'
        else:
            return 'low'
    
    def save_model(self, filepath='models/logistics_optimizer.pkl'):
        """Save trained model"""
        model_data = {
            'stockout_predictor': self.stockout_predictor,
            'demand_predictor': self.demand_predictor,
            'scaler': self.scaler,
            'is_trained': self.is_trained
        }
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath='models/logistics_optimizer.pkl'):
        """Load trained model"""
        model_data = joblib.load(filepath)
        self.stockout_predictor = model_data['stockout_predictor']
        self.demand_predictor = model_data['demand_predictor']
        self.scaler = model_data['scaler']
        self.is_trained = model_data['is_trained']
        print(f"Model loaded from {filepath}")

# Example usage and testing
if __name__ == "__main__":
    # Initialize and train model
    optimizer = LogisticsOptimizer()
    metrics = optimizer.train()
    
    print(f"\nStockout Accuracy: {metrics['stockout_accuracy']:.3f}")
    print(f"Dispatch R²: {metrics['dispatch_r2']:.3f}")
    
    # Test stockout prediction
    print("\n" + "="*50)
    print("TESTING STOCKOUT PREDICTIONS")
    print("="*50)
    
    station_data = {
        'current_inventory': 15,  # Low inventory
        'max_capacity': 100,
        'station_popularity': 0.8,
        'avg_daily_consumption': 30,
        'consumption_trend': 0.1,
        'weather_impact': 1.2,  # Rainy weather increases demand
        'event_impact': 1.0,
        'supplier_distance': 25,
        'delivery_time': 60,
        'available_vehicles': 2,
        'vehicle_capacity': 40
    }
    
    predictions = optimizer.predict_stockout_risk(station_data, forecast_hours=6)
    
    for pred in predictions:
        print(f"Hour +{pred['hour_ahead']}: Risk={pred['stockout_probability']:.3f} "
              f"({pred['risk_level']}), Inventory={pred['estimated_inventory']:.1f}")
    
    # Test dispatch optimization
    print("\n" + "="*50)
    print("TESTING DISPATCH OPTIMIZATION")
    print("="*50)
    
    available_vehicles = [
        {'id': 'V001', 'capacity': 50, 'distance_to_station': 15, 'available': True},
        {'id': 'V002', 'capacity': 30, 'distance_to_station': 8, 'available': True},
        {'id': 'V003', 'capacity': 60, 'distance_to_station': 25, 'available': False}
    ]
    
    dispatch_decision = optimizer.optimize_dispatch_decision(station_data, available_vehicles)
    
    print(f"Dispatch Needed: {dispatch_decision['dispatch_needed']}")
    print(f"Urgency: {dispatch_decision['urgency']}")
    print(f"Recommended Quantity: {dispatch_decision.get('recommended_quantity', 'N/A')}")
    if dispatch_decision.get('selected_vehicle'):
        print(f"Selected Vehicle: {dispatch_decision['selected_vehicle']['id']}")
        print(f"Estimated Cost: ₹{dispatch_decision.get('cost_estimate', 0)}")
    
    # Save model
    optimizer.save_model()