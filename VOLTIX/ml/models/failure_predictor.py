"""
Failure Prediction Model for Mechanic Agent
Predicts hardware failures and anomalies for self-healing
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import json
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class FailurePredictor:
    def __init__(self):
        self.anomaly_detector = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        self.failure_classifier = RandomForestClassifier(
            n_estimators=200,
            random_state=42,
            max_depth=10
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def generate_training_data(self, n_samples=10000):
        """Generate synthetic training data for charger failures"""
        np.random.seed(42)
        
        # Normal operating conditions
        normal_temp = np.random.normal(25, 5, n_samples//2)  # 25°C ± 5°C
        normal_voltage = np.random.normal(220, 10, n_samples//2)  # 220V ± 10V
        normal_current = np.random.normal(30, 5, n_samples//2)  # 30A ± 5A
        normal_vibration = np.random.normal(0.1, 0.05, n_samples//2)  # Low vibration
        normal_humidity = np.random.normal(45, 10, n_samples//2)  # 45% ± 10%
        normal_uptime = np.random.normal(95, 5, n_samples//2)  # 95% uptime
        normal_error_rate = np.random.exponential(0.1, n_samples//2)  # Low error rate
        
        # Failure conditions
        failure_temp = np.random.normal(65, 15, n_samples//2)  # Overheating
        failure_voltage = np.random.normal(180, 30, n_samples//2)  # Voltage drops
        failure_current = np.random.normal(45, 15, n_samples//2)  # Current spikes
        failure_vibration = np.random.normal(0.8, 0.3, n_samples//2)  # High vibration
        failure_humidity = np.random.normal(75, 15, n_samples//2)  # High humidity
        failure_uptime = np.random.normal(60, 20, n_samples//2)  # Low uptime
        failure_error_rate = np.random.exponential(2, n_samples//2)  # High error rate
        
        # Combine data
        temperature = np.concatenate([normal_temp, failure_temp])
        voltage = np.concatenate([normal_voltage, failure_voltage])
        current = np.concatenate([normal_current, failure_current])
        vibration = np.concatenate([normal_vibration, failure_vibration])
        humidity = np.concatenate([normal_humidity, failure_humidity])
        uptime = np.concatenate([normal_uptime, failure_uptime])
        error_rate = np.concatenate([normal_error_rate, failure_error_rate])
        
        # Labels (0 = normal, 1 = failure)
        labels = np.concatenate([np.zeros(n_samples//2), np.ones(n_samples//2)])
        
        # Create DataFrame
        data = pd.DataFrame({
            'temperature': temperature,
            'voltage': voltage,
            'current': current,
            'vibration': vibration,
            'humidity': humidity,
            'uptime': uptime,
            'error_rate': error_rate,
            'failure': labels
        })
        
        # Add derived features
        data['temp_voltage_ratio'] = data['temperature'] / data['voltage']
        data['power'] = data['voltage'] * data['current']
        data['efficiency'] = data['uptime'] / (1 + data['error_rate'])
        
        return data
    
    def train(self, data=None):
        """Train the failure prediction models"""
        if data is None:
            print("Generating synthetic training data...")
            data = self.generate_training_data()
        
        # Prepare features
        feature_cols = ['temperature', 'voltage', 'current', 'vibration', 
                       'humidity', 'uptime', 'error_rate', 'temp_voltage_ratio', 
                       'power', 'efficiency']
        
        X = data[feature_cols]
        y = data['failure']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train anomaly detector (unsupervised)
        print("Training anomaly detector...")
        self.anomaly_detector.fit(X_train)
        
        # Train failure classifier (supervised)
        print("Training failure classifier...")
        self.failure_classifier.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.failure_classifier.predict(X_test)
        print("\nFailure Classifier Performance:")
        print(classification_report(y_test, y_pred))
        
        self.is_trained = True
        print("Training completed successfully!")
        
        return {
            'accuracy': self.failure_classifier.score(X_test, y_test),
            'feature_importance': dict(zip(feature_cols, self.failure_classifier.feature_importances_))
        }
    
    def predict_failure(self, sensor_data):
        """Predict failure probability and anomaly score"""
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        # Prepare input data
        features = np.array([[
            sensor_data.get('temperature', 25),
            sensor_data.get('voltage', 220),
            sensor_data.get('current', 30),
            sensor_data.get('vibration', 0.1),
            sensor_data.get('humidity', 45),
            sensor_data.get('uptime', 95),
            sensor_data.get('error_rate', 0.1),
            sensor_data.get('temperature', 25) / sensor_data.get('voltage', 220),
            sensor_data.get('voltage', 220) * sensor_data.get('current', 30),
            sensor_data.get('uptime', 95) / (1 + sensor_data.get('error_rate', 0.1))
        ]])
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Get predictions
        failure_prob = self.failure_classifier.predict_proba(features_scaled)[0][1]
        anomaly_score = self.anomaly_detector.decision_function(features_scaled)[0]
        is_anomaly = self.anomaly_detector.predict(features_scaled)[0] == -1
        
        # Determine action needed
        action_needed = self._determine_action(failure_prob, is_anomaly, sensor_data)
        
        return {
            'failure_probability': float(failure_prob),
            'anomaly_score': float(anomaly_score),
            'is_anomaly': bool(is_anomaly),
            'risk_level': self._get_risk_level(failure_prob),
            'recommended_action': action_needed,
            'confidence': float(max(failure_prob, 1-failure_prob)),
            'timestamp': datetime.now().isoformat()
        }
    
    def _determine_action(self, failure_prob, is_anomaly, sensor_data):
        """Determine what action the Mechanic Agent should take"""
        if failure_prob > 0.8 or is_anomaly:
            if sensor_data.get('temperature', 25) > 60:
                return 'emergency_shutdown'
            elif sensor_data.get('voltage', 220) < 180:
                return 'voltage_stabilization'
            else:
                return 'preventive_restart'
        elif failure_prob > 0.6:
            return 'diagnostic_check'
        elif failure_prob > 0.4:
            return 'schedule_maintenance'
        else:
            return 'monitor'
    
    def _get_risk_level(self, failure_prob):
        """Convert failure probability to risk level"""
        if failure_prob > 0.8:
            return 'critical'
        elif failure_prob > 0.6:
            return 'high'
        elif failure_prob > 0.4:
            return 'medium'
        else:
            return 'low'
    
    def save_model(self, filepath='models/failure_predictor.pkl'):
        """Save trained model"""
        model_data = {
            'anomaly_detector': self.anomaly_detector,
            'failure_classifier': self.failure_classifier,
            'scaler': self.scaler,
            'is_trained': self.is_trained
        }
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath='models/failure_predictor.pkl'):
        """Load trained model"""
        model_data = joblib.load(filepath)
        self.anomaly_detector = model_data['anomaly_detector']
        self.failure_classifier = model_data['failure_classifier']
        self.scaler = model_data['scaler']
        self.is_trained = model_data['is_trained']
        print(f"Model loaded from {filepath}")

# Example usage and testing
if __name__ == "__main__":
    # Initialize and train model
    predictor = FailurePredictor()
    metrics = predictor.train()
    
    print(f"\nModel Accuracy: {metrics['accuracy']:.3f}")
    print("\nFeature Importance:")
    for feature, importance in sorted(metrics['feature_importance'].items(), 
                                    key=lambda x: x[1], reverse=True):
        print(f"{feature}: {importance:.3f}")
    
    # Test predictions
    print("\n" + "="*50)
    print("TESTING PREDICTIONS")
    print("="*50)
    
    # Normal operation
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
    print(f"\nNormal Operation:")
    print(f"Failure Probability: {result['failure_probability']:.3f}")
    print(f"Risk Level: {result['risk_level']}")
    print(f"Recommended Action: {result['recommended_action']}")
    
    # Failure scenario
    failure_data = {
        'temperature': 70,  # Overheating
        'voltage': 170,     # Low voltage
        'current': 50,      # High current
        'vibration': 0.9,   # High vibration
        'humidity': 80,     # High humidity
        'uptime': 60,       # Low uptime
        'error_rate': 3.0   # High error rate
    }
    
    result = predictor.predict_failure(failure_data)
    print(f"\nFailure Scenario:")
    print(f"Failure Probability: {result['failure_probability']:.3f}")
    print(f"Risk Level: {result['risk_level']}")
    print(f"Recommended Action: {result['recommended_action']}")
    
    # Save model
    predictor.save_model()