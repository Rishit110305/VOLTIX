"""
Audit Analysis Model for Auditor Agent
Detects anomalies and compliance violations
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, precision_recall_fscore_support
import joblib
from datetime import datetime, timedelta
import hashlib
import json
import warnings
warnings.filterwarnings('ignore')

class AuditAnalyzer:
    def __init__(self):
        self.anomaly_detector = IsolationForest(
            contamination=0.05,  # 5% anomaly rate
            random_state=42,
            n_estimators=150
        )
        self.compliance_classifier = RandomForestClassifier(
            n_estimators=200,
            random_state=42,
            max_depth=15
        )
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.is_trained = False
        
    def generate_training_data(self, n_samples=10000):
        """Generate synthetic training data for audit analysis"""
        np.random.seed(42)
        
        # Agent actions
        agents = ['MechanicAgent', 'TrafficAgent', 'LogisticsAgent', 'EnergyAgent']
        agent_names = np.random.choice(agents, n_samples)
        
        actions = ['restart_charger', 'reroute_traffic', 'dispatch_inventory', 
                  'trade_energy', 'emergency_shutdown', 'price_adjustment']
        action_types = np.random.choice(actions, n_samples)
        
        # Decision metrics
        confidence_scores = np.random.beta(8, 2, n_samples)  # Skewed towards high confidence
        execution_times = np.random.lognormal(2, 1, n_samples)  # Log-normal distribution
        
        # Financial impact
        cost_impact = np.random.normal(0, 1000, n_samples)  # ₹ impact
        revenue_impact = np.random.normal(500, 2000, n_samples)  # ₹ revenue impact
        
        # Operational metrics
        success_rate = np.random.beta(9, 1, n_samples)  # High success rate normally
        user_satisfaction = np.random.beta(7, 2, n_samples)  # Generally satisfied
        
        # Time patterns
        hours = np.random.randint(0, 24, n_samples)
        days_of_week = np.random.randint(0, 7, n_samples)
        
        # Risk factors
        risk_scores = np.random.beta(2, 8, n_samples)  # Skewed towards low risk
        human_override = np.random.choice([0, 1], n_samples, p=[0.95, 0.05])  # 5% override
        
        # System load
        system_cpu = np.random.beta(3, 7, n_samples) * 100  # CPU usage %
        system_memory = np.random.beta(4, 6, n_samples) * 100  # Memory usage %
        api_calls = np.random.poisson(10, n_samples)  # API calls per action
        
        # Generate anomalies (5% of data)
        anomaly_indices = np.random.choice(n_samples, size=int(n_samples * 0.05), replace=False)
        
        # Inject anomalies
        confidence_scores[anomaly_indices] = np.random.uniform(0, 0.3, len(anomaly_indices))  # Very low confidence
        execution_times[anomaly_indices] *= np.random.uniform(5, 20, len(anomaly_indices))  # Very slow
        success_rate[anomaly_indices] = np.random.uniform(0, 0.2, len(anomaly_indices))  # Low success
        cost_impact[anomaly_indices] = np.random.uniform(-10000, -5000, len(anomaly_indices))  # High cost
        
        # Compliance violations (3% of data)
        violation_indices = np.random.choice(n_samples, size=int(n_samples * 0.03), replace=False)
        
        # Create compliance labels
        compliance_violations = np.zeros(n_samples)
        compliance_violations[violation_indices] = 1
        
        # Violation patterns
        for idx in violation_indices:
            if np.random.random() < 0.4:  # Unauthorized high-risk action
                risk_scores[idx] = np.random.uniform(0.8, 1.0)
                human_override[idx] = 0  # Should have required override
            elif np.random.random() < 0.3:  # Excessive resource usage
                system_cpu[idx] = np.random.uniform(90, 100)
                system_memory[idx] = np.random.uniform(95, 100)
            else:  # Financial threshold violation
                cost_impact[idx] = np.random.uniform(-15000, -10000)
        
        # Create anomaly labels
        is_anomaly = np.zeros(n_samples)
        is_anomaly[anomaly_indices] = 1
        
        # Create DataFrame
        data = pd.DataFrame({
            'agent': agent_names,
            'action': action_types,
            'confidence_score': confidence_scores,
            'execution_time': execution_times,
            'cost_impact': cost_impact,
            'revenue_impact': revenue_impact,
            'success_rate': success_rate,
            'user_satisfaction': user_satisfaction,
            'hour': hours,
            'day_of_week': days_of_week,
            'risk_score': risk_scores,
            'human_override': human_override,
            'system_cpu': system_cpu,
            'system_memory': system_memory,
            'api_calls': api_calls,
            'is_anomaly': is_anomaly,
            'compliance_violation': compliance_violations
        })
        
        # Add derived features
        data['net_impact'] = data['revenue_impact'] + data['cost_impact']
        data['efficiency_score'] = data['success_rate'] / (data['execution_time'] / 1000 + 1)
        data['resource_usage'] = (data['system_cpu'] + data['system_memory']) / 2
        data['risk_confidence_ratio'] = data['risk_score'] / (data['confidence_score'] + 0.01)
        
        return data
    
    def train(self, data=None):
        """Train the audit analysis models"""
        if data is None:
            print("Generating synthetic training data...")
            data = self.generate_training_data()
        
        # Encode categorical variables
        categorical_cols = ['agent', 'action']
        for col in categorical_cols:
            le = LabelEncoder()
            data[f'{col}_encoded'] = le.fit_transform(data[col])
            self.label_encoders[col] = le
        
        # Prepare features
        feature_cols = ['agent_encoded', 'action_encoded', 'confidence_score', 
                       'execution_time', 'cost_impact', 'revenue_impact', 'success_rate',
                       'user_satisfaction', 'hour', 'day_of_week', 'risk_score',
                       'human_override', 'system_cpu', 'system_memory', 'api_calls',
                       'net_impact', 'efficiency_score', 'resource_usage', 'risk_confidence_ratio']
        
        X = data[feature_cols]
        y_anomaly = data['is_anomaly']
        y_compliance = data['compliance_violation']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_anomaly_train, y_anomaly_test, y_compliance_train, y_compliance_test = train_test_split(
            X_scaled, y_anomaly, y_compliance, test_size=0.2, random_state=42
        )
        
        # Train anomaly detector (unsupervised)
        print("Training anomaly detector...")
        self.anomaly_detector.fit(X_train)
        
        # Train compliance classifier (supervised)
        print("Training compliance classifier...")
        self.compliance_classifier.fit(X_train, y_compliance_train)
        
        # Evaluate models
        anomaly_pred = self.anomaly_detector.predict(X_test)
        anomaly_pred = (anomaly_pred == -1).astype(int)  # Convert to binary
        
        compliance_pred = self.compliance_classifier.predict(X_test)
        
        print("\nAnomaly Detector Performance:")
        print(classification_report(y_anomaly_test, anomaly_pred))
        
        print("\nCompliance Classifier Performance:")
        print(classification_report(y_compliance_test, compliance_pred))
        
        self.is_trained = True
        print("Training completed successfully!")
        
        return {
            'anomaly_precision': precision_recall_fscore_support(y_anomaly_test, anomaly_pred, average='binary')[0],
            'compliance_accuracy': self.compliance_classifier.score(X_test, y_compliance_test),
            'feature_importance': dict(zip(feature_cols, self.compliance_classifier.feature_importances_))
        }
    
    def analyze_decision(self, decision_data):
        """Analyze a single decision for anomalies and compliance"""
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        # Prepare input features
        features = np.array([[
            self.label_encoders['agent'].transform([decision_data.get('agent', 'MechanicAgent')])[0],
            self.label_encoders['action'].transform([decision_data.get('action', 'restart_charger')])[0],
            decision_data.get('confidence_score', 0.8),
            decision_data.get('execution_time', 1000),
            decision_data.get('cost_impact', 0),
            decision_data.get('revenue_impact', 0),
            decision_data.get('success_rate', 0.9),
            decision_data.get('user_satisfaction', 0.8),
            decision_data.get('hour', datetime.now().hour),
            decision_data.get('day_of_week', datetime.now().weekday()),
            decision_data.get('risk_score', 0.2),
            decision_data.get('human_override', 0),
            decision_data.get('system_cpu', 50),
            decision_data.get('system_memory', 60),
            decision_data.get('api_calls', 5),
            decision_data.get('revenue_impact', 0) + decision_data.get('cost_impact', 0),
            decision_data.get('success_rate', 0.9) / (decision_data.get('execution_time', 1000) / 1000 + 1),
            (decision_data.get('system_cpu', 50) + decision_data.get('system_memory', 60)) / 2,
            decision_data.get('risk_score', 0.2) / (decision_data.get('confidence_score', 0.8) + 0.01)
        ]])
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Get predictions
        anomaly_score = self.anomaly_detector.decision_function(features_scaled)[0]
        is_anomaly = self.anomaly_detector.predict(features_scaled)[0] == -1
        
        compliance_prob = self.compliance_classifier.predict_proba(features_scaled)[0][1]
        is_violation = compliance_prob > 0.5
        
        # Generate audit hash
        audit_hash = self._generate_audit_hash(decision_data)
        
        # Determine required actions
        required_actions = self._determine_required_actions(
            is_anomaly, is_violation, decision_data
        )
        
        return {
            'anomaly_detected': bool(is_anomaly),
            'anomaly_score': float(anomaly_score),
            'compliance_violation': bool(is_violation),
            'violation_probability': float(compliance_prob),
            'audit_hash': audit_hash,
            'risk_level': self._calculate_risk_level(anomaly_score, compliance_prob),
            'required_actions': required_actions,
            'audit_timestamp': datetime.now().isoformat(),
            'confidence': 0.88
        }
    
    def batch_audit_analysis(self, decisions_batch):
        """Analyze multiple decisions in batch"""
        results = []
        
        for decision in decisions_batch:
            analysis = self.analyze_decision(decision)
            results.append({
                'decision_id': decision.get('id'),
                'analysis': analysis
            })
        
        # Generate batch summary
        summary = self._generate_batch_summary(results)
        
        return {
            'individual_results': results,
            'batch_summary': summary,
            'total_analyzed': len(decisions_batch),
            'analysis_timestamp': datetime.now().isoformat()
        }
    
    def detect_pattern_anomalies(self, historical_decisions, window_hours=24):
        """Detect pattern-based anomalies in historical data"""
        
        # Group decisions by time windows
        time_windows = self._group_by_time_windows(historical_decisions, window_hours)
        
        pattern_anomalies = []
        
        for window_start, decisions in time_windows.items():
            if len(decisions) < 5:  # Skip windows with too few decisions
                continue
            
            # Calculate window statistics
            window_stats = self._calculate_window_statistics(decisions)
            
            # Check for pattern anomalies
            anomalies = self._check_pattern_anomalies(window_stats, window_start)
            
            if anomalies:
                pattern_anomalies.extend(anomalies)
        
        return {
            'pattern_anomalies': pattern_anomalies,
            'total_windows_analyzed': len(time_windows),
            'anomaly_count': len(pattern_anomalies),
            'analysis_timestamp': datetime.now().isoformat()
        }
    
    def _generate_audit_hash(self, decision_data):
        """Generate cryptographic hash for audit trail"""
        # Create deterministic string from decision data
        hash_data = {
            'agent': decision_data.get('agent'),
            'action': decision_data.get('action'),
            'timestamp': decision_data.get('timestamp'),
            'confidence': decision_data.get('confidence_score'),
            'cost_impact': decision_data.get('cost_impact')
        }
        
        hash_string = json.dumps(hash_data, sort_keys=True)
        return hashlib.sha256(hash_string.encode()).hexdigest()
    
    def _determine_required_actions(self, is_anomaly, is_violation, decision_data):
        """Determine what actions are required based on analysis"""
        actions = []
        
        if is_anomaly:
            actions.append('flag_for_review')
            if decision_data.get('risk_score', 0) > 0.7:
                actions.append('immediate_escalation')
        
        if is_violation:
            actions.append('compliance_review')
            actions.append('generate_incident_report')
            
            if decision_data.get('cost_impact', 0) < -5000:
                actions.append('financial_audit')
        
        if decision_data.get('confidence_score', 1) < 0.3:
            actions.append('model_review')
        
        if not actions:
            actions.append('routine_logging')
        
        return actions
    
    def _calculate_risk_level(self, anomaly_score, compliance_prob):
        """Calculate overall risk level"""
        # Normalize anomaly score (more negative = more anomalous)
        normalized_anomaly = max(0, -anomaly_score / 2)
        
        # Combine scores
        combined_risk = (normalized_anomaly + compliance_prob) / 2
        
        if combined_risk > 0.8:
            return 'critical'
        elif combined_risk > 0.6:
            return 'high'
        elif combined_risk > 0.4:
            return 'medium'
        else:
            return 'low'
    
    def _generate_batch_summary(self, results):
        """Generate summary statistics for batch analysis"""
        total = len(results)
        anomalies = sum(1 for r in results if r['analysis']['anomaly_detected'])
        violations = sum(1 for r in results if r['analysis']['compliance_violation'])
        
        risk_levels = [r['analysis']['risk_level'] for r in results]
        risk_distribution = {level: risk_levels.count(level) for level in set(risk_levels)}
        
        return {
            'total_decisions': total,
            'anomalies_detected': anomalies,
            'compliance_violations': violations,
            'anomaly_rate': round(anomalies / total, 3) if total > 0 else 0,
            'violation_rate': round(violations / total, 3) if total > 0 else 0,
            'risk_distribution': risk_distribution,
            'requires_immediate_attention': anomalies + violations
        }
    
    def _group_by_time_windows(self, decisions, window_hours):
        """Group decisions by time windows"""
        windows = {}
        
        for decision in decisions:
            timestamp = datetime.fromisoformat(decision.get('timestamp', datetime.now().isoformat()))
            window_start = timestamp.replace(minute=0, second=0, microsecond=0)
            window_key = window_start.isoformat()
            
            if window_key not in windows:
                windows[window_key] = []
            windows[window_key].append(decision)
        
        return windows
    
    def _calculate_window_statistics(self, decisions):
        """Calculate statistics for a time window"""
        return {
            'decision_count': len(decisions),
            'avg_confidence': np.mean([d.get('confidence_score', 0.8) for d in decisions]),
            'avg_execution_time': np.mean([d.get('execution_time', 1000) for d in decisions]),
            'total_cost_impact': sum(d.get('cost_impact', 0) for d in decisions),
            'success_rate': np.mean([d.get('success_rate', 0.9) for d in decisions]),
            'agent_distribution': self._get_agent_distribution(decisions)
        }
    
    def _get_agent_distribution(self, decisions):
        """Get distribution of agents in decisions"""
        agents = [d.get('agent', 'Unknown') for d in decisions]
        return {agent: agents.count(agent) for agent in set(agents)}
    
    def _check_pattern_anomalies(self, window_stats, window_start):
        """Check for pattern-based anomalies"""
        anomalies = []
        
        # Check for unusual decision volume
        if window_stats['decision_count'] > 50:  # Too many decisions
            anomalies.append({
                'type': 'high_decision_volume',
                'severity': 'medium',
                'description': f"Unusually high decision volume: {window_stats['decision_count']}",
                'window_start': window_start
            })
        
        # Check for low confidence pattern
        if window_stats['avg_confidence'] < 0.5:
            anomalies.append({
                'type': 'low_confidence_pattern',
                'severity': 'high',
                'description': f"Consistently low confidence: {window_stats['avg_confidence']:.3f}",
                'window_start': window_start
            })
        
        # Check for high cost impact
        if window_stats['total_cost_impact'] < -10000:
            anomalies.append({
                'type': 'high_cost_impact',
                'severity': 'critical',
                'description': f"High negative cost impact: ₹{window_stats['total_cost_impact']}",
                'window_start': window_start
            })
        
        return anomalies
    
    def save_model(self, filepath='models/audit_analyzer.pkl'):
        """Save trained model"""
        model_data = {
            'anomaly_detector': self.anomaly_detector,
            'compliance_classifier': self.compliance_classifier,
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'is_trained': self.is_trained
        }
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath='models/audit_analyzer.pkl'):
        """Load trained model"""
        model_data = joblib.load(filepath)
        self.anomaly_detector = model_data['anomaly_detector']
        self.compliance_classifier = model_data['compliance_classifier']
        self.scaler = model_data['scaler']
        self.label_encoders = model_data['label_encoders']
        self.is_trained = model_data['is_trained']
        print(f"Model loaded from {filepath}")

# Example usage and testing
if __name__ == "__main__":
    # Initialize and train model
    analyzer = AuditAnalyzer()
    metrics = analyzer.train()
    
    print(f"\nAnomaly Detection Precision: {metrics['anomaly_precision']:.3f}")
    print(f"Compliance Classification Accuracy: {metrics['compliance_accuracy']:.3f}")
    
    # Test decision analysis
    print("\n" + "="*50)
    print("TESTING DECISION ANALYSIS")
    print("="*50)
    
    # Normal decision
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
    print(f"Normal Decision Analysis:")
    print(f"Anomaly Detected: {result['anomaly_detected']}")
    print(f"Compliance Violation: {result['compliance_violation']}")
    print(f"Risk Level: {result['risk_level']}")
    print(f"Required Actions: {result['required_actions']}")
    
    # Suspicious decision
    suspicious_decision = {
        'agent': 'EnergyAgent',
        'action': 'trade_energy',
        'confidence_score': 0.15,  # Very low confidence
        'execution_time': 15000,   # Very slow
        'cost_impact': -8000,      # High cost
        'revenue_impact': 100,
        'success_rate': 0.3,       # Low success
        'user_satisfaction': 0.2,
        'risk_score': 0.9,         # High risk
        'human_override': 0,       # Should have required override
        'system_cpu': 95,          # High CPU
        'system_memory': 98,       # High memory
        'api_calls': 25,
        'timestamp': datetime.now().isoformat()
    }
    
    result = analyzer.analyze_decision(suspicious_decision)
    print(f"\nSuspicious Decision Analysis:")
    print(f"Anomaly Detected: {result['anomaly_detected']}")
    print(f"Compliance Violation: {result['compliance_violation']}")
    print(f"Risk Level: {result['risk_level']}")
    print(f"Required Actions: {result['required_actions']}")
    print(f"Audit Hash: {result['audit_hash'][:16]}...")
    
    # Save model
    analyzer.save_model()