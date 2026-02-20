#!/usr/bin/env python3
"""
Setup script for EV Copilot ML Service
Handles initial setup, dataset generation, and model training
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils import logger

class MLSetup:
    """Setup handler for ML service"""
    
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent
        
    def install_dependencies(self):
        """Install Python dependencies"""
        logger.info("📦 Installing dependencies...")
        
        requirements_file = self.root_dir / "requirements.txt"
        
        try:
            subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
            ], check=True)
            logger.info("✅ Dependencies installed successfully")
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Failed to install dependencies: {e}")
            return False
        
        return True
    
    def generate_datasets(self):
        """Generate synthetic datasets"""
        logger.info("🏭 Generating datasets...")
        
        try:
            subprocess.run([
                sys.executable, str(self.root_dir / "generate_datasets.py")
            ], check=True, cwd=self.root_dir)
            logger.info("✅ Datasets generated successfully")
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Failed to generate datasets: {e}")
            return False
        
        return True
    
    def test_models(self):
        """Test all ML models"""
        logger.info("🧪 Testing ML models...")
        
        try:
            subprocess.run([
                sys.executable, str(self.root_dir / "test_models.py")
            ], check=True, cwd=self.root_dir)
            logger.info("✅ All models tested successfully")
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Model tests failed: {e}")
            return False
        
        return True
    
    def create_directories(self):
        """Create necessary directories"""
        logger.info("📁 Creating directories...")
        
        directories = [
            "datasets",
            "saved_models", 
            "logs",
            "temp"
        ]
        
        for directory in directories:
            dir_path = self.root_dir / directory
            dir_path.mkdir(exist_ok=True)
            logger.info(f"Created directory: {directory}")
        
        return True
    
    def check_environment(self):
        """Check environment requirements"""
        logger.info("🔍 Checking environment...")
        
        # Check Python version
        python_version = sys.version_info
        if python_version < (3, 8):
            logger.error("❌ Python 3.8+ required")
            return False
        
        logger.info(f"✅ Python {python_version.major}.{python_version.minor}")
        
        # Check available memory (basic check)
        try:
            import psutil
            memory = psutil.virtual_memory()
            if memory.total < 2 * 1024**3:  # 2GB
                logger.warning("⚠️  Low memory detected (< 2GB)")
            else:
                logger.info(f"✅ Memory: {memory.total // 1024**3}GB")
        except ImportError:
            logger.info("Memory check skipped (psutil not available)")
        
        return True
    
    def full_setup(self):
        """Run complete setup process"""
        logger.info("🚀 Starting EV Copilot ML Service Setup")
        logger.info("=" * 50)
        
        steps = [
            ("Environment Check", self.check_environment),
            ("Create Directories", self.create_directories),
            ("Install Dependencies", self.install_dependencies),
            ("Generate Datasets", self.generate_datasets),
            ("Test Models", self.test_models)
        ]
        
        for step_name, step_func in steps:
            logger.info(f"\n📋 Step: {step_name}")
            if not step_func():
                logger.error(f"❌ Setup failed at: {step_name}")
                return False
        
        logger.info("\n" + "=" * 50)
        logger.info("🎉 Setup completed successfully!")
        logger.info("\nNext steps:")
        logger.info("1. Run 'python main.py' to start the ML service")
        logger.info("2. Visit http://localhost:8000/docs for API documentation")
        logger.info("3. Test endpoints at http://localhost:8000/health")
        
        return True

def main():
    """Main setup function"""
    parser = argparse.ArgumentParser(description="EV Copilot ML Service Setup")
    parser.add_argument("--step", choices=[
        "deps", "datasets", "test", "dirs", "env", "all"
    ], default="all", help="Run specific setup step")
    
    args = parser.parse_args()
    setup = MLSetup()
    
    if args.step == "deps":
        setup.install_dependencies()
    elif args.step == "datasets":
        setup.generate_datasets()
    elif args.step == "test":
        setup.test_models()
    elif args.step == "dirs":
        setup.create_directories()
    elif args.step == "env":
        setup.check_environment()
    else:
        setup.full_setup()

if __name__ == "__main__":
    main()