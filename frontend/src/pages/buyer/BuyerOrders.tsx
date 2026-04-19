import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye, IndianRupee, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBuyerOrdersApi, reorderBuyerOrderApi } from "@/lib/buyer-api";
import { toast } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Order } from "@/lib/admin-api";

const BuyerOrders = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const statuses = ["all", "pending", "confirmed", "processing", "shipped", "delivered"];

  const { data, isLoading } = useQuery({
    queryKey: ["buyer-orders"],
    queryFn: () => getBuyerOrdersApi(token ?? ""),
    enabled: !!token,
  });

  const orders = data?.orders ?? [];

  const reorderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!token) throw new Error("Authentication required.");
      return reorderBuyerOrderApi(token, orderId);
    },
    onSuccess: () => {
      toast.success("Order placed again successfully.");
      void queryClient.invalidateQueries({ queryKey: ["buyer-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["buyer-dashboard"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to reorder.";
      toast.error(message);
    },
  });

  const filtered = orders.filter((o) => {
    const matchSearch = o.orderId.toLowerCase().includes(search.toLowerCase());
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
        <h1 className="text-3xl font-bold font-display">My Orders</h1>
        <p className="text-muted-foreground">Track and manage your orders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by order ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
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

      <div className="space-y-4">
        {filtered.map((order, i) => (
          <div key={order.id} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-mono font-medium">{order.orderId}</p>
                <p className="text-xs text-muted-foreground mt-1">{order.date} • {order.itemCount || order.items?.length || 0} items</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium capitalize border ${statusStyle[order.status]}`}>{order.status}</span>
                <p className="text-sm font-semibold flex items-center gap-1"><IndianRupee className="w-3 h-3" />{order.total.toLocaleString()}</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedOrder(order)}><Eye className="w-4 h-4" /></Button>
                  {order.status === "delivered" && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => reorderMutation.mutate(order.id)} disabled={reorderMutation.isPending}>
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && <p className="text-sm text-muted-foreground">Loading orders...</p>}
        {!isLoading && filtered.length === 0 && <p className="text-sm text-muted-foreground">No orders found.</p>}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Track your order information.</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-md bg-muted/50"><span className="text-muted-foreground">Order ID: </span><span className="font-medium">{selectedOrder.orderId}</span></div>
              <div className="p-3 rounded-md bg-muted/50"><span className="text-muted-foreground">Date: </span><span className="font-medium">{selectedOrder.date}</span></div>
              
              <div className="p-3 rounded-md bg-muted/50">
                <div className="text-muted-foreground mb-2">Order Items:</div>
                {selectedOrder.items && Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="pl-3 border-l-2 border-primary/30">
                        <div className="font-medium">{item.product}</div>
                        <div className="text-xs text-muted-foreground">Qty: {item.quantity} × ₹{item.price} = ₹{(item.quantity * item.price).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">No items found</span>
                )}
              </div>
              
              <div className="p-3 rounded-md bg-muted/50"><span className="text-muted-foreground">Payment: </span><span className="font-medium">{selectedOrder.paymentMethod}</span></div>
              <div className="p-3 rounded-md bg-muted/50"><span className="text-muted-foreground">Total: </span><span className="font-medium">₹{selectedOrder.total.toLocaleString()}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyerOrders;
