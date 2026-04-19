import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { getDashboardApi } from "@/lib/admin-api";
import {
  Package, ShoppingCart, TrendingUp, AlertTriangle,
  IndianRupee, ArrowUpRight, ArrowDownRight, Brain
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

const StatCard = ({ title, value, change, changeType, icon: Icon, iconBg }: {
  title: string; value: string; change: string; changeType: "up" | "down";
  icon: React.ElementType; iconBg: string;
}) => (
  <div className="stat-card animate-fade-in">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold font-display mt-1">{value}</p>
        <div className="flex items-center gap-1 mt-2">
          {changeType === "up" ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-destructive" />}
          <span className={`text-xs font-medium ${changeType === "up" ? "text-success" : "text-destructive"}`}>{change}</span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

type AdminDashboardProps = {
  hideTotalRevenue?: boolean;
};

const AdminDashboard = ({ hideTotalRevenue = false }: AdminDashboardProps) => {
  const { user, token } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => getDashboardApi(token ?? ""),
    enabled: !!token,
    refetchInterval: 5000, // Refresh dashboard every 5 seconds
  });

  const lowStockProducts = data?.lowStockProducts ?? [];
  const recentOrders = data?.recentOrders ?? [];
  const revenueData = data?.revenueData ?? [];
  const categoryData = data?.categoryData ?? [];
  const demandForecast = data?.demandForecast ?? [];

  const statusColor: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    confirmed: "bg-info/10 text-info",
    processing: "bg-accent/10 text-accent",
    shipped: "bg-primary/10 text-primary",
    delivered: "bg-success/10 text-success",
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display">Welcome, {user?.name?.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">Admin overview — MS Garments Hub</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {!hideTotalRevenue && (
          <StatCard title="Total Revenue" value={`₹${((data?.stats.totalRevenue ?? 0) / 100000).toFixed(2)}L`} change="Live" changeType="up" icon={IndianRupee} iconBg="bg-accent/10 text-accent" />
        )}
        <StatCard title="Active Orders" value={String(data?.stats.activeOrders ?? 0)} change="Live" changeType="up" icon={ShoppingCart} iconBg="bg-info/10 text-info" />
        <StatCard title="Products" value={String(data?.stats.products ?? 0)} change="Live" changeType="up" icon={Package} iconBg="bg-primary/10 text-primary" />
        <StatCard title="Low Stock" value={String(data?.stats.lowStock ?? 0)} change="Live" changeType="down" icon={AlertTriangle} iconBg="bg-destructive/10 text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 stat-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold font-display">Revenue Overview</h3>
              <p className="text-xs text-muted-foreground">Last 6 months performance</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" /> +18.2%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(215, 55%, 22%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(215, 55%, 22%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(215, 55%, 22%)" fill="url(#revGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <h3 className="font-semibold font-display mb-1">Sales by Category</h3>
          <p className="text-xs text-muted-foreground mb-4">Product distribution</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {categoryData.map((entry, i) => <Cell key={i} fill={["hsl(215, 55%, 22%)", "hsl(40, 80%, 52%)", "hsl(145, 60%, 40%)", "hsl(200, 80%, 50%)", "hsl(0, 72%, 50%)"][i % 5]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {categoryData.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ["hsl(215, 55%, 22%)", "hsl(40, 80%, 52%)", "hsl(145, 60%, 40%)", "hsl(200, 80%, 50%)", "hsl(0, 72%, 50%)"][i % 5] }} />
                <span className="text-muted-foreground">{c.name}</span>
                <span className="font-semibold ml-auto">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-accent" />
            <div>
              <h3 className="font-semibold font-display">AI Demand Forecast</h3>
              <p className="text-xs text-muted-foreground">Predicted vs Actual (7-day)</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={demandForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="hsl(215, 55%, 22%)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="predicted" stroke="hsl(40, 80%, 52%)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <h3 className="font-semibold font-display mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{order.buyerName}</p>
                  <p className="text-xs text-muted-foreground">{order.orderId} • {order.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">₹{(order.total / 1000).toFixed(1)}k</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[order.status]}`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="stat-card border-destructive/30">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold font-display text-destructive">Low Stock Alerts</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                <Package className="w-8 h-8 text-destructive/60" />
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-destructive font-semibold">{p.stock} units left</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading dashboard data...</p>}
    </div>
  );
};

export default AdminDashboard;
