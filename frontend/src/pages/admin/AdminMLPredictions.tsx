import { Brain, TrendingUp, Zap, Shield, AlertTriangle, Calendar, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { getMlInsightsApi } from "@/lib/admin-api";

const AdminMLPredictions = () => {
  const { token } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-ml-insights"],
    queryFn: () => getMlInsightsApi(token ?? ""),
    enabled: !!token,
    refetchInterval: 60000,
  });

  const models = data?.models ?? [];
  const demandForecast = data?.demandForecast ?? [];
  const dynamicPricing = data?.dynamicPricing ?? [];
  const anomalies = data?.anomalies ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex flex-col items-center gap-4">
          <Brain className="w-16 h-16 text-accent animate-pulse" />
          <p className="text-lg font-medium text-muted-foreground">Loading ML Predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Brain className="w-12 h-12 text-accent" />
            <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ML Predictions Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            AI-powered demand forecasting, pricing optimization, and anomaly detection
          </p>
        </div>

        {/* Model Info Cards */}
        {models.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {models.map((model, idx) => (
              <div key={model.id || idx} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-accent">
                <div className="flex items-center gap-3 mb-3">
                  <Brain className="w-8 h-8 text-accent" />
                  <h3 className="font-semibold font-display text-lg">{model.name}</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Model Type: <span className="font-medium text-foreground">{model.type}</span></p>
                  <p className="text-sm text-muted-foreground">Accuracy: <span className="font-medium text-foreground">{model.accuracy}</span></p>
                  <p className="text-xs text-muted-foreground">Trained: {model.trained}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 7-Day Demand Forecast */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-accent" />
            <div>
              <h2 className="text-2xl font-bold font-display">7-Day Demand Forecast</h2>
              <p className="text-sm text-muted-foreground">Predicted sales volume for the next week</p>
            </div>
          </div>
          
          {demandForecast.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={demandForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="day" 
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Units', angle: -90, position: 'insideLeft', style: { fontSize: 14 } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  labelFormatter={(value) => `Date: ${value}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#f59e0b' }}
                  name="Predicted Sales"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No forecast data available. Train the models first.</p>
              </div>
            </div>
          )}

          {/* Forecast Summary */}
          {demandForecast.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <p className="text-xs text-blue-600 font-semibold mb-1">7-Day Average</p>
                <p className="text-2xl font-bold text-blue-700">
                  {Math.round(demandForecast.reduce((sum, d) => sum + d.predicted, 0) / demandForecast.length)} units
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <p className="text-xs text-green-600 font-semibold mb-1">Peak Day</p>
                <p className="text-2xl font-bold text-green-700">
                  {Math.max(...demandForecast.map(d => d.predicted))} units
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                <p className="text-xs text-orange-600 font-semibold mb-1">Low Day</p>
                <p className="text-2xl font-bold text-orange-700">
                  {Math.min(...demandForecast.map(d => d.predicted))} units
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <p className="text-xs text-purple-600 font-semibold mb-1">Total Week</p>
                <p className="text-2xl font-bold text-purple-700">
                  {demandForecast.reduce((sum, d) => sum + d.predicted, 0)} units
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Pricing & Anomalies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dynamic Pricing */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-8 h-8 text-accent" />
              <div>
                <h2 className="text-2xl font-bold font-display">Pricing Optimization</h2>
                <p className="text-sm text-muted-foreground">AI-recommended price adjustments</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {dynamicPricing.length > 0 ? (
                dynamicPricing.map((item, idx) => {
                  const diff = item.suggested - item.current;
                  const percentChange = ((diff / item.current) * 100).toFixed(1);
                  return (
                    <div key={item.id || idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{item.product}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">₹{item.current}</span>
                          <span className="text-xl font-bold text-foreground">→ ₹{item.suggested}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground flex-1">{item.reason}</p>
                        <span className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold ${
                          diff > 0 ? "bg-green-100 text-green-700" : 
                          diff < 0 ? "bg-red-100 text-red-700" : 
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {diff > 0 ? `+${percentChange}%` : diff < 0 ? `${percentChange}%` : "Optimal"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No pricing suggestions available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Anomaly Alerts */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-destructive" />
              <div>
                <h2 className="text-2xl font-bold font-display">Anomaly Detection</h2>
                <p className="text-sm text-muted-foreground">Unusual patterns and alerts</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {anomalies.length > 0 ? (
                anomalies.map((alert, idx) => (
                  <div 
                    key={alert.id || idx} 
                    className={`border-l-4 rounded-lg p-4 ${
                      alert.severity === "critical" ? "border-red-500 bg-red-50" :
                      alert.severity === "warning" ? "border-yellow-500 bg-yellow-50" :
                      "border-blue-500 bg-blue-50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-5 h-5 ${
                          alert.severity === "critical" ? "text-red-600" :
                          alert.severity === "warning" ? "text-yellow-600" :
                          "text-blue-600"
                        }`} />
                        <span className={`text-xs font-semibold uppercase ${
                          alert.severity === "critical" ? "text-red-700" :
                          alert.severity === "warning" ? "text-yellow-700" :
                          "text-blue-700"
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{alert.timeLabel || alert.time}</span>
                    </div>
                    <p className="font-medium text-sm mb-1">{alert.type}</p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                ))
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-green-600 font-medium">✓ No anomalies detected</p>
                    <p className="text-xs">All metrics are within normal ranges</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            🤖 Powered by Machine Learning • Data updates every 60 seconds • 
            {models.length > 0 && ` Last trained: ${models[0].trained}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminMLPredictions;
