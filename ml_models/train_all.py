"""
Master script to train all ML models
Run this to train demand forecasting, pricing, and anomaly detection models
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from train_demand_forecast import train_model as train_demand
from train_pricing_model import train_pricing_model
from train_anomaly_detection import train_anomaly_detector

def main():
    """Train all ML models"""
    print("\n" + "=" * 70)
    print(" " * 15 + "MS GARMENTS - ML MODEL TRAINING SUITE")
    print("=" * 70)
    print("\nThis will train 3 ML models:")
    print("  1. LSTM Demand Forecasting (7-day predictions)")
    print("  2. Random Forest Dynamic Pricing (price optimization)")
    print("  3. Isolation Forest Anomaly Detection (unusual patterns)")
    print("\n" + "=" * 70)
    
    input("\nPress Enter to start training...")
    
    try:
        # Train demand forecasting model
        print("\n\n")
        print("█" * 70)
        print("STEP 1/3: Training Demand Forecasting Model")
        print("█" * 70)
        train_demand()
        
        # Train pricing model
        print("\n\n")
        print("█" * 70)
        print("STEP 2/3: Training Dynamic Pricing Model")
        print("█" * 70)
        train_pricing_model()
        
        # Train anomaly detection model
        print("\n\n")
        print("█" * 70)
        print("STEP 3/3: Training Anomaly Detection Model")
        print("█" * 70)
        train_anomaly_detector()
        
        # Summary
        print("\n\n")
        print("=" * 70)
        print(" " * 20 + "🎉 ALL MODELS TRAINED SUCCESSFULLY! 🎉")
        print("=" * 70)
        print("\nGenerated files:")
        print("  📁 models/")
        print("     ├── demand_forecast_lstm.h5 (LSTM model)")
        print("     ├── demand_scaler.pkl (Feature scaler)")
        print("     ├── forecast_results.json (7-day predictions)")
        print("     ├── pricing_model.pkl (RF pricing model)")
        print("     ├── season_encoder.pkl & fabric_encoder.pkl")
        print("     ├── pricing_suggestions.json (Price recommendations)")
        print("     ├── anomaly_detector.pkl (Isolation Forest)")
        print("     ├── anomaly_scaler.pkl (Feature scaler)")
        print("     └── anomaly_alerts.json (Detected anomalies)")
        print("\n✓ Models are ready to use in the application!")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error during training: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
