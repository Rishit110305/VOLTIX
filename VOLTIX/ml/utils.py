"""
Utility functions for EV Copilot ML Service
"""

import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataValidator:
    """Validate input data for ML models"""
    
    @staticmethod
    def validate_sensor_data(data: Dict[str, Any]) -> bool:
        """Validate sensor data for failure predictor"""
        required_fields = ['temperature', 'voltage', 'current']
        optional_fields = ['vibration', 'humidity', 'uptime', 'error_rate']
        
        # Check required fields
        for field in required_fields:
            if field not in data:
                logger.error(f"Missing required field: {field}")
                return False
            
            if not isinstance(data[field], (int, float)):
                logger.error(f"Invalid type for {field}: expected number")
                return False
        
        # Validate ranges
        if not (0 <= data['temperature'] <= 100):
            logger.warning(f"Temperature {data['temperature']} outside normal range")
        
        if not (100 <= data['voltage'] <= 300):
            logger.warning(f"Voltage {data['voltage']} outside normal range")
        
        if not (0 <= data['current'] <= 100):
            logger.warning(f"Current {data['current']} outside normal range")
        
        return True
    
    @staticmethod
    def validate_station_data(data: Dict[str, Any]) -> bool:
        """Validate station data for traffic optimizer"""
        required_fields = ['station_capacity']
        
        for field in required_fields:
            if field not in data:
                logger.error(f"Missing required field: {field}")
                return False
        
        if data['station_capacity'] <= 0:
            logger.error("Station capacity must be positive")
            return False
        
        return True

class ModelUtils:
    """Utility functions for ML models"""
    
    @staticmethod
    def ensure_models_dir():
        """Ensure models directory exists"""
        models_dir = 'saved_models'
        if not os.path.exists(models_dir):
            os.makedirs(models_dir)
            logger.info(f"Created models directory: {models_dir}")
        return models_dir
    
    @staticmethod
    def save_model_metadata(model_name: str, metadata: Dict[str, Any]):
        """Save model metadata"""
        models_dir = ModelUtils.ensure_models_dir()
        metadata_path = os.path.join(models_dir, f"{model_name}_metadata.json")
        
        metadata['saved_at'] = datetime.now().isoformat()
        
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Saved metadata for {model_name}")
    
    @staticmethod
    def load_model_metadata(model_name: str) -> Optional[Dict[str, Any]]:
        """Load model metadata"""
        models_dir = 'saved_models'
        metadata_path = os.path.join(models_dir, f"{model_name}_metadata.json")
        
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                return json.load(f)
        
        return None

class DataProcessor:
    """Data processing utilities"""
    
    @staticmethod
    def load_datasets(datasets_dir: str = 'datasets') -> Dict[str, pd.DataFrame]:
        """Load all generated datasets"""
        datasets = {}
        
        dataset_files = {
            'stations': 'stations.csv',
            'signals': 'signals.csv',
            'decisions': 'decisions.csv',
            'energy_market': 'energy_market.csv',
            'users': 'users.csv'
        }
        
        for name, filename in dataset_files.items():
            filepath = os.path.join(datasets_dir, filename)
            if os.path.exists(filepath):
                datasets[name] = pd.read_csv(filepath)
                logger.info(f"Loaded {name}: {len(datasets[name])} records")
            else:
                logger.warning(f"Dataset file not found: {filepath}")
        
        return datasets
    
    @staticmethod
    def get_recent_data(df: pd.DataFrame, hours: int = 24, 
                       timestamp_col: str = 'timestamp') -> pd.DataFrame:
        """Get recent data from a DataFrame"""
        if timestamp_col not in df.columns:
            logger.warning(f"Timestamp column {timestamp_col} not found")
            return df
        
        cutoff_time = datetime.now() - timedelta(hours=hours)
        df[timestamp_col] = pd.to_datetime(df[timestamp_col])
        
        recent_data = df[df[timestamp_col] >= cutoff_time]
        logger.info(f"Filtered to {len(recent_data)} recent records")
        
        return recent_data
    
    @staticmethod
    def aggregate_station_metrics(signals_df: pd.DataFrame, 
                                 station_id: str) -> Dict[str, Any]:
        """Aggregate metrics for a specific station"""
        station_data = signals_df[signals_df['station_id'] == station_id]
        
        if len(station_data) == 0:
            logger.warning(f"No data found for station {station_id}")
            return {}
        
        # Calculate aggregated metrics
        metrics = {
            'avg_queue_length': station_data['queue_length'].mean(),
            'max_queue_length': station_data['queue_length'].max(),
            'avg_temperature': station_data['temperature'].mean(),
            'avg_voltage': station_data['voltage'].mean(),
            'avg_current': station_data['current'].mean(),
            'error_rate': (station_data['error'].notna().sum() / len(station_data)),
            'uptime_percentage': (station_data['chargers_up'] / station_data['total_chargers']).mean() * 100,
            'avg_inventory': station_data['inventory'].mean(),
            'min_inventory': station_data['inventory'].min(),
            'total_records': len(station_data)
        }
        
        return metrics

class ResponseFormatter:
    """Format API responses consistently"""
    
    @staticmethod
    def success_response(data: Any, message: str = "Success") -> Dict[str, Any]:
        """Format successful response"""
        return {
            "success": True,
            "message": message,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
    
    @staticmethod
    def error_response(error: str, code: int = 500) -> Dict[str, Any]:
        """Format error response"""
        return {
            "success": False,
            "error": error,
            "code": code,
            "timestamp": datetime.now().isoformat()
        }
    
    @staticmethod
    def prediction_response(predictions: Any, model: str, 
                          confidence: float = None) -> Dict[str, Any]:
        """Format prediction response"""
        response = {
            "success": True,
            "model": model,
            "predictions": predictions,
            "timestamp": datetime.now().isoformat()
        }
        
        if confidence is not None:
            response["confidence"] = confidence
        
        return response

class PerformanceMonitor:
    """Monitor model performance"""
    
    def __init__(self):
        self.metrics = {}
    
    def log_prediction(self, model_name: str, execution_time: float, 
                      confidence: float = None):
        """Log prediction metrics"""
        if model_name not in self.metrics:
            self.metrics[model_name] = {
                'total_predictions': 0,
                'total_time': 0,
                'avg_time': 0,
                'confidences': []
            }
        
        self.metrics[model_name]['total_predictions'] += 1
        self.metrics[model_name]['total_time'] += execution_time
        self.metrics[model_name]['avg_time'] = (
            self.metrics[model_name]['total_time'] / 
            self.metrics[model_name]['total_predictions']
        )
        
        if confidence is not None:
            self.metrics[model_name]['confidences'].append(confidence)
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary for all models"""
        summary = {}
        
        for model_name, metrics in self.metrics.items():
            summary[model_name] = {
                'total_predictions': metrics['total_predictions'],
                'avg_execution_time': round(metrics['avg_time'], 4),
                'avg_confidence': (
                    round(np.mean(metrics['confidences']), 3) 
                    if metrics['confidences'] else None
                )
            }
        
        return summary

# Global performance monitor instance
performance_monitor = PerformanceMonitor()