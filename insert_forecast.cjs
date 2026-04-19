const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

mongoose.connect('mongodb://localhost:27017/ms_garments', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('connected', async () => {
  try {
    // Define Forecast schema
    const forecastSchema = new mongoose.Schema({
      day: String,
      actual: Number,
      predicted: Number,
      createdAt: { type: Date, default: Date.now }
    }, { collection: 'forecasts' });

    const Forecast = mongoose.model('Forecast', forecastSchema);

    console.log('\n🗑️ Clearing existing forecasts...');
    await Forecast.deleteMany({});

    // Read the forecast JSON file
    const forecastFile = path.join(process.cwd(), 'ml_models', 'models', 'forecast_results.json');
    
    console.log('📂 Looking for:', forecastFile);

    let forecasts = [];
    
    if (fs.existsSync(forecastFile)) {
      const forecastData = JSON.parse(fs.readFileSync(forecastFile, 'utf-8'));
      
      console.log('\n📊 Forecast data from ML models:');
      console.log('Predicted sales:', forecastData.forecast.predicted_sales);
      console.log('Historical actual sales:', forecastData.historical.actual_sales);

      // Map forecast results to database format
      if (forecastData.forecast && forecastData.forecast.dates) {
        forecastData.forecast.dates.forEach((date, index) => {
          // Use historical data for actual values and predicted_sales for predictions
          const historicalDates = forecastData.historical.dates;
          const historicalSales = forecastData.historical.actual_sales;
          
          forecasts.push({
            day: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            actual: historicalSales[index] || null,
            predicted: forecastData.forecast.predicted_sales[index] || 126
          });
        });
      }
    }

    if (forecasts.length === 0) {
      // Create mock forecast data for 7 days
      console.log('\n⚠️ Creating mock forecast data...');
      const today = new Date();
      const mockData = [126, 126, 125, 125, 125, 135, 133];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        forecasts.push({
          day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          actual: Math.floor(Math.random() * 50) + 100,
          predicted: mockData[i]
        });
      }
    }

    console.log('\n✅ Inserting forecasts into database...');
    const inserted = await Forecast.insertMany(forecasts);
    console.log(`✅ Inserted ${inserted.length} forecast records`);
    
    console.log('\n📈 Forecast Preview:');
    inserted.forEach((f, i) => {
      console.log(`  Day ${i + 1} (${f.day}): Predicted: ${f.predicted} units, Actual: ${f.actual || 'N/A'}`);
    });

    console.log('\n✅ Forecast data ready! Refresh the dashboard to see the chart.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
});
