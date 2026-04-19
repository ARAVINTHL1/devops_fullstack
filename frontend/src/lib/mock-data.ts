export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  costPrice: number;
  wholesalePrice: number;
  stock: number;
  image: string;
  rating: number;
  batchNumber: string;
}

export interface Order {
  id: string;
  buyerName: string;
  date: string;
  items: number;
  total: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered";
  paymentMethod: string;
}

export interface Supplier {
  id: string;
  name: string;
  location: string;
  rating: number;
  defectRate: number;
  totalOrders: number;
  status: "active" | "inactive";
}

export const MOCK_PRODUCTS: Product[] = [
  { id: "1", sku: "FAB-COT-001", name: "Premium Cotton Fabric", category: "Fabrics", description: "High-quality 100% cotton", costPrice: 180, wholesalePrice: 250, stock: 1500, image: "", rating: 4.5, batchNumber: "B2025-001" },
  { id: "2", sku: "FAB-SLK-002", name: "Kanchipuram Silk", category: "Fabrics", description: "Pure mulberry silk", costPrice: 850, wholesalePrice: 1200, stock: 320, image: "", rating: 4.8, batchNumber: "B2025-002" },
  { id: "3", sku: "FAB-PLY-003", name: "Polyester Blend", category: "Fabrics", description: "Durable polyester-cotton blend", costPrice: 95, wholesalePrice: 145, stock: 2800, image: "", rating: 4.2, batchNumber: "B2025-003" },
  { id: "4", sku: "THR-COT-001", name: "Cotton Thread Spool", category: "Threads", description: "200m cotton thread", costPrice: 25, wholesalePrice: 40, stock: 5000, image: "", rating: 4.6, batchNumber: "B2025-004" },
  { id: "5", sku: "DYE-IND-001", name: "Indigo Dye Powder", category: "Dyes", description: "Natural indigo dye 500g", costPrice: 320, wholesalePrice: 480, stock: 18, image: "", rating: 4.3, batchNumber: "B2025-005" },
  { id: "6", sku: "GAR-TSH-001", name: "Plain T-Shirt (Bulk)", category: "Garments", description: "Round neck cotton tee", costPrice: 120, wholesalePrice: 190, stock: 4200, image: "", rating: 4.4, batchNumber: "B2025-006" },
  { id: "7", sku: "ACC-BTN-001", name: "Pearl Buttons Set", category: "Accessories", description: "100pc pearl buttons", costPrice: 45, wholesalePrice: 75, stock: 8, image: "", rating: 4.1, batchNumber: "B2025-007" },
  { id: "8", sku: "FAB-LIN-001", name: "Linen Fabric Roll", category: "Fabrics", description: "Premium Belgian linen", costPrice: 420, wholesalePrice: 650, stock: 600, image: "", rating: 4.7, batchNumber: "B2025-008" },
];

export const MOCK_ORDERS: Order[] = [
  { id: "ORD-2025-001", buyerName: "Rajesh Textiles", date: "2025-02-15", items: 5, total: 125000, status: "delivered", paymentMethod: "UPI" },
  { id: "ORD-2025-002", buyerName: "Kumar Fabrics", date: "2025-02-14", items: 3, total: 78500, status: "shipped", paymentMethod: "Razorpay" },
  { id: "ORD-2025-003", buyerName: "Anand Garments", date: "2025-02-13", items: 8, total: 245000, status: "processing", paymentMethod: "Bank Transfer" },
  { id: "ORD-2025-004", buyerName: "Priya Silk House", date: "2025-02-12", items: 2, total: 96000, status: "confirmed", paymentMethod: "UPI" },
  { id: "ORD-2025-005", buyerName: "Meena Traders", date: "2025-02-11", items: 12, total: 380000, status: "pending", paymentMethod: "Razorpay" },
  { id: "ORD-2025-006", buyerName: "Sri Lakshmi Textiles", date: "2025-02-10", items: 6, total: 165000, status: "delivered", paymentMethod: "Bank Transfer" },
];

export const MOCK_SUPPLIERS: Supplier[] = [
  { id: "1", name: "Coimbatore Cotton Mills", location: "Coimbatore, TN", rating: 4.6, defectRate: 1.2, totalOrders: 245, status: "active" },
  { id: "2", name: "Erode Silk Weavers", location: "Erode, TN", rating: 4.8, defectRate: 0.8, totalOrders: 180, status: "active" },
  { id: "3", name: "Tirupur Thread Co.", location: "Tirupur, TN", rating: 4.3, defectRate: 2.1, totalOrders: 320, status: "active" },
  { id: "4", name: "Salem Dye Works", location: "Salem, TN", rating: 3.9, defectRate: 3.5, totalOrders: 95, status: "inactive" },
  { id: "5", name: "Karur Linen Factory", location: "Karur, TN", rating: 4.5, defectRate: 1.5, totalOrders: 150, status: "active" },
];

export const REVENUE_DATA = [
  { month: "Sep", revenue: 420000, orders: 45 },
  { month: "Oct", revenue: 580000, orders: 62 },
  { month: "Nov", revenue: 750000, orders: 78 },
  { month: "Dec", revenue: 890000, orders: 95 },
  { month: "Jan", revenue: 720000, orders: 80 },
  { month: "Feb", revenue: 650000, orders: 68 },
];

export const DEMAND_FORECAST = [
  { day: "Mon", actual: 120, predicted: 115 },
  { day: "Tue", actual: 145, predicted: 140 },
  { day: "Wed", actual: 130, predicted: 138 },
  { day: "Thu", actual: 160, predicted: 155 },
  { day: "Fri", actual: 180, predicted: 175 },
  { day: "Sat", actual: 200, predicted: 195 },
  { day: "Sun", actual: 90, predicted: 95 },
];

export const CATEGORY_DATA = [
  { name: "Fabrics", value: 45, color: "hsl(215, 55%, 22%)" },
  { name: "Garments", value: 25, color: "hsl(40, 80%, 52%)" },
  { name: "Threads", value: 15, color: "hsl(145, 60%, 40%)" },
  { name: "Dyes", value: 8, color: "hsl(200, 80%, 50%)" },
  { name: "Accessories", value: 7, color: "hsl(0, 72%, 50%)" },
];
