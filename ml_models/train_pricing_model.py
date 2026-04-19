"""
Dynamic Pricing Model for Leggings
Uses Random Forest to suggest optimal prices based on season, fabric, and demand
"""

import numpy as np
import pandas as pd
import json
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

np.random.seed(42)

def load_and_prepare_data(csv_path):
    """Load and prepare data for pricing model"""
    print("Loading dataset...")
    df = pd.read_csv(csv_path)
    df['date'] = pd.to_datetime(df['date'])
    
    # Calculate revenue
    df['revenue'] = df['price'] * df['quantity_sold']
    
    # Calculate demand elasticity features
    df['demand_level'] = pd.cut(df['quantity_sold'], 
                                  bins=[0, 100, 150, 200, 300], 
                                  labels=['Low', 'Medium', 'High', 'Very High'])
    
    return df

def create_pricing_features(df):
    """Create features for pricing model"""
    df = df.copy()
    
    # Encode categorical variables
    le_season = LabelEncoder()
    le_fabric = LabelEncoder()
    
    df['season_encoded'] = le_season.fit_transform(df['season'])
    df['fabric_encoded'] = le_fabric.fit_transform(df['fabric_type'])
    
    # Time features
    df['month'] = pd.to_datetime(df['date']).dt.month
    df['day_of_week'] = pd.to_datetime(df['date']).dt.dayofweek
    
    # Moving averages
    df['avg_sales_7d'] = df.groupby('fabric_type')['quantity_sold'].transform(
        lambda x: x.rolling(window=7, min_periods=1).mean()
    )
    df['avg_revenue_7d'] = df.groupby('fabric_type')['revenue'].transform(
        lambda x: x.rolling(window=7, min_periods=1).mean()
    )
    
    # Fabric popularity
    fabric_sales = df.groupby('fabric_type')['quantity_sold'].sum()
    df['fabric_popularity'] = df['fabric_type'].map(fabric_sales)
    
    return df, le_season, le_fabric

def train_pricing_model():
    """Train dynamic pricing model"""
    print("=" * 60)
    print("DYNAMIC PRICING MODEL TRAINING")
    print("=" * 60)
    
    csv_path = '../public/leggings_sales_dataset.csv'
    model_dir = './models'
    os.makedirs(model_dir, exist_ok=True)
    
    # Load and prepare data
    df = load_and_prepare_data(csv_path)
    df_features, le_season, le_fabric = create_pricing_features(df)
    
    # Features for prediction
    feature_cols = [
        'season_encoded', 'fabric_encoded', 'month', 'day_of_week',
        'quantity_sold', 'avg_sales_7d', 'fabric_popularity'
    ]
    
    X = df_features[feature_cols].values
    y = df_features['price'].values
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"\nTrain samples: {len(X_train)}, Test samples: {len(X_test)}")
    
    # Train model
    print("\nTraining Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)
    
    train_mae = mean_absolute_error(y_train, train_pred)
    test_mae = mean_absolute_error(y_test, test_pred)
    train_r2 = r2_score(y_train, train_pred)
    test_r2 = r2_score(y_test, test_pred)
    
    print(f"\nModel Performance:")
    print(f"  Train MAE: ₹{train_mae:.2f}")
    print(f"  Test MAE: ₹{test_mae:.2f}")
    print(f"  Train R²: {train_r2:.4f}")
    print(f"  Test R²: {test_r2:.4f}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nFeature Importance:")
    print(feature_importance)
    
    # Save model and encoders
    joblib.dump(model, f'{model_dir}/pricing_model.pkl')
    joblib.dump(le_season, f'{model_dir}/season_encoder.pkl')
    joblib.dump(le_fabric, f'{model_dir}/fabric_encoder.pkl')
    
    print(f"\n✓ Model saved to {model_dir}/pricing_model.pkl")
    
    # Generate pricing suggestions
    print("\nGenerating pricing suggestions...")
    
    fabrics = ['Cotton', 'Lycra', 'Polyester', 'Wool']
    seasons = ['Summer', 'Winter', 'Monsoon', 'Autumn']
    
    suggestions = []
    
    for fabric in fabrics:
        fabric_data = df_features[df_features['fabric_type'] == fabric]
        
        if len(fabric_data) == 0:
            continue
            
        avg_sales = fabric_data['quantity_sold'].mean()
        current_price = fabric_data['price'].iloc[-1]
        
        # Predict optimal price for current season
        current_season = df_features['season'].iloc[-1]
        current_month = df_features['month'].iloc[-1]
        
        season_encoded = le_season.transform([current_season])[0]
        fabric_encoded = le_fabric.transform([fabric])[0]
        fabric_pop = fabric_data['fabric_popularity'].iloc[-1]
        avg_sales_7d = fabric_data['avg_sales_7d'].iloc[-1]
        
        # Predict for different demand scenarios
        demand_scenarios = [100, 150, 200]
        predicted_prices = []
        
        for demand in demand_scenarios:
            features = np.array([[
                season_encoded, fabric_encoded, current_month, 5,  # Friday
                demand, avg_sales_7d, fabric_pop
            ]])
            pred_price = model.predict(features)[0]
            predicted_prices.append(float(pred_price))
        
        suggested_price = np.mean(predicted_prices)
        price_change = ((suggested_price - current_price) / current_price) * 100
        
        suggestions.append({
            "fabric": fabric,
            "current_price": float(current_price),
            "suggested_price": float(round(suggested_price)),
            "price_change_percent": float(round(price_change, 2)),
            "avg_monthly_sales": float(round(avg_sales)),
            "season": current_season,
            "confidence": "High" if abs(price_change) < 10 else "Medium"
        })
    
    # Save pricing suggestions
    pricing_data = {
        "model_info": {
            "model_type": "Random Forest",
            "n_estimators": 200,
            "test_mae": float(test_mae),
            "test_r2": float(test_r2),
            "trained_on": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        "suggestions": suggestions
    }
    
    with open(f'{model_dir}/pricing_suggestions.json', 'w') as f:
        json.dump(pricing_data, f, indent=2)
    
    print(f"✓ Pricing suggestions saved to {model_dir}/pricing_suggestions.json")
    
    # Print suggestions
    print("\n" + "=" * 60)
    print("DYNAMIC PRICING SUGGESTIONS")
    print("=" * 60)
    for sug in suggestions:
        change_symbol = "↑" if sug['price_change_percent'] > 0 else "↓" if sug['price_change_percent'] < 0 else "→"
        print(f"\n{sug['fabric']} Leggings:")
        print(f"  Current: ₹{sug['current_price']:.0f}")
        print(f"  Suggested: ₹{sug['suggested_price']:.0f} {change_symbol} {abs(sug['price_change_percent']):.1f}%")
        print(f"  Avg Sales: {sug['avg_monthly_sales']:.0f} units/month")
        print(f"  Confidence: {sug['confidence']}")
    
    print("\n✓ Training completed successfully!")
    return model, suggestions

if __name__ == "__main__":
    train_pricing_model()
