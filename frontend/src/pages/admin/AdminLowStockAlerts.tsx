import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { AlertTriangle, TrendingDown, ShieldAlert } from "lucide-react";

interface LowStockAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  message: string;
  read: boolean;
  createdAt: string;
}

interface AlertsResponse {
  alerts: LowStockAlert[];
}

const LowStockAlertsPage = () => {
  const { token } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["low-stock-alerts"],
    queryFn: async () => {
      return apiRequest<AlertsResponse>("/admin/alerts/low-stock", {
        method: "GET",
        token: token ?? "",
      });
    },
    enabled: !!token,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  const alerts = data?.alerts ?? [];

  const criticalCount = alerts.filter((a) => a.currentStock < 100).length;
  const highRiskCount = alerts.filter((a) => a.currentStock >= 100 && a.currentStock < 250).length;

  const getSeverity = (stock: number) => {
    if (stock < 100) {
      return {
        label: "Critical",
        cardClass: "border-destructive/40 bg-destructive/5",
        accentClass: "bg-destructive",
        chipClass: "bg-destructive/15 text-destructive border border-destructive/30",
      };
    }
    if (stock < 250) {
      return {
        label: "High Risk",
        cardClass: "border-warning/50 bg-warning/5",
        accentClass: "bg-warning",
        chipClass: "bg-warning/15 text-warning border border-warning/30",
      };
    }
    return {
      label: "Warning",
      cardClass: "border-amber-500/50 bg-amber-50",
      accentClass: "bg-amber-500",
      chipClass: "bg-amber-100 text-amber-700 border border-amber-200",
    };
  };

  const getTimeLabel = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return createdDate.toLocaleDateString();
  };

  const formatProductId = (productId: string) => {
    if (productId.length <= 12) return productId;
    return `${productId.slice(0, 12)}...`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            Low Stock Alerts
          </h1>
          <p className="text-muted-foreground mt-1">Monitor inventory risk and prioritize replenishment decisions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Alerts</p>
              <p className="text-2xl font-bold font-display mt-1">{alerts.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-destructive/20" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical Alerts</p>
              <p className="text-2xl font-bold font-display mt-1">{criticalCount}</p>
            </div>
            <ShieldAlert className="w-8 h-8 text-destructive/20" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">High Risk Alerts</p>
              <p className="text-2xl font-bold font-display mt-1">{highRiskCount}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-warning/25" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="stat-card p-8 text-center">
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="stat-card p-10 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <AlertTriangle className="w-12 h-12 text-success/20 mx-auto mb-2" />
          <h3 className="font-semibold text-lg">No Active Low Stock Alerts</h3>
          <p className="text-sm text-muted-foreground mt-1">Inventory levels are currently healthy across tracked products.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const severity = getSeverity(alert.currentStock);
            const stockRatio = Math.min((alert.currentStock / 500) * 100, 100);

            return (
              <div
                key={alert.id}
                className={`stat-card border ${severity.cardClass}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{alert.productName}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${severity.chipClass}`}>
                        {severity.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="font-medium">ID: {formatProductId(alert.productId)}</span>
                      <span>•</span>
                      <span>{getTimeLabel(alert.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold font-display">
                      {alert.currentStock}
                    </div>
                    <p className="text-xs text-muted-foreground">units</p>
                    <p className="text-xs text-warning font-semibold mt-2">Low Stock</p>
                  </div>
                </div>

                {/* Stock Level Bar */}
                <div className="mt-3 h-2 bg-gray-200 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all ${severity.accentClass}`}
                    style={{ width: `${stockRatio}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default LowStockAlertsPage;
