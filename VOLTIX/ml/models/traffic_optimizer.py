"""
Traffic Optimization Model for Traffic Controller Agent
Predicts demand and calculates optimal incentives
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class TrafficOptimizer:
    def __init__(self):
        self.demand_predictor = RandomForestRegressor(
            n_estimators=200,
            random_state=42,
            max_depth=15
        )
        self.wait_time_predictor = GradientBoostingRegressor(
            n_estimators=150,
            random_state=42,
            max_depth=8
        )
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.is_trained = False
        
    def generate_training_data(self, n_samples=15000):
        """Generate synthetic training data for traffic patterns"""
        np.random.seed(42)
        
        # Time features
        hours = np.random.randint(0, 24, n_samples)
        days_of_week = np.random.randint(0, 7, n_samples)  # 0=Monday, 6=Sunday
        months = np.random.randint(1, 13, n_samples)
        
        # Weather conditions
        weather_conditions = np.random.choice(['sunny', 'rainy', 'cloudy', 'stormy'], 
                                            n_samples, p=[0.4, 0.2, 0.3, 0.1])
        temperature = np.random.normal(25, 10, n_samples)
        
        # Station features
        station_capacity = np.random.randint(4, 12, n_samples)
        station_type = np.random.choice(['fast', 'standard', 'ultra'], 
                                      n_samples, p=[0.3, 0.5, 0.2])
        
        # Location features
        is_highway = np.random.choice([0, 1], n_samples, p=[0.7, 0.3])
        is_mall = np.random.choice([0, 1], n_samples, p=[0.8, 0.2])
        is_office = np.random.choice([0, 1], n_samples, p=[0.7, 0.3])
        
        # Event features
        is_holiday = np.random.choice([0, 1], n_samples, p=[0.9, 0.1])
        nearby_event = np.random.choice([0, 1], n_samples, p=[0.85, 0.15])
        
        # Calculate base demand based on patterns
        base_demand = np.zeros(n_samples)
        
        for i in range(n_samples):
            # Hour-based demand (peak hours: 8-10, 17-19)
            if hours[i] in [8, 9, 17, 18]:
                hour_factor = 2.5
            elif hours[i] in [7, 10, 16, 19]:
                hour_factor = 1.8
            elif hours[i] in [11, 12, 13, 14, 15]:
                hour_factor = 1.2
            else:
                hour_factor = 0.5
            
            # Day-based demand (weekdays > weekends)
            if days_of_week[i] < 5:  # Weekday
                day_factor = 1.3
            else:  # Weekend
                day_factor = 0.8
            
            # Weather impact
            if weather_conditions[i] == 'rainy':
                weather_factor = 1.4
            elif weather_conditions[i] == 'stormy':
                weather_factor = 0.6
            else:
                weather_factor = 1.0
            
            # Location impact
            location_factor = 1.0
            if is_highway[i]:
                location_factor *= 1.5
            if is_mall[i]:
                location_factor *= 1.3
            if is_office[i]:
                location_factor *= 1.2
            
            # Event impact
            if is_holiday[i]:
                event_factor = 0.7
            elif nearby_event[i]:
                event_factor = 1.8
            else:
                event_factor = 1.0
            
            # Calculate base demand
            base_demand[i] = (hour_factor * day_factor * weather_factor * 
                            location_factor * event_factor * 
                            np.random.normal(5, 2))  # Base 5 cars ± 2
        
        # Ensure non-negative demand
        base_demand = np.maximum(base_demand, 0)
        
        # Calculate queue length (depends on demand vs capacity)
        queue_length = np.maximum(base_demand - station_capacity, 0)
        
        # Calculate wait time (based on queue and station efficiency)
        efficiency_factor = np.where(station_type == 'ultra', 0.8, 
                                   np.where(station_type == 'fast', 1.0, 1.5))
        wait_time = queue_length * efficiency_factor * np.random.normal(3, 0.5)  # 3 min per car ± 0.5
        wait_time = np.maximum(wait_time, 0)
        
        # Create DataFrame
        data = pd.DataFrame({
            'hour': hours,
            'day_of_week': days_of_week,
            'month': months,
            'weather': weather_conditions,
            'temperature': temperature,
            'station_capacity': station_capacity,
            'station_type': station_type,
            'is_highway': is_highway,
            'is_mall': is_mall,
            'is_office': is_office,
            'is_holiday': is_holiday,
            'nearby_event': nearby_event,
            'demand': base_demand,
            'queue_length': queue_length,
            'wait_time': wait_time
        })
        
        return data
    
    def train(self, data=None):
        """Train the traffic optimization models"""
        if data is None:
            print("Generating synthetic training data...")
            data = self.generate_training_data()
        
        # Encode categorical variables
        categorical_cols = ['weather', 'station_type']
        for col in categorical_cols:
            le = LabelEncoder()
            data[f'{col}_encoded'] = le.fit_transform(data[col])
            self.label_encoders[col] = le
        
        # Prepare features
        feature_cols = ['hour', 'day_of_week', 'month', 'weather_encoded', 
                       'temperature', 'station_capacity', 'station_type_encoded',
                       'is_highway', 'is_mall', 'is_office', 'is_holiday', 'nearby_event']
        
        X = data[feature_cols]
        y_demand = data['demand']
        y_wait = data['wait_time']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_demand_train, y_demand_test, y_wait_train, y_wait_test = train_test_split(
            X_scaled, y_demand, y_wait, test_size=0.2, random_state=42
        )
        
        # Train demand predictor
        print("Training demand predictor...")
        self.demand_predictor.fit(X_train, y_demand_train)
        
        # Train wait time predictor
        print("Training wait time predictor...")
        self.wait_time_predictor.fit(X_train, y_wait_train)
        
        # Evaluate models
        demand_pred = self.demand_predictor.predict(X_test)
        wait_pred = self.wait_time_predictor.predict(X_test)
        
        print("\nDemand Predictor Performance:")
        print(f"MAE: {mean_absolute_error(y_demand_test, demand_pred):.3f}")
        print(f"RMSE: {np.sqrt(mean_squared_error(y_demand_test, demand_pred)):.3f}")
        print(f"R²: {r2_score(y_demand_test, demand_pred):.3f}")
        
        print("\nWait Time Predictor Performance:")
        print(f"MAE: {mean_absolute_error(y_wait_test, wait_pred):.3f}")
        print(f"RMSE: {np.sqrt(mean_squared_error(y_wait_test, wait_pred)):.3f}")
        print(f"R²: {r2_score(y_wait_test, wait_pred):.3f}")
        
        self.is_trained = True
        print("Training completed successfully!")
        
        return {
            'demand_r2': r2_score(y_demand_test, demand_pred),
            'wait_time_r2': r2_score(y_wait_test, wait_pred),
            'demand_feature_importance': dict(zip(feature_cols, self.demand_predictor.feature_importances_)),
            'wait_feature_importance': dict(zip(feature_cols, self.wait_time_predictor.feature_importances_))
        }
    
    def predict_traffic(self, station_data, forecast_hours=4):
        """Predict traffic demand and wait times"""
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        predictions = []
        current_time = datetime.now()
        
        for h in range(forecast_hours):
            future_time = current_time + timedelta(hours=h)
            
            # Prepare input features
            features = np.array([[
                future_time.hour,
                future_time.weekday(),
                future_time.month,
                self.label_encoders['weather'].transform([station_data.get('weather', 'sunny')])[0],
                station_data.get('temperature', 25),
                station_data.get('station_capacity', 8),
                self.label_encoders['station_type'].transform([station_data.get('station_type', 'standard')])[0],
                station_data.get('is_highway', 0),
                station_data.get('is_mall', 0),
                station_data.get('is_office', 0),
                station_data.get('is_holiday', 0),
                station_data.get('nearby_event', 0)
            ]])
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Get predictions
            predicted_demand = self.demand_predictor.predict(features_scaled)[0]
            predicted_wait = self.wait_time_predictor.predict(features_scaled)[0]
            
            predictions.append({
                'hour_ahead': h,
                'timestamp': future_time.isoformat(),
                'predicted_demand': max(0, float(predicted_demand)),
                'predicted_wait_time': max(0, float(predicted_wait)),
                'confidence': self._calculate_confidence(features_scaled)
            })
        
        return predictions
    
    def calculate_optimal_incentive(self, current_station, alternative_station, user_profile=None):
        """Calculate optimal incentive to move user to alternative station"""
        
        # Get current predictions for both stations
        current_pred = self.predict_traffic(current_station, forecast_hours=1)[0]
        alt_pred = self.predict_traffic(alternative_station, forecast_hours=1)[0]
        
        # Calculate time savings
        time_saved = current_pred['predicted_wait_time'] - alt_pred['predicted_wait_time']
        
        # Calculate distance penalty (assume provided in station data)
        extra_distance = alternative_station.get('distance_km', 2)  # Default 2km
        
        # User profile factors
        if user_profile:
            time_value = user_profile.get('time_value_per_minute', 2)  # ₹2 per minute
            distance_cost = user_profile.get('cost_per_km', 5)  # ₹5 per km
            price_sensitivity = user_profile.get('price_sensitivity', 0.5)  # 0-1 scale
        else:
            time_value = 2
            distance_cost = 5
            price_sensitivity = 0.5
        
        # Calculate base incentive needed
        time_benefit = time_saved * time_value
        distance_penalty = extra_distance * distance_cost
        
        # Base incentive = distance penalty - time benefit + margin
        base_incentive = max(0, distance_penalty - time_benefit + 10)  # ₹10 margin
        
        # Adjust for price sensitivity
        final_incentive = base_incentive * (1 + price_sensitivity)
        
        # Calculate acceptance probability
        acceptance_prob = self._calculate_acceptance_probability(
            time_saved, extra_distance, final_incentive, user_profile
        )
        
        return {
            'recommended_incentive': round(final_incentive, 2),
            'incentive_type': self._determine_incentive_type(final_incentive),
            'acceptance_probability': acceptance_prob,
            'time_saved_minutes': round(time_saved, 1),
            'extra_distance_km': extra_distance,
            'cost_benefit_analysis': {
                'time_benefit': round(time_benefit, 2),
                'distance_cost': round(distance_penalty, 2),
                'net_benefit': round(time_benefit - distance_penalty, 2)
            },
            'confidence': 0.85,
            'expires_in_minutes': 15
        }
    
    def _calculate_confidence(self, features):
        """Calculate prediction confidence based on feature similarity to training data"""
        # Simplified confidence calculation
        return 0.85  # Would implement proper confidence intervals in production
    
    def _calculate_acceptance_probability(self, time_saved, distance, incentive, user_profile):
        """Calculate probability user will accept the incentive"""
        # Simplified logistic model for acceptance probability
        if time_saved <= 0:
            return 0.1  # Very low if no time savings
        
        # Base probability increases with incentive and time saved
        base_prob = min(0.9, 0.3 + (incentive / 100) + (time_saved / 30))
        
        # Decrease with distance
        distance_penalty = max(0, distance - 1) * 0.1
        
        return max(0.1, base_prob - distance_penalty)
    
    def _determine_incentive_type(self, incentive_amount):
        """Determine the type of incentive to offer"""
        if incentive_amount <= 20:
            return 'discount_percentage'
        elif incentive_amount <= 50:
            return 'cashback'
        elif incentive_amount <= 100:
            return 'combo_deal'
        else:
            return 'premium_incentive'
    
    def save_model(self, filepath='models/traffic_optimizer.pkl'):
        """Save trained model"""
        model_data = {
            'demand_predictor': self.demand_predictor,
            'wait_time_predictor': self.wait_time_predictor,
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'is_trained': self.is_trained
        }
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath='models/traffic_optimizer.pkl'):
        """Load trained model"""
        model_data = joblib.load(filepath)
        self.demand_predictor = model_data['demand_predictor']
        self.wait_time_predictor = model_data['wait_time_predictor']
        self.scaler = model_data['scaler']
        self.label_encoders = model_data['label_encoders']
        self.is_trained = model_data['is_trained']
        print(f"Model loaded from {filepath}")

# Example usage and testing
if __name__ == "__main__":
    # Initialize and train model
    optimizer = TrafficOptimizer()
    metrics = optimizer.train()
    
    print(f"\nDemand Model R²: {metrics['demand_r2']:.3f}")
    print(f"Wait Time Model R²: {metrics['wait_time_r2']:.3f}")
    
    # Test traffic prediction
    print("\n" + "="*50)
    print("TESTING TRAFFIC PREDICTIONS")
    print("="*50)
    
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
    
    for pred in predictions:
        print(f"Hour +{pred['hour_ahead']}: Demand={pred['predicted_demand']:.1f}, "
              f"Wait={pred['predicted_wait_time']:.1f}min")
    
    # Test incentive calculation
    print("\n" + "="*50)
    print("TESTING INCENTIVE CALCULATION")
    print("="*50)
    
    current_station = {
        'weather': 'sunny',
        'temperature': 28,
        'station_capacity': 6,
        'station_type': 'standard',
        'is_highway': 1,
        'is_mall': 0,
        'is_office': 1,
        'is_holiday': 0,
        'nearby_event': 0
    }
    
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
    
    user_profile = {
        'time_value_per_minute': 3,
        'cost_per_km': 6,
        'price_sensitivity': 0.7
    }
    
    incentive = optimizer.calculate_optimal_incentive(
        current_station, alternative_station, user_profile
    )
    
    print(f"Recommended Incentive: ₹{incentive['recommended_incentive']}")
    print(f"Incentive Type: {incentive['incentive_type']}")
    print(f"Acceptance Probability: {incentive['acceptance_probability']:.2f}")
    print(f"Time Saved: {incentive['time_saved_minutes']} minutes")
    print(f"Extra Distance: {incentive['extra_distance_km']} km")
    
    # Save model
    optimizer.save_model()