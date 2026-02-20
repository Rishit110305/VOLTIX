"""
Configuration settings for EV Copilot ML Service
"""

import os
from typing import Dict, Any

class MLConfig:
    """Configuration class for ML models and service"""
    
    # Model settings
    MODEL_SETTINGS = {
        'failure_predictor': {
            'contamination': 0.1,
            'n_estimators': 100,
            'random_state': 42
        },
        'traffic_optimizer': {
            'n_estimators': 200,
            'max_depth': 15,
            'random_state': 42
        },
        'logistics_optimizer': {
            'n_estimators': 200,
            'max_depth': 8,
            'random_state': 42
        },
        'energy_trader': {
            'n_estimators': 200,
            'learning_rate': 0.1,
            'max_depth': 8,
            'random_state': 42
        },
        'audit_analyzer': {
            'contamination': 0.05,
            'n_estimators': 150,
            'random_state': 42
        }
    }
    
    # API settings
    API_SETTINGS = {
        'host': os.getenv('ML_HOST', '0.0.0.0'),
        'port': int(os.getenv('ML_PORT', 8000)),
        'reload': os.getenv('ML_RELOAD', 'false').lower() == 'true',
        'log_level': os.getenv('ML_LOG_LEVEL', 'info')
    }
    
    # Data settings
    DATA_SETTINGS = {
        'datasets_dir': os.getenv('DATASETS_DIR', 'datasets'),
        'models_dir': os.getenv('MODELS_DIR', 'saved_models'),
        'max_batch_size': int(os.getenv('MAX_BATCH_SIZE', 100))
    }
    
    # Agent thresholds
    AGENT_THRESHOLDS = {
        'mechanic': {
            'failure_risk_critical': 0.8,
            'failure_risk_high': 0.6,
            'failure_risk_medium': 0.4
        },
        'traffic': {
            'queue_threshold': 15,
            'wait_time_threshold': 20,
            'incentive_min': 10,
            'incentive_max': 200
        },
        'logistics': {
            'stockout_critical': 0.8,
            'stockout_high': 0.6,
            'min_inventory_hours': 2
        },
        'energy': {
            'price_high': 6.0,
            'price_low': 3.5,
            'trading_min_profit': 0.2
        },
        'audit': {
            'anomaly_threshold': 0.5,
            'compliance_threshold': 0.5,
            'risk_critical': 0.8
        }
    }
    
    @classmethod
    def get_model_config(cls, model_name: str) -> Dict[str, Any]:
        """Get configuration for a specific model"""
        return cls.MODEL_SETTINGS.get(model_name, {})
    
    @classmethod
    def get_agent_thresholds(cls, agent_name: str) -> Dict[str, Any]:
        """Get thresholds for a specific agent"""
        return cls.AGENT_THRESHOLDS.get(agent_name, {})