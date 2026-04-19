# MS Garments - ML Models

This folder contains machine learning models for the ML Insights dashboard.

## 📊 Models

### 1. Demand Forecasting (LSTM)
- **File**: `train_demand_forecast.py`
- **Purpose**: Predicts 7-day future sales demand
- **Algorithm**: LSTM (Long Short-Term Memory) neural network
- **Input**: Historical sales, prices, seasons, fabric types
- **Output**: `models/forecast_results.json`

### 2. Dynamic Pricing (Random Forest)
- **File**: `train_pricing_model.py`
- **Purpose**: Suggests optimal prices for each fabric type
- **Algorithm**: Random Forest Regressor
- **Input**: Sales patterns, seasonality, demand levels
- **Output**: `models/pricing_suggestions.json`

### 3. Anomaly Detection (Isolation Forest)
- **File**: `train_anomaly_detection.py`
- **Purpose**: Detects unusual sales patterns
- **Algorithm**: Isolation Forest
- **Input**: Sales deviations, revenue patterns
- **Output**: `models/anomaly_alerts.json`

## 🚀 Quick Start

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Train All Models
```bash
python train_all.py
```

### Train Individual Models
```bash
# Demand forecasting only
python train_demand_forecast.py

# Pricing model only
python train_pricing_model.py

# Anomaly detection only
python train_anomaly_detection.py
```

## 📁 Output Structure

```
ml_models/
├── models/                          # Trained models and results
│   ├── demand_forecast_lstm.h5      # LSTM model
│   ├── demand_scaler.pkl            # Feature scaler
│   ├── forecast_results.json        # 7-day predictions
│   ├── pricing_model.pkl            # Pricing model
│   ├── season_encoder.pkl           # Season encoder
│   ├── fabric_encoder.pkl           # Fabric encoder
│   ├── pricing_suggestions.json     # Price recommendations
│   ├── anomaly_detector.pkl         # Anomaly detection model
│   ├── anomaly_scaler.pkl           # Anomaly feature scaler
│   └── anomaly_alerts.json          # Detected anomalies
├── train_demand_forecast.py         # LSTM training script
├── train_pricing_model.py           # Pricing training script
├── train_anomaly_detection.py       # Anomaly training script
├── train_all.py                     # Master training script
├── requirements.txt                 # Python dependencies
└── README.md                        # This file
```

## 📈 Model Performance

### Demand Forecasting
- **Architecture**: 3-layer LSTM with dropout
- **Sequence Length**: 14 days
- **Expected MAE**: 10-15 units
- **Training Time**: ~2-5 minutes

### Dynamic Pricing
- **Trees**: 200 estimators
- **Max Depth**: 15
- **Expected MAE**: ₹2-5
- **Training Time**: ~30 seconds

### Anomaly Detection
- **Contamination**: 5%
- **Estimators**: 150
- **Detection Rate**: ~5% of days
- **Training Time**: ~20 seconds

## 🔄 Retraining

Models should be retrained:
- **Weekly**: For demand forecasting (new sales data)
- **Monthly**: For pricing (seasonal changes)
- **Daily/Weekly**: For anomaly detection (recent patterns)

## 🛠️ Integration with Backend

The trained models generate JSON files that can be served by the backend API:

```javascript
// In server/src/routes/admin.js
router.get("/ml-insights", async (req, res) => {
  const forecast = require("../../ml_models/models/forecast_results.json");
  const pricing = require("../../ml_models/models/pricing_suggestions.json");
  const anomalies = require("../../ml_models/models/anomaly_alerts.json");
  
  res.json({ forecast, pricing, anomalies });
});
```

## 📊 Dataset

**Source**: `public/leggings_sales_dataset.csv`

**Columns**:
- `date`: Transaction date
- `month`: Month (1-12)
- `season`: Winter/Summer/Monsoon/Autumn
- `fabric_type`: Cotton/Lycra/Polyester/Wool
- `product_type`: Leggings
- `price`: Selling price
- `quantity_sold`: Units sold

**Date Range**: 2022-01-01 to 2023-03-05 (430 days)

## 🧪 Testing

After training, verify the outputs:

```bash
# Check if models were generated
ls -la models/

# View forecast results
cat models/forecast_results.json

# View pricing suggestions  
cat models/pricing_suggestions.json

# View anomaly alerts
cat models/anomaly_alerts.json
```

## 💡 Tips

1. **First Time Setup**: Install Python 3.9+ and TensorFlow
2. **GPU Acceleration**: Install `tensorflow-gpu` for faster LSTM training
3. **Memory**: LSTM training needs ~2GB RAM
4. **Retraining**: Update CSV with new sales data before retraining

## 🐛 Troubleshooting

**Issue**: `ModuleNotFoundError: No module named 'tensorflow'`
- **Solution**: Run `pip install -r requirements.txt`

**Issue**: Training is slow
- **Solution**: Reduce LSTM epochs or use GPU

**Issue**: Poor predictions
- **Solution**: Add more historical data to CSV

## 📞 Support

For issues or questions about the ML models, check:
- Training logs in console output
- Model performance metrics in JSON files
- Feature importance in pricing model output
