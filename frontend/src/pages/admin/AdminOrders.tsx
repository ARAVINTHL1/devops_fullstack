import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Eye, IndianRupee, CheckCircle, Package, Truck, Download } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrdersApi, updateOrderStatusApi } from "@/lib/admin-api";
import { toast } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminOrders = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const statuses = ["all", "pending", "confirmed", "processing", "shipped", "delivered"];

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => getOrdersApi(token ?? ""),
    enabled: !!token,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatusApi(token ?? "", orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated successfully!");
      setShowDetailsDialog(false);
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      const message = error?.message || "Failed to update order status";
      toast.error(message);
    },
  });

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setShowDetailsDialog(true);
  };

  const handleDownloadReceipt = (order: any) => {
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      toast.error("Cannot generate receipt: No items found in order");
      return;
    }

    const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Order Receipt - MS Garments</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 210mm; margin: 0 auto; padding: 20px; background: white; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { margin: 0; color: #333; }
    .header p { margin: 5px 0; color: #666; }
    .order-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .order-info div { flex: 1; }
    .products { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .products th, .products td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    .products th { background-color: #f8f9fa; font-weight: bold; }
    .totals { text-align: right; margin-top: 20px; }
    .totals div { margin: 10px 0; font-size: 16px; }
    .totals .grand-total { font-size: 20px; font-weight: bold; color: #333; padding-top: 10px; border-top: 2px solid #333; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
    .print-button { display: block; margin: 20px auto; padding: 12px 30px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
    .print-button:hover { background: #1d4ed8; }
    @media print { .print-button { display: none; } body { padding: 0; } }
  </style>
  <script>
    window.onload = function() {
      document.getElementById('printBtn').onclick = function() {
        window.print();
      };
    };
  </script>
</head>
<body>
  <button id="printBtn" class="print-button">🖨️ Print / Save as PDF</button>
  <div class="header">
    <h1>MS Garments</h1>
    <p>📍 Erode, Tamil Nadu</p>
    <p>📞 Contact: info@msgarments.com</p>
    <h2>Order Receipt</h2>
  </div>
  
  <div class="order-info">
    <div>
      <strong>Order ID:</strong> ${order.orderId}<br>
      <strong>Date:</strong> ${order.date}<br>
      <strong>Status:</strong> ${order.status.toUpperCase()}
    </div>
    <div>
      <strong>Buyer:</strong> ${order.buyerName}<br>
      <strong>Payment:</strong> ${(order.paymentStatus || order.paymentMethod).toUpperCase()}
    </div>
  </div>
  
  <table class="products">
    <thead>
      <tr>
        <th>Product</th>
        <th>Quantity</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map((item: any) => `
        <tr>
          <td>${item.product}</td>
          <td>${item.quantity}</td>
          <td>₹${item.price.toFixed(2)}</td>
          <td>₹${(item.quantity * item.price).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="grand-total">Grand Total: ₹${order.total.toFixed(2)}</div>
  </div>
  
  <div class="footer">
    <p>Thank you for shopping with MS Garments!</p>
    <p>For any queries, please contact us at info@msgarments.com</p>
  </div>
  <button id="printBtn" class="print-button">🖨️ Print / Save as PDF</button>
</body>
</html>`;

    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    if (newWindow) {
      newWindow.onload = () => {
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);
      };
      toast.success("Receipt opened! Click Print button to save as PDF.");
    } else {
      // Fallback: download as HTML
      const a = document.createElement('a');
      a.href = url;
      a.download = `MS-Garments-Receipt-${order.orderId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Receipt downloaded! Open file and use Print to save as PDF.");
    }
  };

  const orders = data?.orders ?? [];

  const filtered = orders.filter((o) => {
    const matchSearch = o.buyerName.toLowerCase().includes(search.toLowerCase()) || o.orderId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusStyle: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    confirmed: "bg-info/10 text-info border-info/20",
    processing: "bg-accent/10 text-accent-foreground border-accent/20",
    shipped: "bg-primary/10 text-primary border-primary/20",
    delivered: "bg-success/10 text-success border-success/20",
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Orders Management</h1>
        <p className="text-muted-foreground">{filtered.length} total orders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="stat-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Buyer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => (
                <tr key={order.id} className="border-b border-border hover:bg-muted/30 transition-colors animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="px-6 py-4 text-sm font-mono font-medium">{order.orderId}</td>
                  <td className="px-6 py-4 text-sm font-medium">{order.buyerName}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{order.date}</td>
                  <td className="px-6 py-4 text-sm">{order.itemCount || order.items?.length || 0}</td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />{order.total.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{order.paymentMethod}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium capitalize border ${statusStyle[order.status]}`}>{order.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-primary/10" 
                        onClick={() => handleViewOrder(order)}
                        title="View Order Details">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-primary/10" 
                        onClick={() => handleDownloadReceipt(order)}
                        title="Download Receipt">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-muted-foreground">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
          {isLoading && <div className="px-6 py-8 text-sm text-muted-foreground">Loading orders...</div>}
        </div>
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View and manage order information
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                  <p className="text-base font-mono font-semibold">{selectedOrder.orderId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="text-base">{selectedOrder.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Buyer</p>
                  <p className="text-base font-semibold">{selectedOrder.buyerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  <p className="text-base capitalize">{selectedOrder.paymentMethod}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Order Items</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold">Product</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold">Quantity</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold">Price</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items && Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-3 text-sm">{item.product}</td>
                            <td className="px-4 py-3 text-sm">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-right">₹{item.price.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-right">₹{(item.quantity * item.price).toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-sm text-center text-muted-foreground">No items found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Update Order Status</p>
                  <div className="flex gap-2">
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) => {
                        updateStatusMutation.mutate({
                          orderId: selectedOrder.id,
                          status: value,
                        });
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <span className="flex items-center gap-2">
                            <Package className="w-4 h-4" /> Pending
                          </span>
                        </SelectItem>
                        <SelectItem value="confirmed">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Confirmed
                          </span>
                        </SelectItem>
                        <SelectItem value="processing">
                          <span className="flex items-center gap-2">
                            <Package className="w-4 h-4" /> Processing
                          </span>
                        </SelectItem>
                        <SelectItem value="shipped">
                          <span className="flex items-center gap-2">
                            <Truck className="w-4 h-4" /> Shipped
                          </span>
                        </SelectItem>
                        <SelectItem value="delivered">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Delivered
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {selectedOrder.status === "pending" && (
                      <Button
                        onClick={() => {
                          updateStatusMutation.mutate({
                            orderId: selectedOrder.id,
                            status: "confirmed",
                          });
                        }}
                        disabled={updateStatusMutation.isPending}
                        className="gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {updateStatusMutation.isPending ? "Confirming..." : "Confirm Order"}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Grand Total</p>
                  <p className="text-2xl font-bold flex items-center justify-end gap-1">
                    <IndianRupee className="w-5 h-5" />
                    {selectedOrder.total.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button onClick={() => selectedOrder && handleDownloadReceipt(selectedOrder)} className="gap-2">
              <Download className="w-4 h-4" />
              Download Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
