#!/usr/bin/env python3
"""
Production runner for EV Copilot ML Service
Handles startup, health checks, and graceful shutdown
"""

import uvicorn
import asyncio
import signal
import sys
import os
from pathlib import Path

# Add current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from config import MLConfig
from utils import logger, ModelUtils

class MLServiceRunner:
    """Production service runner"""
    
    def __init__(self):
        self.server = None
        self.config = MLConfig()
        
    async def startup_checks(self):
        """Perform startup checks"""
        logger.info("🚀 Starting EV Copilot ML Service...")
        
        # Ensure required directories exist
        ModelUtils.ensure_models_dir()
        
        # Check if datasets exist
        datasets_dir = self.config.DATA_SETTINGS['datasets_dir']
        if not os.path.exists(datasets_dir):
            logger.warning(f"Datasets directory not found: {datasets_dir}")
            logger.info("Run 'python generate_datasets.py' to create datasets")
        
        # Log configuration
        logger.info(f"Host: {self.config.API_SETTINGS['host']}")
        logger.info(f"Port: {self.config.API_SETTINGS['port']}")
        logger.info(f"Models directory: {self.config.DATA_SETTINGS['models_dir']}")
        
        logger.info("✅ Startup checks completed")
    
    def setup_signal_handlers(self):
        """Setup graceful shutdown handlers"""
        def signal_handler(signum, frame):
            logger.info(f"Received signal {signum}, shutting down gracefully...")
            if self.server:
                self.server.should_exit = True
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    async def run(self):
        """Run the ML service"""
        await self.startup_checks()
        self.setup_signal_handlers()
        
        # Configure uvicorn
        config = uvicorn.Config(
            "main:app",
            host=self.config.API_SETTINGS['host'],
            port=self.config.API_SETTINGS['port'],
            reload=self.config.API_SETTINGS['reload'],
            log_level=self.config.API_SETTINGS['log_level'],
            access_log=True
        )
        
        # Create and run server
        self.server = uvicorn.Server(config)
        
        try:
            await self.server.serve()
        except KeyboardInterrupt:
            logger.info("Service interrupted by user")
        except Exception as e:
            logger.error(f"Service error: {e}")
        finally:
            logger.info("🛑 EV Copilot ML Service stopped")

def main():
    """Main entry point"""
    runner = MLServiceRunner()
    
    try:
        asyncio.run(runner.run())
    except KeyboardInterrupt:
        logger.info("Service interrupted")
    except Exception as e:
        logger.error(f"Failed to start service: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()