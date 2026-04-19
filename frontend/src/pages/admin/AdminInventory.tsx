import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Package, AlertTriangle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { getProductsApi } from "@/lib/admin-api";

const AdminInventory = () => {
  const { token } = useAuth();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-inventory-products"],
    queryFn: () => getProductsApi(token ?? ""),
    enabled: !!token,
  });

  const products = data?.products ?? [];

  const sorted = [...products]
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.stock - b.stock);

  const stockData = products.map((p) => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name,
    stock: p.stock,
    fill: p.stock < 20 ? "hsl(0, 72%, 50%)" : p.stock < 100 ? "hsl(35, 90%, 52%)" : "hsl(215, 55%, 22%)",
  }));

  const totalValue = products.reduce((sum, p) => sum + p.wholesalePrice * p.stock, 0);
  const lowStock = products.filter((p) => p.stock < 20).length;
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Inventory</h1>
        <p className="text-muted-foreground">Track stock levels across all warehouses</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Units</p>
              <p className="text-xl font-bold font-display">{totalUnits.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-accent" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Valuation</p>
              <p className="text-xl font-bold font-display">₹{(totalValue / 100000).toFixed(1)}L</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-destructive/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Low Stock Items</p>
              <p className="text-xl font-bold font-display text-destructive">{lowStock}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <h3 className="font-semibold font-display mb-4">Stock Levels Overview</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={stockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 50%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
            <Tooltip />
            <Bar dataKey="stock" radius={[6, 6, 0, 0]}>
              {stockData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
      </div>

      <div className="stat-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Product</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">SKU</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Category</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Stock</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Unit Price</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Total Value</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{p.name}</td>
                  <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{p.sku}</td>
                  <td className="px-6 py-4 text-sm">{p.category}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{p.stock.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">₹{p.wholesalePrice}</td>
                  <td className="px-6 py-4 text-sm font-semibold">₹{(p.wholesalePrice * p.stock).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {p.stock < 20 ? (
                      <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-destructive/10 text-destructive border border-destructive/20">Critical</span>
                    ) : p.stock < 100 ? (
                      <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-warning/10 text-warning border border-warning/20">Low</span>
                    ) : (
                      <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-success/10 text-success border border-success/20">In Stock</span>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">No inventory records found.</td>
                </tr>
              )}
            </tbody>
          </table>
          {isLoading && <div className="px-6 py-8 text-sm text-muted-foreground">Loading inventory...</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminInventory;
