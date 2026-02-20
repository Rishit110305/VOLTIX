"""
Dataset Generator for EV Copilot ML Models
Generates realistic synthetic datasets for all 5 agents
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os

class EVCopilotDatasetGenerator:
    def __init__(self, seed=42):
        np.random.seed(seed)
        self.base_date = datetime(2024, 1, 1)
        
    def generate_station_master_data(self, n_stations=50):
        """Generate master data for EV charging stations"""
        
        station_types = ['fast', 'standard', 'ultra']
        cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata']
        
        stations = []
        for i in range(n_stations):
            station = {
                'station_id': f'ST{i+1:03d}',
                'name': f'EV Station {i+1}',
                'city': np.random.choice(cities),
                'station_type': np.random.choice(station_types, p=[0.3, 0.5, 0.2]),
                'capacity': np.random.randint(4, 16),
                'max_inventory': np.random.randint(50, 200),
                'latitude': np.random.uniform(8.0, 35.0),  # India coordinates
                'longitude': np.random.uniform(68.0, 97.0),
                'is_highway': np.random.choice([0, 1], p=[0.7, 0.3]),
                'is_mall': np.random.choice([0, 1], p=[0.8, 0.2]),
                'is_office': np.random.choice([0, 1], p=[0.7, 0.3]),
                'installation_date': (self.base_date - timedelta(days=np.random.randint(30, 1000))).isoformat(),
                'operator': f'Operator_{np.random.randint(1, 10)}'
            }
            stations.append(station)
        
        return pd.DataFrame(stations)
    
    def generate_historical_signals(self, stations_df, days=90, signals_per_hour=6):
        """Generate historical signal data for all stations"""
        
        signals = []
        
        for _, station in stations_df.iterrows():
            station_id = station['station_id']
            capacity = station['capacity']
            max_inventory = station['max_inventory']
            
            # Generate signals for each day
            for day in range(days):
                current_date = self.base_date + timedelta(days=day)
                
                # Daily patterns
                is_weekend = current_date.weekday() >= 5
                is_holiday = np.random.random() < 0.05  # 5% chance of holiday
                
                for hour in range(24):
                    # Hour-based demand patterns
                    if hour in [8, 9, 17, 18, 19]:  # Peak hours
                        base_demand = capacity * 0.8
                    elif hour in [7, 10, 16, 20]:  # Mid-peak
                        base_demand = capacity * 0.6
                    else:  # Off-peak
                        base_demand = capacity * 0.3
                    
                    # Weekend adjustment
                    if is_weekend:
                        base_demand *= 0.7
                    
                    # Holiday adjustment
                    if is_holiday:
                        base_demand *= 0.5
                    
                    # Generate multiple signals per hour
                    for signal_num in range(signals_per_hour):
                        timestamp = current_date.replace(
                            hour=hour, 
                            minute=signal_num * (60 // signals_per_hour)
                        )
                        
                        # Add noise and variations
                        demand_noise = np.random.normal(0, base_demand * 0.2)
                        actual_demand = max(0, base_demand + demand_noise)
                        
                        # Calculate queue (demand vs capacity)
                        queue_length = max(0, actual_demand - capacity)
                        
                        # Inventory simulation
                        consumption_rate = actual_demand * 0.8  # 80% of demand consumes inventory
                        current_inventory = max_inventory - (consumption_rate * (hour + 1))
                        current_inventory = max(0, current_inventory)
                        
                        # Hardware status
                        chargers_up = capacity
                        if np.random.random() < 0.02:  # 2% chance of charger failure
                            chargers_up = np.random.randint(capacity//2, capacity)
                        
                        # Environmental factors
                        temperature = 25 + np.random.normal(0, 10)
                        if current_date.month in [4, 5, 6]:  # Summer
                            temperature += 10
                        elif current_date.month in [12, 1, 2]:  # Winter
                            temperature -= 5
                        
                        voltage = 220 + np.random.normal(0, 10)
                        current = actual_demand * 5 + np.random.normal(0, 5)  # Approximate current
                        
                        # Error simulation
                        error = None
                        if np.random.random() < 0.01:  # 1% chance of error
                            errors = ['PROTOCOL_TIMEOUT', 'VOLTAGE_INSTABILITY', 'OVERHEATING', 'NETWORK_ERROR']
                            error = np.random.choice(errors)
                        
                        signal = {
                            'timestamp': timestamp.isoformat(),
                            'station_id': station_id,
                            'queue_length': round(queue_length, 1),
                            'chargers_up': chargers_up,
                            'total_chargers': capacity,
                            'inventory': round(current_inventory, 0),
                            'max_inventory': max_inventory,
                            'temperature': round(temperature, 1),
                            'voltage': round(voltage, 1),
                            'current': round(current, 1),
                            'error': error,
                            'weather': self._get_weather(current_date, temperature),
                            'is_weekend': is_weekend,
                            'is_holiday': is_holiday,
                            'hour': hour,
                            'day_of_week': current_date.weekday(),
                            'month': current_date.month
                        }
                        
                        signals.append(signal)
        
        return pd.DataFrame(signals)
    
    def generate_agent_decisions(self, signals_df, n_decisions=5000):
        """Generate historical agent decisions"""
        
        agents = ['MechanicAgent', 'TrafficAgent', 'LogisticsAgent', 'EnergyAgent']
        actions = {
            'MechanicAgent': ['restart_charger', 'run_diagnostics', 'schedule_maintenance', 'emergency_shutdown'],
            'TrafficAgent': ['reroute_traffic', 'adjust_pricing', 'send_incentive', 'queue_management'],
            'LogisticsAgent': ['dispatch_inventory', 'rebalance_stock', 'emergency_supply', 'schedule_delivery'],
            'EnergyAgent': ['buy_energy', 'sell_energy', 'optimize_load', 'grid_stabilization']
        }
        
        decisions = []
        
        for i in range(n_decisions):
            # Select random signal as trigger
            trigger_signal = signals_df.sample(1).iloc[0]
            
            agent = np.random.choice(agents)
            action = np.random.choice(actions[agent])
            
            # Generate decision based on agent type
            if agent == 'MechanicAgent':
                confidence = 0.9 if trigger_signal['error'] else np.random.beta(8, 2)
                cost_impact = np.random.normal(-200, 100) if action == 'restart_charger' else np.random.normal(-1000, 500)
                success_rate = 0.95 if not trigger_signal['error'] else np.random.beta(7, 3)
                
            elif agent == 'TrafficAgent':
                confidence = np.random.beta(7, 2)
                cost_impact = np.random.normal(-50, 25)  # Lower cost for traffic actions
                success_rate = np.random.beta(8, 2)
                
            elif agent == 'LogisticsAgent':
                confidence = np.random.beta(6, 2)
                cost_impact = np.random.normal(-500, 200)  # Medium cost for logistics
                success_rate = np.random.beta(7, 2)
                
            else:  # EnergyAgent
                confidence = np.random.beta(6, 3)
                cost_impact = np.random.normal(100, 1000)  # Can be positive (revenue) or negative
                success_rate = np.random.beta(6, 3)
            
            decision = {
                'decision_id': f'DEC_{i+1:06d}',
                'timestamp': trigger_signal['timestamp'],
                'station_id': trigger_signal['station_id'],
                'agent': agent,
                'action': action,
                'trigger_event': trigger_signal['error'] if trigger_signal['error'] else 'routine_monitoring',
                'confidence_score': round(confidence, 3),
                'execution_time': np.random.lognormal(7, 1),  # Log-normal distribution
                'cost_impact': round(cost_impact, 2),
                'revenue_impact': round(np.random.normal(200, 300), 2),
                'success_rate': round(success_rate, 3),
                'user_satisfaction': round(np.random.beta(7, 2), 3),
                'risk_score': round(np.random.beta(2, 8), 3),
                'human_override': 1 if np.random.random() < 0.05 else 0,
                'system_cpu': round(np.random.beta(3, 7) * 100, 1),
                'system_memory': round(np.random.beta(4, 6) * 100, 1),
                'api_calls': np.random.poisson(8),
                'approved_by_supervisor': 1 if np.random.random() < 0.95 else 0
            }
            
            decisions.append(decision)
        
        return pd.DataFrame(decisions)
    
    def generate_energy_market_data(self, days=90):
        """Generate energy market data"""
        
        market_data = []
        
        for day in range(days):
            current_date = self.base_date + timedelta(days=day)
            
            for hour in range(24):
                timestamp = current_date.replace(hour=hour)
                
                # Base grid demand (MW)
                base_demand = 1000
                if hour in [9, 10, 11, 18, 19, 20]:  # Peak hours
                    demand_multiplier = 1.4
                elif hour in [7, 8, 12, 13, 14, 15, 16, 17, 21]:  # Mid-peak
                    demand_multiplier = 1.1
                else:  # Off-peak
                    demand_multiplier = 0.8
                
                grid_demand = base_demand * demand_multiplier + np.random.normal(0, 50)
                grid_supply = grid_demand * np.random.uniform(0.95, 1.15)  # Supply variation
                
                # Weather impact on renewables
                solar_irradiance = max(0, np.random.normal(500, 200)) if 6 <= hour <= 18 else 0
                wind_speed = np.random.uniform(0, 20)
                
                # Fuel prices (daily variation)
                coal_price = 3000 + np.random.normal(0, 100)
                gas_price = 40 + np.random.normal(0, 2)
                
                # Calculate energy price
                base_price = 4.5
                
                # Time-of-use multiplier
                if hour in [9, 10, 11, 18, 19, 20]:
                    time_multiplier = 1.6
                elif hour in [7, 8, 12, 13, 14, 15, 16, 17, 21]:
                    time_multiplier = 1.2
                else:
                    time_multiplier = 0.8
                
                # Supply-demand impact
                supply_demand_ratio = grid_supply / grid_demand
                if supply_demand_ratio < 1.0:
                    supply_multiplier = 1.3
                else:
                    supply_multiplier = 0.9
                
                energy_price = base_price * time_multiplier * supply_multiplier + np.random.normal(0, 0.2)
                energy_price = max(1.0, energy_price)  # Minimum price
                
                market_entry = {
                    'timestamp': timestamp.isoformat(),
                    'grid_demand': round(grid_demand, 1),
                    'grid_supply': round(grid_supply, 1),
                    'grid_frequency': round(50 + np.random.normal(0, 0.2), 2),
                    'energy_price': round(energy_price, 3),
                    'solar_irradiance': round(solar_irradiance, 1),
                    'wind_speed': round(wind_speed, 1),
                    'coal_price': round(coal_price, 2),
                    'gas_price': round(gas_price, 2),
                    'carbon_price': round(2000 + np.random.normal(0, 100), 2),
                    'temperature': round(25 + np.random.normal(0, 8), 1),
                    'hour': hour,
                    'day_of_week': current_date.weekday(),
                    'month': current_date.month
                }
                
                market_data.append(market_entry)
        
        return pd.DataFrame(market_data)
    
    def generate_user_data(self, n_users=1000):
        """Generate user/driver data"""
        
        users = []
        
        for i in range(n_users):
            user = {
                'user_id': f'USR_{i+1:06d}',
                'name': f'User {i+1}',
                'email': f'user{i+1}@example.com',
                'phone': f'+91{np.random.randint(7, 10)}{np.random.randint(100000000, 999999999)}',
                'city': np.random.choice(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad']),
                'vehicle_type': np.random.choice(['car', 'motorcycle', 'truck'], p=[0.7, 0.2, 0.1]),
                'user_segment': np.random.choice(['premium', 'regular', 'budget'], p=[0.2, 0.6, 0.2]),
                'avg_monthly_usage': np.random.normal(15, 5),  # Sessions per month
                'price_sensitivity': np.random.beta(3, 3),  # 0 to 1
                'time_value_per_minute': np.random.uniform(1, 5),  # ₹ per minute
                'registration_date': (self.base_date - timedelta(days=np.random.randint(1, 365))).isoformat(),
                'total_sessions': np.random.randint(5, 200),
                'total_spent': round(np.random.normal(5000, 2000), 2),
                'satisfaction_score': round(np.random.beta(7, 2), 2)
            }
            users.append(user)
        
        return pd.DataFrame(users)
    
    def _get_weather(self, date, temperature):
        """Get weather condition based on temperature and randomness"""
        if temperature > 35:
            return np.random.choice(['sunny', 'hot'], p=[0.7, 0.3])
        elif temperature < 15:
            return np.random.choice(['cloudy', 'cold'], p=[0.6, 0.4])
        else:
            return np.random.choice(['sunny', 'cloudy', 'rainy'], p=[0.6, 0.3, 0.1])
    
    def save_datasets(self, output_dir='datasets'):
        """Generate and save all datasets"""
        
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        print("🏭 Generating station master data...")
        stations_df = self.generate_station_master_data(50)
        stations_df.to_csv(f'{output_dir}/stations.csv', index=False)
        print(f"✅ Saved {len(stations_df)} stations to stations.csv")
        
        print("📡 Generating historical signals...")
        signals_df = self.generate_historical_signals(stations_df, days=90)
        signals_df.to_csv(f'{output_dir}/signals.csv', index=False)
        print(f"✅ Saved {len(signals_df)} signals to signals.csv")
        
        print("🤖 Generating agent decisions...")
        decisions_df = self.generate_agent_decisions(signals_df, 5000)
        decisions_df.to_csv(f'{output_dir}/decisions.csv', index=False)
        print(f"✅ Saved {len(decisions_df)} decisions to decisions.csv")
        
        print("⚡ Generating energy market data...")
        market_df = self.generate_energy_market_data(90)
        market_df.to_csv(f'{output_dir}/energy_market.csv', index=False)
        print(f"✅ Saved {len(market_df)} market records to energy_market.csv")
        
        print("👥 Generating user data...")
        users_df = self.generate_user_data(1000)
        users_df.to_csv(f'{output_dir}/users.csv', index=False)
        print(f"✅ Saved {len(users_df)} users to users.csv")
        
        # Generate summary statistics
        summary = {
            'generation_date': datetime.now().isoformat(),
            'datasets': {
                'stations': len(stations_df),
                'signals': len(signals_df),
                'decisions': len(decisions_df),
                'market_records': len(market_df),
                'users': len(users_df)
            },
            'date_range': {
                'start': self.base_date.isoformat(),
                'end': (self.base_date + timedelta(days=90)).isoformat()
            },
            'description': 'Synthetic datasets for EV Copilot 5-Agent ML System'
        }
        
        with open(f'{output_dir}/dataset_summary.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n🎉 All datasets generated successfully!")
        print(f"📁 Output directory: {output_dir}/")
        print(f"📊 Total records: {sum(summary['datasets'].values()):,}")
        
        return summary

if __name__ == "__main__":
    generator = EVCopilotDatasetGenerator()
    summary = generator.save_datasets()
    
    print("\n📋 DATASET SUMMARY:")
    print("=" * 40)
    for dataset, count in summary['datasets'].items():
        print(f"{dataset.capitalize()}: {count:,} records")
    
    print(f"\n🗓️  Date Range: {summary['date_range']['start'][:10]} to {summary['date_range']['end'][:10]}")
    print("🚀 Ready for ML model training!")