# ML Models Package for EV Copilot
# This package contains all 5 specialized agent ML models

__version__ = "1.0.0"
__author__ = "EV Copilot Team"

# Import all models for easy access
from .failure_predictor import FailurePredictor
from .traffic_optimizer import TrafficOptimizer
from .logistics_optimizer import LogisticsOptimizer
from .energy_trader import EnergyTrader
from .audit_analyzer import AuditAnalyzer
from .route_optimizer import RouteOptimizer

__all__ = [
    'FailurePredictor',
    'TrafficOptimizer', 
    'LogisticsOptimizer',
    'EnergyTrader',
    'AuditAnalyzer',
    'RouteOptimizer'
]