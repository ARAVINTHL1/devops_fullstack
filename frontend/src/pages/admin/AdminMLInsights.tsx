import { Brain, TrendingUp, Zap, Shield, Eye } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { getMlInsightsApi } from "@/lib/admin-api";

const AdminMLInsights = () => {
  const { token } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-ml-insights"],
    queryFn: () => getMlInsightsApi(token ?? ""),
    enabled: !!token,
    refetchInterval: 60000, // Refetch every minute
  });

  const models = data?.models ?? [];
  const demandForecast = data?.demandForecast ?? [];
  const dynamicPricing = data?.dynamicPricing ?? [];
  const anomalies = data?.anomalies ?? [];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-3"><Brain className="w-8 h-8 text-accent" /> ML Insights</h1>
        <p className="text-muted-foreground">AI-powered analytics and predictions</p>
      </div>

      {models.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {models.map((model, idx) => {
            const modelIcon =
              model.name && model.name.toLowerCase().includes("demand") ? TrendingUp :
              model.name && model.name.toLowerCase().includes("pricing") ? Zap :
              model.name && model.name.toLowerCase().includes("anomaly") ? Shield : Eye;

            return (
              <div key={model.id || idx} className="stat-card">
                <modelIcon className="w-8 h-8 text-accent mb-3" />
                <h3 className="font-semibold font-display text-sm">{model.name}</h3>
                <p className="text-lg font-bold font-display mt-1">{model.accuracy}</p>
                <p className="text-xs text-muted-foreground mt-1">{model.trained}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="stat-card">
        <h3 className="font-semibold font-display mb-1">7-Day Demand Forecast</h3>
        <p className="text-xs text-muted-foreground mb-4">Random Forest model predictions for next 7 days</p>
        
        {demandForecast.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={demandForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
              <XAxis dataKey="day" stroke="hsl(215, 15%, 50%)" tick={{ fontSize: 12 }} />
              <YAxis stroke="hsl(215, 15%, 50%)" tick={{ fontSize: 12 }} label={{ value: 'Units', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Legend />
              {demandForecast.some(d => d.actual !== null && d.actual !== undefined) && (
                <Line type="monotone" dataKey="actual" stroke="hsl(215, 55%, 22%)" strokeWidth={2.5} dot={{ r: 5 }} name="Actual" />
              )}
              <Line type="monotone" dataKey="predicted" stroke="hsl(40, 80%, 52%)" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 5 }} name="Predicted" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>No forecast data available. Train the ML models first.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4"><Zap className="w-5 h-5 text-accent" /><h3 className="font-semibold font-display">Dynamic Pricing Suggestions</h3></div>
          <div className="space-y-3">
            {dynamicPricing.length > 0 ? (
              dynamicPricing.map((item, idx) => {
                const diff = item.suggested - item.current;
                return (
                  <div key={item.id || idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{item.product}</p>
                      <p className="text-xs text-muted-foreground">{item.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">₹{item.current} → <span className="font-bold text-foreground">₹{item.suggested}</span></p>
                      <p className={`text-xs font-semibold ${diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {diff > 0 ? `+₹${diff}` : diff < 0 ? `-₹${Math.abs(diff)}` : "No change"}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No pricing suggestions available.</p>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4"><Shield className="w-5 h-5 text-destructive" /><h3 className="font-semibold font-display">Anomaly Alerts</h3></div>
          <div className="space-y-3">
            {anomalies.length > 0 ? (
              anomalies.map((a, idx) => (
                <div key={a.id || idx} className={`p-3 rounded-lg border ${a.severity === "critical" ? "bg-destructive/5 border-destructive/20" : a.severity === "warning" ? "bg-warning/5 border-warning/20" : "bg-muted/50 border-border"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold uppercase ${a.severity === "critical" ? "text-destructive" : a.severity === "warning" ? "text-warning" : "text-muted-foreground"}`}>{a.severity}</span>
                    <span className="text-[10px] text-muted-foreground">{a.timeLabel || a.time}</span>
                  </div>
                  <p className="text-sm font-medium">{a.type}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{data?.message || "No anomaly alerts."}</p>
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Brain className="w-12 h-12 text-accent animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading ML insights...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMLInsights;
