"""
Simplified Demand Forecasting using Random Forest
Fast training alternative to LSTM
"""

import numpy as np
import pandas as pd
import json
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib
import os

np.random.seed(42)

def load_and_preprocess_data(csv_path):
    """Load and preprocess the sales dataset"""
    print("Loading dataset...")
    df = pd.read_csv(csv_path)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    print(f"Dataset shape: {df.shape}")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    
    return df

def create_features(df):
    """Create features for prediction"""
    df = df.copy()
    
    # Time-based features
    df['day_of_week'] = df['date'].dt.dayofweek
    df['day_of_month'] = df['date'].dt.day
    df['month'] = df['date'].dt.month
    df['week_of_year'] = df['date'].dt.isocalendar().week
    
    # Encode categorical variables
    df['season_encoded'] = pd.Categorical(df['season']).codes
    df['fabric_encoded'] = pd.Categorical(df['fabric_type']).codes
    
    # Lag features
    for lag in [1, 3, 7, 14]:
        df[f'sales_lag_{lag}'] = df['quantity_sold'].shift(lag)
    
    # Rolling statistics
    for window in [7, 14, 30]:
        df[f'sales_rolling_mean_{window}'] = df['quantity_sold'].rolling(window=window).mean()
        df[f'sales_rolling_std_{window}'] = df['quantity_sold'].rolling(window=window).std()
    
    # Price features
    df['price_rolling_mean'] = df['price'].rolling(window=7).mean()
    
    # Drop NaN values
    df = df.dropna()
    
    return df

def train_model():
    """Train demand forecasting model"""
    print("=" * 60)
    print("DEMAND FORECASTING - RANDOM FOREST MODEL")
    print("=" * 60)
    
    csv_path = '../public/leggings_sales_dataset.csv'
    model_dir = './models'
    os.makedirs(model_dir, exist_ok=True)
    
    # Load data
    df = load_and_preprocess_data(csv_path)
    df_features = create_features(df)
    
    # Select features
    feature_cols = [
        'price', 'month', 'day_of_week', 'week_of_year',
        'season_encoded', 'fabric_encoded',
        'sales_lag_1', 'sales_lag_3', 'sales_lag_7', 'sales_lag_14',
        'sales_rolling_mean_7', 'sales_rolling_std_7',
        'sales_rolling_mean_14', 'price_rolling_mean'
    ]
    
    X = df_features[feature_cols].values
    y = df_features['quantity_sold'].values
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )
    
    print(f"\nTrain samples: {len(X_train)}, Test samples: {len(X_test)}")
    
    # Train model
    print("\nTraining Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=20,
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
    train_mse = mean_squared_error(y_train, train_pred)
    test_mse = mean_squared_error(y_test, test_pred)
    
    print(f"\nModel Performance:")
    print(f"  Train MAE: {train_mae:.2f} units")
    print(f"  Test MAE: {test_mae:.2f} units")
    print(f"  Train RMSE: {np.sqrt(train_mse):.2f}")
    print(f"  Test RMSE: {np.sqrt(test_mse):.2f}")
    
    # Save model
    joblib.dump(model, f'{model_dir}/demand_model.pkl')
    joblib.dump(feature_cols, f'{model_dir}/feature_columns.pkl')
    print(f"\n✓ Model saved")
    
    # Generate 7-day forecast
    print("\nGenerating 7-day forecast...")
    
    last_data = df_features.tail(1).copy()
    predictions = []
    
    for day in range(7):
        # Prepare features for next day
        pred_date = last_data['date'].iloc[0] + timedelta(days=day+1)
        
        pred_features = {
            'price': last_data['price'].iloc[0],
            'month': pred_date.month,
            'day_of_week': pred_date.dayofweek,
            'week_of_year': pred_date.isocalendar().week,
            'season_encoded': last_data['season_encoded'].iloc[0],
            'fabric_encoded': last_data['fabric_encoded'].iloc[0],
            'sales_lag_1': last_data['quantity_sold'].iloc[0],
            'sales_lag_3': last_data['sales_lag_1'].iloc[0] if day == 0 else predictions[max(0, day-3)],
            'sales_lag_7': last_data['sales_lag_7'].iloc[0] if day < 7 else predictions[0],
            'sales_lag_14': last_data['sales_lag_14'].iloc[0],
            'sales_rolling_mean_7': last_data['sales_rolling_mean_7'].iloc[0],
            'sales_rolling_std_7': last_data['sales_rolling_std_7'].iloc[0],
            'sales_rolling_mean_14': last_data['sales_rolling_mean_14'].iloc[0],
            'price_rolling_mean': last_data['price_rolling_mean'].iloc[0]
        }
        
        X_pred = np.array([[pred_features[col] for col in feature_cols]])
        pred_sales = model.predict(X_pred)[0]
        predictions.append(int(round(pred_sales)))
        
        # Update last_data for next iteration
        last_data['quantity_sold'] = pred_sales
        last_data['sales_lag_1'] = last_data['quantity_sold']
    
    # Get historical data for chart
    last_7_days = df_features.tail(7)
    
    forecast_data = {
        "model_info": {
            "model_type": "Random Forest",
            "n_estimators": 200,
            "train_mae": float(train_mae),
            "test_mae": float(test_mae),
            "trained_on": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        "forecast": {
            "dates": [(df_features['date'].max() + timedelta(days=i+1)).strftime("%Y-%m-%d") for i in range(7)],
            "predicted_sales": predictions,
            "predicted_rounded": predictions
        },
        "historical": {
            "dates": [date.strftime("%Y-%m-%d") for date in last_7_days['date']],
            "actual_sales": last_7_days['quantity_sold'].tolist()
        }
    }
    
    with open(f'{model_dir}/forecast_results.json', 'w') as f:
        json.dump(forecast_data, f, indent=2)
    
    print(f"✓ Forecast saved")
    
    print("\n" + "=" * 60)
    print("7-DAY DEMAND FORECAST")
    print("=" * 60)
    for i, (date, pred) in enumerate(zip(forecast_data['forecast']['dates'], predictions)):
        print(f"Day {i+1} ({date}): {pred} units")
    
    print("\n✓ Training completed!")
    return model, forecast_data

if __name__ == "__main__":
    train_model()
