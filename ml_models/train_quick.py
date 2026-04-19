"""
Quick training script - trains all 3 models without TensorFlow
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from train_demand_forecast_simple import train_model as train_demand
from train_pricing_model import train_pricing_model
from train_anomaly_detection import train_anomaly_detector

def main():
    print("\n" + "=" * 70)
    print(" " * 15 + "MS GARMENTS - QUICK ML TRAINING")
    print("=" * 70)
    print("\nTraining 3 models using scikit-learn...")
    print("=" * 70 + "\n")
    
    try:
        # Train all models
        print("█" * 70)
        print("STEP 1/3: Demand Forecasting")
        print("█" * 70)
        train_demand()
        
        print("\n\n" + "█" * 70)
        print("STEP 2/3: Dynamic Pricing")
        print("█" * 70)
        train_pricing_model()
        
        print("\n\n" + "█" * 70)
        print("STEP 3/3: Anomaly Detection")
        print("█" * 70)
        train_anomaly_detector()
        
        print("\n\n" + "=" * 70)
        print(" " * 20 + "🎉 ALL MODELS TRAINED! 🎉")
        print("=" * 70)
        print("\n✓ ML Insights page is now ready to use!")
        print("✓ Refresh http://localhost:8080/admin/ml-insights")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
