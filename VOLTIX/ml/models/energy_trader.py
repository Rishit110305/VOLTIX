"""
Energy Trading Model for Energy Broker Agent
Predicts energy prices and optimizes trading decisions
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class EnergyTrader:
    def __init__(self):
        self.price_predictor = GradientBoostingRegressor(
            n_estimators=200,
            random_state=42,
            max_depth=8,
            learning_rate=0.1
        )
        self.demand_predictor = RandomForestRegressor(
            n_estimators=150,
            random_state=42,
            max_depth=12
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def generate_training_data(self, n_samples=15000):
        """Generate synthetic training data for energy trading"""
        np.random.seed(42)
        
        # Time features
        hours = np.random.randint(0, 24, n_samples)
        days_of_week = np.random.randint(0, 7, n_samples)
        months = np.random.randint(1, 13, n_samples)
        
        # Grid conditions
        grid_demand = np.random.normal(1000, 200, n_samples)  # MW
        grid_supply = np.random.normal(1100, 150, n_samples)  # MW
        grid_frequency = np.random.normal(50, 0.5, n_samples)  # Hz
        
        # Weather conditions (affects renewable generation)
        temperature = np.random.normal(25, 10, n_samples)
        solar_irradiance = np.random.uniform(0, 1000, n_samples)  # W/m²
        wind_speed = np.random.uniform(0, 20, n_samples)  # m/s
        
        # Station conditions
        station_load = np.random.normal(50, 15, n_samples)  # kW
        battery_soc = np.random.uniform(20, 100, n_samples)  # State of charge %
        charging_sessions = np.random.randint(0, 8, n_samples)
        
        # Market conditions
        coal_price = np.random.normal(3000, 500, n_samples)  # ₹/ton
        gas_price = np.random.normal(40, 8, n_samples)  # ₹/MMBtu
        carbon_price = np.random.normal(2000, 400, n_samples)  # ₹/ton CO2
        
        # Calculate base energy price
        base_price = np.zeros(n_samples)
        
        for i in range(n_samples):
            # Time-of-use pricing
            if hours[i] in [9, 10, 11, 18, 19, 20]:  # Peak hours
                time_multiplier = 1.8
            elif hours[i] in [7, 8, 12, 13, 14, 15, 16, 17, 21]:  # Mid-peak
                time_multiplier = 1.2
            else:  # Off-peak
                time_multiplier = 0.7
            
            # Day-based pricing
            if days_of_week[i] < 5:  # Weekday
                day_multiplier = 1.1
            else:  # Weekend
                day_multiplier = 0.9
            
            # Season-based pricing
            if months[i] in [5, 6, 7, 8]:  # Summer (high AC demand)
                season_multiplier = 1.3
            elif months[i] in [12, 1, 2]:  # Winter
                season_multiplier = 1.1
            else:
                season_multiplier = 1.0
            
            # Supply-demand balance
            supply_demand_ratio = grid_supply[i] / grid_demand[i]
            if supply_demand_ratio < 0.95:  # Supply shortage
                supply_multiplier = 1.5
            elif supply_demand_ratio > 1.1:  # Excess supply
                supply_multiplier = 0.8
            else:
                supply_multiplier = 1.0
            
            # Renewable generation impact
            renewable_factor = (solar_irradiance[i] / 1000 + wind_speed[i] / 20) / 2
            renewable_multiplier = 1.0 - (renewable_factor * 0.3)  # More renewables = lower price
            
            # Fuel cost impact
            fuel_cost_factor = (coal_price[i] / 3000 + gas_price[i] / 40) / 2
            fuel_multiplier = 0.8 + (fuel_cost_factor * 0.4)
            
            # Base price calculation (₹/kWh)
            base_price[i] = (4.5 * time_multiplier * day_multiplier * season_multiplier * 
                           supply_multiplier * renewable_multiplier * fuel_multiplier)
        
        # Add noise and ensure positive prices
        base_price = base_price + np.random.normal(0, 0.5, n_samples)
        base_price = np.maximum(base_price, 1.0)  # Minimum ₹1/kWh
        
        # Calculate optimal actions
        # Buy when price is low and battery SOC is low
        # Sell when price is high and battery SOC is high
        buy_signal = ((base_price < np.percentile(base_price, 30)) & 
                     (battery_soc < 60)).astype(int)
        sell_signal = ((base_price > np.percentile(base_price, 70)) & 
                      (battery_soc > 80)).astype(int)
        
        # Calculate potential profit
        avg_price = np.mean(base_price)
        profit_potential = np.where(sell_signal, (base_price - avg_price) * 10,  # 10 kWh sell
                                  np.where(buy_signal, (avg_price - base_price) * 10, 0))
        
        # Create DataFrame
        data = pd.DataFrame({
            'hour': hours,
            'day_of_week': days_of_week,
            'month': months,
            'grid_demand': grid_demand,
            'grid_supply': grid_supply,
            'grid_frequency': grid_frequency,
            'temperature': temperature,
            'solar_irradiance': solar_irradiance,
            'wind_speed': wind_speed,
            'station_load': station_load,
            'battery_soc': battery_soc,
            'charging_sessions': charging_sessions,
            'coal_price': coal_price,
            'gas_price': gas_price,
            'carbon_price': carbon_price,
            'energy_price': base_price,
            'buy_signal': buy_signal,
            'sell_signal': sell_signal,
            'profit_potential': profit_potential
        })
        
        # Add derived features
        data['supply_demand_ratio'] = data['grid_supply'] / data['grid_demand']
        data['renewable_index'] = (data['solar_irradiance'] / 1000 + data['wind_speed'] / 20) / 2
        data['load_factor'] = data['station_load'] / data['charging_sessions'].replace(0, 1)
        data['price_volatility'] = data['energy_price'].rolling(window=24, min_periods=1).std().fillna(0)
        
        return data
    
    def train(self, data=None):
        """Train the energy trading models"""
        if data is None:
            print("Generating synthetic training data...")
            data = self.generate_training_data()
        
        # Prepare features
        feature_cols = ['hour', 'day_of_week', 'month', 'grid_demand', 'grid_supply',
                       'grid_frequency', 'temperature', 'solar_irradiance', 'wind_speed',
                       'station_load', 'battery_soc', 'charging_sessions', 'coal_price',
                       'gas_price', 'carbon_price', 'supply_demand_ratio', 'renewable_index',
                       'load_factor']
        
        X = data[feature_cols]
        y_price = data['energy_price']
        y_demand = data['station_load']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_price_train, y_price_test, y_demand_train, y_demand_test = train_test_split(
            X_scaled, y_price, y_demand, test_size=0.2, random_state=42
        )
        
        # Train price predictor
        print("Training price predictor...")
        self.price_predictor.fit(X_train, y_price_train)
        
        # Train demand predictor
        print("Training demand predictor...")
        self.demand_predictor.fit(X_train, y_demand_train)
        
        # Evaluate models
        price_pred = self.price_predictor.predict(X_test)
        demand_pred = self.demand_predictor.predict(X_test)
        
        print("\nPrice Predictor Performance:")
        print(f"MAE: ₹{mean_absolute_error(y_price_test, price_pred):.3f}/kWh")
        print(f"RMSE: ₹{np.sqrt(mean_squared_error(y_price_test, price_pred)):.3f}/kWh")
        print(f"R²: {r2_score(y_price_test, price_pred):.3f}")
        
        print("\nDemand Predictor Performance:")
        print(f"MAE: {mean_absolute_error(y_demand_test, demand_pred):.3f} kW")
        print(f"R²: {r2_score(y_demand_test, demand_pred):.3f}")
        
        self.is_trained = True
        print("Training completed successfully!")
        
        return {
            'price_r2': r2_score(y_price_test, price_pred),
            'demand_r2': r2_score(y_demand_test, demand_pred),
            'price_mae': mean_absolute_error(y_price_test, price_pred),
            'price_feature_importance': dict(zip(feature_cols, self.price_predictor.feature_importances_))
        }
    
    def predict_energy_prices(self, market_data, forecast_hours=24):
        """Predict energy prices for the next few hours"""
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
                market_data.get('grid_demand', 1000),
                market_data.get('grid_supply', 1100),
                market_data.get('grid_frequency', 50),
                market_data.get('temperature', 25),
                market_data.get('solar_irradiance', 500),
                market_data.get('wind_speed', 10),
                market_data.get('station_load', 50),
                market_data.get('battery_soc', 60),
                market_data.get('charging_sessions', 4),
                market_data.get('coal_price', 3000),
                market_data.get('gas_price', 40),
                market_data.get('carbon_price', 2000),
                market_data.get('grid_supply', 1100) / market_data.get('grid_demand', 1000),
                (market_data.get('solar_irradiance', 500) / 1000 + 
                 market_data.get('wind_speed', 10) / 20) / 2,
                market_data.get('station_load', 50) / max(market_data.get('charging_sessions', 1), 1)
            ]])
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Get predictions
            predicted_price = self.price_predictor.predict(features_scaled)[0]
            predicted_demand = self.demand_predictor.predict(features_scaled)[0]
            
            predictions.append({
                'hour_ahead': h,
                'timestamp': future_time.isoformat(),
                'predicted_price': max(1.0, float(predicted_price)),  # Minimum ₹1/kWh
                'predicted_demand': max(0, float(predicted_demand)),
                'price_category': self._categorize_price(predicted_price),
                'confidence': 0.85
            })
        
        return predictions
    
    def optimize_trading_decision(self, market_data, station_data):
        """Optimize energy trading decision"""
        
        # Get price predictions
        price_predictions = self.predict_energy_prices(market_data, forecast_hours=8)
        
        current_price = price_predictions[0]['predicted_price']
        future_prices = [p['predicted_price'] for p in price_predictions[1:]]
        avg_future_price = np.mean(future_prices)
        
        # Current station state
        battery_soc = station_data.get('battery_soc', 60)
        max_capacity = station_data.get('max_capacity_kwh', 100)
        current_load = station_data.get('current_load', 30)
        
        # Decision logic
        decision = self._make_trading_decision(
            current_price, avg_future_price, battery_soc, current_load
        )
        
        # Calculate potential profit
        profit_estimate = self._calculate_profit_estimate(
            decision, current_price, avg_future_price, station_data
        )
        
        return {
            'action': decision['action'],
            'quantity_kwh': decision['quantity'],
            'current_price': round(current_price, 3),
            'expected_future_price': round(avg_future_price, 3),
            'profit_estimate': round(profit_estimate, 2),
            'confidence': decision['confidence'],
            'reasoning': decision['reasoning'],
            'risk_level': decision['risk_level'],
            'execution_time': 'immediate' if decision['urgent'] else 'within_hour'
        }
    
    def _make_trading_decision(self, current_price, future_price, battery_soc, current_load):
        """Make trading decision based on conditions"""
        
        price_diff = future_price - current_price
        price_threshold = 0.5  # ₹0.5/kWh threshold
        
        # Buy decision (when price is low and will increase)
        if (current_price < 4.0 and price_diff > price_threshold and 
            battery_soc < 70 and current_load < 40):
            return {
                'action': 'buy',
                'quantity': min(30, (100 - battery_soc) * 0.5),  # Buy up to 30 kWh
                'confidence': 0.8,
                'reasoning': f'Low current price (₹{current_price:.2f}) with expected increase to ₹{future_price:.2f}',
                'risk_level': 'low',
                'urgent': current_price < 3.0
            }
        
        # Sell decision (when price is high and will decrease)
        elif (current_price > 5.0 and price_diff < -price_threshold and 
              battery_soc > 80 and current_load < 60):
            return {
                'action': 'sell',
                'quantity': min(25, (battery_soc - 50) * 0.4),  # Sell up to 25 kWh
                'confidence': 0.85,
                'reasoning': f'High current price (₹{current_price:.2f}) with expected decrease to ₹{future_price:.2f}',
                'risk_level': 'low',
                'urgent': current_price > 6.0
            }
        
        # Hold decision
        else:
            return {
                'action': 'hold',
                'quantity': 0,
                'confidence': 0.7,
                'reasoning': f'Price conditions not favorable for trading (current: ₹{current_price:.2f}, future: ₹{future_price:.2f})',
                'risk_level': 'none',
                'urgent': False
            }
    
    def _calculate_profit_estimate(self, decision, current_price, future_price, station_data):
        """Calculate estimated profit from trading decision"""
        
        if decision['action'] == 'buy':
            # Profit from buying now and selling later
            return decision['quantity'] * (future_price - current_price) * 0.9  # 90% efficiency
        
        elif decision['action'] == 'sell':
            # Profit from selling now vs future
            return decision['quantity'] * (current_price - future_price) * 0.9
        
        else:
            return 0
    
    def _categorize_price(self, price):
        """Categorize price level"""
        if price < 3.5:
            return 'very_low'
        elif price < 4.5:
            return 'low'
        elif price < 5.5:
            return 'medium'
        elif price < 6.5:
            return 'high'
        else:
            return 'very_high'
    
    def calculate_arbitrage_opportunity(self, station_data, nearby_stations):
        """Calculate arbitrage opportunities with nearby stations"""
        opportunities = []
        
        for station in nearby_stations:
            # Compare prices and conditions
            price_diff = station.get('current_price', 5.0) - station_data.get('current_price', 5.0)
            distance = station.get('distance_km', 5)
            
            if abs(price_diff) > 0.5 and distance < 10:  # Significant price difference
                transport_cost = distance * 0.1  # ₹0.1 per km per kWh
                net_profit = abs(price_diff) - transport_cost
                
                if net_profit > 0.2:  # Minimum ₹0.2/kWh profit
                    opportunities.append({
                        'station_id': station.get('id'),
                        'action': 'buy_from' if price_diff > 0 else 'sell_to',
                        'price_difference': round(price_diff, 3),
                        'transport_cost': round(transport_cost, 3),
                        'net_profit_per_kwh': round(net_profit, 3),
                        'recommended_quantity': min(20, station.get('available_capacity', 10)),
                        'total_profit_estimate': round(net_profit * 20, 2)
                    })
        
        return sorted(opportunities, key=lambda x: x['net_profit_per_kwh'], reverse=True)
    
    def save_model(self, filepath='models/energy_trader.pkl'):
        """Save trained model"""
        model_data = {
            'price_predictor': self.price_predictor,
            'demand_predictor': self.demand_predictor,
            'scaler': self.scaler,
            'is_trained': self.is_trained
        }
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath='models/energy_trader.pkl'):
        """Load trained model"""
        model_data = joblib.load(filepath)
        self.price_predictor = model_data['price_predictor']
        self.demand_predictor = model_data['demand_predictor']
        self.scaler = model_data['scaler']
        self.is_trained = model_data['is_trained']
        print(f"Model loaded from {filepath}")

# Example usage and testing
if __name__ == "__main__":
    # Initialize and train model
    trader = EnergyTrader()
    metrics = trader.train()
    
    print(f"\nPrice Prediction R²: {metrics['price_r2']:.3f}")
    print(f"Price Prediction MAE: ₹{metrics['price_mae']:.3f}/kWh")
    
    # Test price prediction
    print("\n" + "="*50)
    print("TESTING PRICE PREDICTIONS")
    print("="*50)
    
    market_data = {
        'grid_demand': 1200,  # High demand
        'grid_supply': 1100,  # Lower supply
        'grid_frequency': 49.8,
        'temperature': 35,    # Hot day
        'solar_irradiance': 800,
        'wind_speed': 5,      # Low wind
        'station_load': 60,
        'battery_soc': 45,
        'charging_sessions': 6,
        'coal_price': 3200,
        'gas_price': 45,
        'carbon_price': 2200
    }
    
    predictions = trader.predict_energy_prices(market_data, forecast_hours=8)
    
    for pred in predictions[:4]:  # Show first 4 hours
        print(f"Hour +{pred['hour_ahead']}: ₹{pred['predicted_price']:.2f}/kWh "
              f"({pred['price_category']})")
    
    # Test trading decision
    print("\n" + "="*50)
    print("TESTING TRADING DECISIONS")
    print("="*50)
    
    station_data = {
        'battery_soc': 85,     # High SOC
        'max_capacity_kwh': 100,
        'current_load': 35,
        'current_price': 6.2   # High price
    }
    
    decision = trader.optimize_trading_decision(market_data, station_data)
    
    print(f"Recommended Action: {decision['action'].upper()}")
    print(f"Quantity: {decision['quantity_kwh']} kWh")
    print(f"Current Price: ₹{decision['current_price']}/kWh")
    print(f"Expected Future Price: ₹{decision['expected_future_price']}/kWh")
    print(f"Profit Estimate: ₹{decision['profit_estimate']}")
    print(f"Reasoning: {decision['reasoning']}")
    
    # Save model
    trader.save_model()