"""
LSTM Demand Forecasting Model for Leggings Sales
Trains on historical sales data to predict future 7-day demand
"""

import numpy as np
import pandas as pd
import json
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
import joblib
import os

# Set random seeds for reproducibility
np.random.seed(42)
tf.random.set_seed(42)

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
    """Create additional features for better predictions"""
    df = df.copy()
    
    # Time-based features
    df['day_of_week'] = df['date'].dt.dayofweek
    df['day_of_month'] = df['date'].dt.day
    df['week_of_year'] = df['date'].dt.isocalendar().week
    
    # Encode categorical variables
    df['season_encoded'] = pd.Categorical(df['season']).codes
    df['fabric_encoded'] = pd.Categorical(df['fabric_type']).codes
    
    # Lag features (previous sales)
    df['sales_lag_1'] = df['quantity_sold'].shift(1)
    df['sales_lag_7'] = df['quantity_sold'].shift(7)
    df['sales_lag_14'] = df['quantity_sold'].shift(14)
    
    # Rolling statistics
    df['sales_rolling_mean_7'] = df['quantity_sold'].rolling(window=7).mean()
    df['sales_rolling_std_7'] = df['quantity_sold'].rolling(window=7).std()
    
    # Drop rows with NaN values created by lag features
    df = df.dropna()
    
    return df

def create_sequences(data, seq_length=14):
    """Create sequences for LSTM training"""
    X, y = [], []
    
    for i in range(len(data) - seq_length):
        X.append(data[i:i + seq_length])
        y.append(data[i + seq_length, 0])  # Predict quantity_sold
    
    return np.array(X), np.array(y)

def build_lstm_model(input_shape):
    """Build LSTM model architecture"""
    model = Sequential([
        LSTM(128, return_sequences=True, input_shape=input_shape),
        Dropout(0.2),
        LSTM(64, return_sequences=True),
        Dropout(0.2),
        LSTM(32, return_sequences=False),
        Dropout(0.2),
        Dense(16, activation='relu'),
        Dense(1)
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='mse',
        metrics=['mae']
    )
    
    return model

def train_model():
    """Main training pipeline"""
    print("=" * 60)
    print("LEGGINGS DEMAND FORECASTING - LSTM MODEL TRAINING")
    print("=" * 60)
    
    # Paths
    csv_path = '../public/leggings_sales_dataset.csv'
    model_dir = './models'
    os.makedirs(model_dir, exist_ok=True)
    
    # Load and preprocess data
    df = load_and_preprocess_data(csv_path)
    df_features = create_features(df)
    
    # Select features for training
    feature_columns = [
        'quantity_sold', 'price', 'month', 'season_encoded', 
        'fabric_encoded', 'day_of_week', 'sales_lag_1', 
        'sales_lag_7', 'sales_rolling_mean_7'
    ]
    
    data = df_features[feature_columns].values
    
    # Scale the data
    print("\nScaling features...")
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(data)
    
    # Save scaler
    joblib.dump(scaler, f'{model_dir}/demand_scaler.pkl')
    print(f"✓ Scaler saved to {model_dir}/demand_scaler.pkl")
    
    # Create sequences
    seq_length = 14  # Use 14 days of history to predict next day
    print(f"\nCreating sequences (sequence length: {seq_length})...")
    X, y = create_sequences(data_scaled, seq_length)
    
    print(f"Total sequences created: {len(X)}")
    print(f"X shape: {X.shape}, y shape: {y.shape}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )
    
    print(f"\nTrain samples: {len(X_train)}, Test samples: {len(X_test)}")
    
    # Build model
    print("\nBuilding LSTM model...")
    model = build_lstm_model((seq_length, X.shape[2]))
    print(model.summary())
    
    # Train model
    print("\nTraining model...")
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=15,
        restore_best_weights=True
    )
    
    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=100,
        batch_size=32,
        callbacks=[early_stopping],
        verbose=1
    )
    
    # Evaluate model
    print("\nEvaluating model...")
    train_loss, train_mae = model.evaluate(X_train, y_train, verbose=0)
    test_loss, test_mae = model.evaluate(X_test, y_test, verbose=0)
    
    print(f"\nTraining Results:")
    print(f"  Train Loss (MSE): {train_loss:.4f}")
    print(f"  Train MAE: {train_mae:.4f}")
    print(f"  Test Loss (MSE): {test_loss:.4f}")
    print(f"  Test MAE: {test_mae:.4f}")
    
    # Save model
    model.save(f'{model_dir}/demand_forecast_lstm.h5')
    print(f"\n✓ Model saved to {model_dir}/demand_forecast_lstm.h5")
    
    # Generate 7-day forecast
    print("\nGenerating 7-day forecast...")
    last_sequence = data_scaled[-seq_length:]
    predictions = []
    
    current_sequence = last_sequence.copy()
    
    for day in range(7):
        # Predict next day
        pred_scaled = model.predict(current_sequence.reshape(1, seq_length, -1), verbose=0)
        predictions.append(pred_scaled[0, 0])
        
        # Update sequence for next prediction
        new_row = current_sequence[-1].copy()
        new_row[0] = pred_scaled[0, 0]  # Update quantity_sold
        current_sequence = np.vstack([current_sequence[1:], new_row])
    
    # Inverse transform predictions
    dummy_array = np.zeros((len(predictions), data.shape[1]))
    dummy_array[:, 0] = predictions
    predictions_actual = scaler.inverse_transform(dummy_array)[:, 0]
    
    # Get last 7 days actual sales for comparison
    last_7_actual = df_features.tail(7)['quantity_sold'].values
    
    # Save forecast results
    forecast_data = {
        "model_info": {
            "model_type": "LSTM",
            "sequence_length": seq_length,
            "train_samples": int(len(X_train)),
            "test_samples": int(len(X_test)),
            "train_mae": float(train_mae),
            "test_mae": float(test_mae),
            "trained_on": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        "forecast": {
            "dates": [
                (df_features['date'].max() + timedelta(days=i+1)).strftime("%Y-%m-%d") 
                for i in range(7)
            ],
            "predicted_sales": [float(pred) for pred in predictions_actual],
            "predicted_rounded": [int(round(pred)) for pred in predictions_actual]
        },
        "historical": {
            "dates": [date.strftime("%Y-%m-%d") for date in last_7_actual.index],
            "actual_sales": [int(sale) for sale in last_7_actual]
        }
    }
    
    with open(f'{model_dir}/forecast_results.json', 'w') as f:
        json.dump(forecast_data, f, indent=2)
    
    print(f"✓ Forecast results saved to {model_dir}/forecast_results.json")
    
    # Print forecast
    print("\n" + "=" * 60)
    print("7-DAY DEMAND FORECAST")
    print("=" * 60)
    for i, (date, pred) in enumerate(zip(forecast_data['forecast']['dates'], 
                                         forecast_data['forecast']['predicted_rounded'])):
        print(f"Day {i+1} ({date}): {pred} units")
    
    print("\n✓ Training completed successfully!")
    return model, scaler, forecast_data

if __name__ == "__main__":
    train_model()
