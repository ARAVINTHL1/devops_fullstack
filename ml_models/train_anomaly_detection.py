"""
Anomaly Detection for Sales Patterns
Uses Isolation Forest to detect unusual sales patterns
"""

import numpy as np
import pandas as pd
import json
from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os

np.random.seed(42)

def load_and_prepare_data(csv_path):
    """Load and prepare data for anomaly detection"""
    print("Loading dataset...")
    df = pd.read_csv(csv_path)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    return df

def create_anomaly_features(df):
    """Create features for anomaly detection"""
    df = df.copy()
    
    # Rolling statistics
    df['sales_rolling_mean_7'] = df['quantity_sold'].rolling(window=7).mean()
    df['sales_rolling_std_7'] = df['quantity_sold'].rolling(window=7).std()
    df['sales_rolling_mean_30'] = df['quantity_sold'].rolling(window=30).mean()
    
    # Deviation from mean
    df['deviation_from_mean'] = (df['quantity_sold'] - df['sales_rolling_mean_7']) / (df['sales_rolling_std_7'] + 1e-6)
    
    # Price deviation
    df['price_vs_avg'] = df.groupby('fabric_type')['price'].transform(lambda x: (x - x.mean()) / (x.std() + 1e-6))
    
    # Day-of-week patterns
    df['day_of_week'] = df['date'].dt.dayofweek
    df['weekend'] = (df['day_of_week'] >= 5).astype(int)
    
    # Revenue
    df['revenue'] = df['price'] * df['quantity_sold']
    df['revenue_rolling_mean'] = df['revenue'].rolling(window=7).mean()
    
    # Encode fabric type
    df['fabric_encoded'] = pd.Categorical(df['fabric_type']).codes
    
    df = df.dropna()
    
    return df

def train_anomaly_detector():
    """Train anomaly detection model"""
    print("=" * 60)
    print("ANOMALY DETECTION MODEL TRAINING")
    print("=" * 60)
    
    csv_path = '../public/leggings_sales_dataset.csv'
    model_dir = './models'
    os.makedirs(model_dir, exist_ok=True)
    
    # Load and prepare data
    df = load_and_prepare_data(csv_path)
    df_features = create_anomaly_features(df)
    
    # Features for anomaly detection
    feature_cols = [
        'quantity_sold', 'price', 'revenue', 
        'sales_rolling_mean_7', 'sales_rolling_std_7',
        'deviation_from_mean', 'price_vs_avg',
        'day_of_week', 'weekend', 'fabric_encoded'
    ]
    
    X = df_features[feature_cols].values
    
    print(f"\nTotal samples: {len(X)}")
    
    # Scale features
    print("\nScaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    joblib.dump(scaler, f'{model_dir}/anomaly_scaler.pkl')
    
    # Train Isolation Forest
    print("\nTraining Isolation Forest...")
    model = IsolationForest(
        contamination=0.05,  # Expect 5% anomalies
        random_state=42,
        n_estimators=150,
        max_samples='auto'
    )
    
    predictions = model.fit_predict(X_scaled)
    anomaly_scores = model.score_samples(X_scaled)
    
    # Identify anomalies
    df_features['anomaly'] = predictions
    df_features['anomaly_score'] = anomaly_scores
    
    anomalies = df_features[df_features['anomaly'] == -1].copy()
    n_anomalies = len(anomalies)
    
    print(f"\nAnomalies detected: {n_anomalies} ({n_anomalies/len(df_features)*100:.2f}%)")
    
    # Save model
    joblib.dump(model, f'{model_dir}/anomaly_detector.pkl')
    print(f"✓ Model saved to {model_dir}/anomaly_detector.pkl")
    
    # Analyze anomalies
    if len(anomalies) > 0:
        # Get most recent anomalies (last 10)
        recent_anomalies = anomalies.tail(10).sort_values('anomaly_score')
        
        anomaly_alerts = []
        
        for idx, row in recent_anomalies.iterrows():
            alert_type = "sales_spike" if row['deviation_from_mean'] > 0 else "sales_drop"
            
            severity = "critical" if abs(row['deviation_from_mean']) > 3 else "warning"
            
            anomaly_alerts.append({
                "date": row['date'].strftime("%Y-%m-%d"),
                "type": alert_type,
                "severity": severity,
                "fabric": row['fabric_type'],
                "quantity_sold": int(row['quantity_sold']),
                "expected_range": f"{int(row['sales_rolling_mean_7'] - row['sales_rolling_std_7'])}-{int(row['sales_rolling_mean_7'] + row['sales_rolling_std_7'])}",
                "deviation": float(round(row['deviation_from_mean'], 2)),
                "message": f"{'Unusual spike' if alert_type == 'sales_spike' else 'Significant drop'} in {row['fabric_type']} sales: {int(row['quantity_sold'])} units (expected: {int(row['sales_rolling_mean_7'])})"
            })
    else:
        anomaly_alerts = []
    
    # Save anomaly results
    anomaly_data = {
        "model_info": {
            "model_type": "Isolation Forest",
            "contamination": 0.05,
            "n_estimators": 150,
            "total_anomalies": int(n_anomalies),
            "trained_on": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        "alerts": anomaly_alerts[:5],  # Keep top 5 most severe
        "statistics": {
            "total_days_analyzed": int(len(df_features)),
            "anomaly_rate": float(round(n_anomalies/len(df_features)*100, 2)),
            "avg_daily_sales": float(round(df_features['quantity_sold'].mean(), 2)),
            "sales_std": float(round(df_features['quantity_sold'].std(), 2))
        }
    }
    
    with open(f'{model_dir}/anomaly_alerts.json', 'w') as f:
        json.dump(anomaly_data, f, indent=2)
    
    print(f"✓ Anomaly alerts saved to {model_dir}/anomaly_alerts.json")
    
    # Print alerts
    print("\n" + "=" * 60)
    print("TOP ANOMALY ALERTS")
    print("=" * 60)
    
    if len(anomaly_alerts) > 0:
        for i, alert in enumerate(anomaly_alerts[:5], 1):
            severity_emoji = "🔴" if alert['severity'] == 'critical' else "⚠️"
            print(f"\n{i}. {severity_emoji} {alert['date']} - {alert['fabric']}")
            print(f"   {alert['message']}")
            print(f"   Expected range: {alert['expected_range']} units")
    else:
        print("\n✓ No significant anomalies detected in recent data")
    
    print("\n✓ Training completed successfully!")
    return model, anomaly_data

if __name__ == "__main__":
    train_anomaly_detector()
