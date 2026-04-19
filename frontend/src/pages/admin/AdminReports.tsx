import { BarChart3, Download, FileText, TrendingUp, IndianRupee, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { getReportsApi } from "@/lib/admin-api";

type AdminReportsProps = {
  hideTotalRevenue?: boolean;
};

const AdminReports = ({ hideTotalRevenue = false }: AdminReportsProps) => {
  const { token } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => getReportsApi(token ?? ""),
    enabled: !!token,
  });

  const monthlyData = data?.monthlyData ?? [];
  const topBuyers = data?.topBuyers ?? [];
  const totalRevenue = monthlyData.reduce((sum, row) => sum + row.revenue, 0);
  const totalOrders = monthlyData.reduce((sum, row) => sum + row.orders, 0);
  const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;

  const exportCsv = () => {
    const lines: string[] = [];

    lines.push("REPORT SUMMARY");
    lines.push("Metric,Value");
    lines.push(`Total Revenue,${totalRevenue.toFixed(2)}`);
    lines.push(`Total Orders,${totalOrders}`);
    lines.push(`Average Order Value,${avgOrder.toFixed(2)}`);
    lines.push("");

    lines.push("MONTHLY TREND");
    lines.push("Month,Revenue,Orders");
    monthlyData.forEach((row) => {
      lines.push(`${row.month},${row.revenue},${row.orders}`);
    });
    lines.push("");

    lines.push("TOP BUYERS");
    lines.push("Buyer,Orders,Revenue");
    topBuyers.forEach((buyer) => {
      lines.push(`${buyer.name},${buyer.orders},${buyer.revenue}`);
    });

    const csvContent = lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `reports-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const reportDate = new Date().toLocaleString();
    const monthlyRows = monthlyData
      .map((row) => `<tr><td>${row.month}</td><td>INR ${row.revenue.toLocaleString()}</td><td>${row.orders}</td></tr>`)
      .join("");
    const buyerRows = topBuyers
      .map((buyer) => `<tr><td>${buyer.name}</td><td>${buyer.orders}</td><td>INR ${buyer.revenue.toLocaleString()}</td></tr>`)
      .join("");

    const html = `
      <html>
      <head>
        <title>MS Garments Reports</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1f2937; padding: 24px; }
          h1 { margin: 0 0 4px 0; }
          p { margin: 0 0 16px 0; color: #6b7280; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0 24px; }
          .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
          .label { font-size: 12px; color: #6b7280; }
          .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f8fafc; }
          h3 { margin-top: 22px; margin-bottom: 6px; }
        </style>
      </head>
      <body>
        <h1>MS Garments Reports</h1>
        <p>Generated on ${reportDate}</p>

        <div class="grid">
          <div class="card"><div class="label">Total Revenue</div><div class="value">INR ${Math.round(totalRevenue).toLocaleString()}</div></div>
          <div class="card"><div class="label">Orders</div><div class="value">${totalOrders}</div></div>
          <div class="card"><div class="label">Avg Order Value</div><div class="value">INR ${Math.round(avgOrder).toLocaleString()}</div></div>
        </div>

        <h3>Monthly Trend</h3>
        <table>
          <thead><tr><th>Month</th><th>Revenue</th><th>Orders</th></tr></thead>
          <tbody>${monthlyRows || "<tr><td colspan='3'>No data</td></tr>"}</tbody>
        </table>

        <h3>Top Buyers</h3>
        <table>
          <thead><tr><th>Buyer</th><th>Orders</th><th>Revenue</th></tr></thead>
          <tbody>${buyerRows || "<tr><td colspan='3'>No data</td></tr>"}</tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=1000,height=800");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold font-display">Reports</h1><p className="text-muted-foreground">Business analytics and export options</p></div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={exportCsv}><Download className="w-4 h-4" /> Export CSV</Button>
          <Button variant="outline" className="gap-2" onClick={exportPdf}><FileText className="w-4 h-4" /> Export PDF</Button>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${hideTotalRevenue ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        {!hideTotalRevenue && (
          <div className="stat-card"><IndianRupee className="w-8 h-8 text-accent mb-2" /><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold font-display">₹{(totalRevenue / 100000).toFixed(2)}L</p></div>
        )}
        <div className="stat-card"><TrendingUp className="w-8 h-8 text-success mb-2" /><p className="text-xs text-muted-foreground">Orders</p><p className="text-2xl font-bold font-display">{totalOrders}</p></div>
        <div className="stat-card"><Package className="w-8 h-8 text-info mb-2" /><p className="text-xs text-muted-foreground">Avg Order Value</p><p className="text-2xl font-bold font-display">₹{avgOrder.toFixed(0)}</p></div>
      </div>

      <div className="stat-card">
        <h3 className="font-semibold font-display mb-4">Revenue & Orders Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
            <XAxis dataKey="month" stroke="hsl(215, 15%, 50%)" />
            <YAxis yAxisId="left" stroke="hsl(215, 15%, 50%)" tickFormatter={(v) => `₹${v / 1000}k`} />
            <YAxis yAxisId="right" orientation="right" stroke="hsl(215, 15%, 50%)" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="hsl(215, 55%, 22%)" radius={[6, 6, 0, 0]} name="Revenue (₹)" />
            <Bar yAxisId="right" dataKey="orders" fill="hsl(40, 80%, 52%)" radius={[6, 6, 0, 0]} name="Orders" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="stat-card">
        <h3 className="font-semibold font-display mb-4">Top Buyers</h3>
        <div className="space-y-3">
          {topBuyers.map((buyer, i) => (
            <div key={buyer.name} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">{i + 1}</span>
              <div className="flex-1"><p className="text-sm font-medium">{buyer.name}</p><p className="text-xs text-muted-foreground">{buyer.orders} orders</p></div>
              <p className="text-sm font-bold">₹{(buyer.revenue / 100000).toFixed(2)}L</p>
            </div>
          ))}
          {!isLoading && topBuyers.length === 0 && <p className="text-sm text-muted-foreground">No report data found.</p>}
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading reports...</p>}
    </div>
  );
};

export default AdminReports;
