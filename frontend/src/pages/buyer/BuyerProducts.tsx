import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package, Star, ShoppingCart, CheckCircle, Download, Share2, Calendar, CreditCard, Hash } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBuyerOrderApi, getBuyerProductsApi } from "@/lib/buyer-api";
import { toast } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CATEGORIES = ["All", "Fabrics", "Garments", "Threads", "Dyes", "Accessories"];

const BuyerProducts = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [orderReceipt, setOrderReceipt] = useState<any>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);

  const downloadReceipt = () => {
    if (!orderReceipt) return;

    const receiptHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Receipt - ${orderReceipt.orderId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 210mm; margin: 0 auto; background: white; }
    .receipt { background: white; padding: 30px; }
    .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #2563eb; font-size: 32px; margin-bottom: 5px; }
    .header p { color: #666; font-size: 14px; }
    .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 20px 0; font-weight: bold; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
    .info-item { padding: 15px; background: #f8fafc; border-radius: 8px; }
    .info-item label { display: block; font-size: 12px; color: #666; margin-bottom: 5px; text-transform: uppercase; }
    .info-item value { font-size: 16px; font-weight: bold; color: #1e293b; }
    .product-details { border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .product-details h3 { color: #1e293b; margin-bottom: 15px; font-size: 14px; text-transform: uppercase; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .detail-row:last-child { border-bottom: none; }
    .detail-row label { color: #666; }
    .detail-row value { font-weight: 600; }
    .total-section { background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .total-section .total { display: flex; justify-content: space-between; align-items: center; }
    .total-section .total label { font-size: 20px; font-weight: bold; color: #1e40af; }
    .total-section .total value { font-size: 32px; font-weight: bold; color: #2563eb; }
    .company-info { text-align: center; padding: 20px; background: #f1f5f9; border-radius: 8px; margin-top: 30px; }
    .company-info h4 { color: #1e293b; margin-bottom: 10px; font-size: 18px; }
    .company-info p { color: #64748b; font-size: 13px; line-height: 1.6; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
    .print-button { display: block; margin: 20px auto; padding: 12px 30px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
    .print-button:hover { background: #1d4ed8; }
    @media print { body { background: white; padding: 0; } .receipt { box-shadow: none; } .print-button { display: none; } }
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
  <div class="receipt">
    <div class="header">
      <h1>MS GARMENTS</h1>
      <p>Wholesale Ladies Leggings Supplier | Erode, Tamil Nadu</p>
      <div class="success-badge">✓ ORDER CONFIRMED</div>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <label># Order ID</label>
        <value>${orderReceipt.orderId}</value>
      </div>
      <div class="info-item">
        <label>📅 Date</label>
        <value>${orderReceipt.date}</value>
      </div>
      <div class="info-item">
        <label>👤 Buyer</label>
        <value>${orderReceipt.buyerName}</value>
      </div>
      <div class="info-item">
        <label>💳 Payment Method</label>
        <value>${orderReceipt.paymentMethod}</value>
      </div>
    </div>

    <div class="product-details">
      <h3>Order Items</h3>
      ${orderReceipt.items && Array.isArray(orderReceipt.items) && orderReceipt.items.length > 0 
        ? orderReceipt.items.map((item: any) => `
          <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
            <div class="detail-row">
              <label>Product Name</label>
              <value>${item.product}</value>
            </div>
            <div class="detail-row">
              <label>Unit Price</label>
              <value>₹${item.price}</value>
            </div>
            <div class="detail-row">
              <label>Quantity</label>
              <value>${item.quantity} units</value>
            </div>
            <div class="detail-row">
              <label>Subtotal</label>
              <value>₹${(item.price * item.quantity).toFixed(2)}</value>
            </div>
          </div>
        `).join('')
        : '<p style="text-align: center; color: #666;">No items found</p>'}
    </div>

    <div class="total-section">
      <div class="total">
        <label>Total Amount</label>
        <value>₹${orderReceipt.total.toLocaleString()}</value>
      </div>
    </div>

    <div class="company-info">
      <h4>MS Garments</h4>
      <p>📍 Erode, Tamil Nadu, India</p>
      <p>📧 Contact: admin@msgarments.com</p>
      <p>Leading B2B Wholesale Ladies Leggings Supplier</p>
    </div>

    <div class="footer">
      <p>Thank you for your order! For any queries, please contact us through the buyer portal.</p>
      <p>Order Status: ${orderReceipt.status.toUpperCase()} | Generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>
  <button id="printBtn" class="print-button">🖨️ Print / Save as PDF</button>
</body>
</html>`;

    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    if (newWindow) {
      newWindow.onload = () => {
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);
      };
      toast.success("Receipt opened! Click Print button to save as PDF.");
    } else {
      // Fallback: download as HTML
      const link = document.createElement('a');
      link.href = url;
      link.download = `MS-Garments-Receipt-${orderReceipt.orderId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Receipt downloaded! Open file and use Print to save as PDF.");
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["buyer-products"],
    queryFn: () => getBuyerProductsApi(token ?? ""),
    enabled: !!token,
  });

  const products = data?.products ?? [];

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Authentication required.");
      return createBuyerOrderApi(token, {
        productId: selectedProductId,
        quantity: Number(quantity),
        paymentMethod,
      });
    },
    onSuccess: (data) => {
      setOrderReceipt(data.order);
      setIsReceiptDialogOpen(true);
      setIsOrderDialogOpen(false);
      setQuantity("1");
      setPaymentMethod("UPI");
      void queryClient.invalidateQueries({ queryKey: ["buyer-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["buyer-orders"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to place order.";
      toast.error(message);
    },
  });

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "All" || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const categoryColor: Record<string, string> = {
    Fabrics: "bg-primary/10 text-primary", Garments: "bg-accent/10 text-accent-foreground",
    Threads: "bg-success/10 text-success", Dyes: "bg-info/10 text-info", Accessories: "bg-warning/10 text-warning",
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Browse Catalog</h1>
        <p className="text-muted-foreground">{filtered.length} products available</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {isLoading && <p className="text-sm text-muted-foreground">Loading products...</p>}
        {filtered.map((product, i) => (
          <div 
            key={product._id} 
            className="stat-card group overflow-hidden cursor-pointer hover:shadow-lg transition-all" 
            style={{ animationDelay: `${i * 50}ms` }}
            onClick={() => {
              setSelectedProduct(product);
              setIsDetailsDialogOpen(true);
            }}
          >
            <div className="h-40 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-secondary/80 transition-colors">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-contain rounded-lg bg-white" />
              ) : (
                <Package className="w-12 h-12 text-muted-foreground/40" />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColor[product.category] || ""}`}>{product.category}</span>
                <div className="flex items-center gap-1"><Star className="w-3 h-3 text-accent fill-accent" /><span className="text-xs font-medium">{product.rating}</span></div>
              </div>
              <h3 className="font-semibold font-display text-sm leading-tight">{product.name}</h3>
              <p className="text-xs text-muted-foreground">{product.sku}</p>
              <div className="flex items-end justify-between pt-2">
                <div><p className="text-xs text-muted-foreground">Wholesale</p><p className="text-lg font-bold font-display">₹{product.wholesalePrice}</p></div>
                <div className="text-right"><p className="text-xs text-muted-foreground">Stock</p><p className={`text-sm font-semibold ${product.stock < 20 ? "text-destructive" : "text-success"}`}>{product.stock.toLocaleString()}</p></div>
              </div>
              <Button
                size="sm"
                className="w-full mt-2 gap-2 bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProductId(product._id);
                  setIsOrderDialogOpen(true);
                }}
              >
                <ShoppingCart className="w-4 h-4" /> Place Order
              </Button>
            </div>
          </div>
        ))}
        {!isLoading && filtered.length === 0 && <p className="text-sm text-muted-foreground">No products found.</p>}
      </div>

      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Order</DialogTitle>
            <DialogDescription>Enter quantity and payment method to place your order.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buyer-qty">Quantity</Label>
              <Input id="buyer-qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyer-payment">Payment Method</Label>
              <select
                id="buyer-payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="UPI">UPI</option>
                <option value="Razorpay">Razorpay</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOrderDialogOpen(false)} disabled={createOrderMutation.isPending}>Cancel</Button>
              <Button type="button" onClick={() => createOrderMutation.mutate()} disabled={createOrderMutation.isPending}>{createOrderMutation.isPending ? "Placing..." : "Confirm Order"}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
                <DialogDescription>Complete product details and specifications</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {/* Product Image */}
                <div className="w-full h-64 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                  {selectedProduct.image ? (
                    <img 
                      src={selectedProduct.image} 
                      alt={selectedProduct.name} 
                      className="w-full h-full object-contain bg-white rounded-lg" 
                    />
                  ) : (
                    <Package className="w-24 h-24 text-muted-foreground/40" />
                  )}
                </div>

                {/* Product Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category & Rating */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Category</label>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${categoryColor[selectedProduct.category] || ""}`}>
                      {selectedProduct.category}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Rating</label>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-accent fill-accent" />
                      <span className="text-lg font-semibold">{selectedProduct.rating} / 5.0</span>
                    </div>
                  </div>

                  {/* SKU */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Product SKU</label>
                    <p className="font-mono text-sm bg-secondary px-3 py-2 rounded-md">{selectedProduct.sku}</p>
                  </div>

                  {/* Stock Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Available Stock</label>
                    <p className={`text-2xl font-bold ${selectedProduct.stock < 20 ? "text-destructive" : "text-success"}`}>
                      {selectedProduct.stock.toLocaleString()} units
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Wholesale Price</label>
                    <p className="text-3xl font-bold text-primary">₹{selectedProduct.wholesalePrice}</p>
                  </div>

                  {/* Minimum Order */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Minimum Order Quantity</label>
                    <p className="text-lg font-semibold">{selectedProduct.minOrder || 10} units</p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Product Description</label>
                  <p className="text-sm leading-relaxed bg-secondary/50 p-4 rounded-lg">
                    {selectedProduct.description || `High-quality ${selectedProduct.name} available for wholesale purchase. Perfect for retailers and bulk buyers. Premium quality guaranteed with competitive wholesale pricing.`}
                  </p>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center space-y-1">
                    <Package className="w-8 h-8 mx-auto text-primary" />
                    <p className="text-xs text-muted-foreground">Bulk Packaging</p>
                    <p className="text-sm font-semibold">Available</p>
                  </div>
                  <div className="text-center space-y-1">
                    <ShoppingCart className="w-8 h-8 mx-auto text-success" />
                    <p className="text-xs text-muted-foreground">Delivery Time</p>
                    <p className="text-sm font-semibold">3-5 Business Days</p>
                  </div>
                  <div className="text-center space-y-1">
                    <Star className="w-8 h-8 mx-auto text-accent" />
                    <p className="text-xs text-muted-foreground">Quality Assured</p>
                    <p className="text-sm font-semibold">Premium Grade</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 gap-2 bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={() => {
                      setSelectedProductId(selectedProduct._id);
                      setIsDetailsDialogOpen(false);
                      setIsOrderDialogOpen(true);
                    }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Place Order
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Receipt Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">Order Confirmed!</DialogTitle>
            <DialogDescription>
              Your order has been placed successfully. Here's your receipt.
            </DialogDescription>
          </DialogHeader>
          
          {orderReceipt && (
            <div className="space-y-4 mt-4">
              {/* Order Details */}
              <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Order ID
                  </span>
                  <span className="font-mono font-semibold">{orderReceipt.orderId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date
                  </span>
                  <span className="font-medium">{orderReceipt.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Method
                  </span>
                  <span className="font-medium">{orderReceipt.paymentMethod}</span>
                </div>
              </div>

              {/* Product Details */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Order Items</h4>
                {orderReceipt.items && Array.isArray(orderReceipt.items) && orderReceipt.items.length > 0 ? (
                  <div className="space-y-3">
                    {orderReceipt.items.map((item: any, idx: number) => (
                      <div key={idx} className="space-y-2 pb-3 border-b last:border-b-0 last:pb-0">
                        <div className="flex justify-between">
                          <span className="font-medium">{item.product}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Unit Price:</span>
                          <span>₹{item.price}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Quantity:</span>
                          <span>{item.quantity} units</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Subtotal:</span>
                          <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">No items found</p>
                )}
              </div>

              {/* Total Amount */}
              <div className="bg-primary/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">₹{orderReceipt.total.toLocaleString()}</span>
                </div>
              </div>

              {/* MS Garments Info */}
              <div className="bg-muted/50 rounded-lg p-3 text-center text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">MS Garments</p>
                <p>Erode, Tamil Nadu</p>
                <p>Wholesale Ladies Leggings Supplier</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                  onClick={downloadReceipt}
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const shareText = `Order Confirmed! 🎉\nOrder ID: ${orderReceipt?.orderId}\nProduct: ${orderReceipt?.productName}\nTotal: ₹${orderReceipt?.total.toLocaleString()}\n\nMS Garments - Erode, Tamil Nadu`;
                    if (navigator.share) {
                      navigator.share({ 
                        title: 'Order Receipt', 
                        text: shareText 
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(shareText);
                      toast.success("Receipt details copied to clipboard!");
                    }
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>

              <DialogFooter>
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setIsReceiptDialogOpen(false);
                    toast.success("Order placed successfully!");
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyerProducts;
