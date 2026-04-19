import { apiRequest } from "@/lib/api";

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: "employee";
  status: "active" | "inactive";
  department: string;
  phone: string;
  createdAt: string;
  lastLogin: string | null;
}

export interface NewEmployeePayload {
  name: string;
  email: string;
  password: string;
  department: string;
  phone: string;
}

export interface Product {
  _id: string;
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

export interface NewProductPayload {
  sku: string;
  name: string;
  category: string;
  description?: string;
  costPrice: number;
  wholesalePrice: number;
  stock: number;
  rating?: number;
  batchNumber?: string;
  image?: string;
}

export interface Order {
  id: string;
  orderId: string;
  buyerName: string;
  date: string;
  items: Array<{
    product: string;
    quantity: number;
    price: number;
  }>;
  itemCount?: number;
  total: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered";
  paymentMethod: string;
  paymentStatus?: string;
}

export interface Supplier {
  _id: string;
  name: string;
  location: string;
  rating: number;
  defectRate: number;
  totalOrders: number;
  status: "active" | "inactive";
}

export interface NewSupplierPayload {
  name: string;
  location: string;
  rating: number;
  defectRate: number;
  totalOrders: number;
  status: "active" | "inactive";
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  totalAmount: number;
  expectedDelivery: string;
  notes: string;
  status: "placed" | "received" | "cancelled";
  createdAt: string;
}

export interface NewPurchaseOrderPayload {
  supplierId: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  expectedDelivery: string;
  notes?: string;
}

export interface QualityInspection {
  id: string;
  inspectionId: string;
  batch: string;
  product: string;
  defects: number;
  score: number;
  status: "passed" | "warning" | "flagged";
  date: string;
}

export interface Review {
  id: string;
  buyer: string;
  product: string;
  rating: number;
  comment: string;
  helpful: number;
  status: "approved" | "pending";
  date: string;
}

export interface DashboardResponse {
  stats: {
    totalRevenue: number;
    activeOrders: number;
    products: number;
    lowStock: number;
  };
  revenueData: Array<{ month: string; revenue: number; orders: number }>;
  categoryData: Array<{ name: string; value: number }>;
  demandForecast: Array<{ day: string; actual: number; predicted: number }>;
  recentOrders: Array<{ id: string; buyerName: string; date: string; total: number; status: string; orderId: string }>;
  lowStockProducts: Array<{ id: string; name: string; stock: number }>;
}

export interface MlInsightsResponse {
  models: Array<{ id: string; name: string; type?: string; accuracy: string; trained?: string; status?: string }>;
  demandForecast: Array<{ id?: string; day: string; actual: number | null; predicted: number }>;
  dynamicPricing: Array<{ id: string; product: string; current: number; suggested: number; reason: string }>;
  anomalies: Array<{ id: string; type: string; description: string; severity: "critical" | "high" | "medium" | "warning"; time?: string; timeLabel?: string }>;
  message?: string | null;
}

export interface ReportsResponse {
  monthlyData: Array<{ month: string; revenue: number; orders: number }>;
  topBuyers: Array<{ name: string; orders: number; revenue: number }>;
}

export const getEmployeesApi = (token: string) =>
  apiRequest<{ employees: Employee[] }>("/admin/employees", { method: "GET", token });

export const createEmployeeApi = (token: string, payload: NewEmployeePayload) =>
  apiRequest<{ employee: Employee }>("/admin/employees", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });

export const getProductsApi = (token: string) =>
  apiRequest<{ products: Product[] }>("/admin/products", { method: "GET", token });

export const createProductApi = (token: string, payload: NewProductPayload) =>
  apiRequest<{ product: Product }>("/admin/products", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });

export const getOrdersApi = (token: string) =>
  apiRequest<{ orders: Order[] }>("/admin/orders", { method: "GET", token });

export const updateOrderStatusApi = (token: string, orderId: string, status: string) =>
  apiRequest<{ order: Order }>(`/admin/orders/${orderId}/status`, {
    method: "PUT",
    token,
    body: JSON.stringify({ status }),
  });

export const getSuppliersApi = (token: string) =>
  apiRequest<{ suppliers: Supplier[] }>("/admin/suppliers", { method: "GET", token });

export const createSupplierApi = (token: string, payload: NewSupplierPayload) =>
  apiRequest<{ supplier: Supplier }>("/admin/suppliers", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });

export const getPurchaseOrdersApi = (token: string, supplierId?: string) =>
  apiRequest<{ purchaseOrders: PurchaseOrder[] }>(
    `/admin/purchase-orders${supplierId ? `?supplierId=${encodeURIComponent(supplierId)}` : ""}`,
    { method: "GET", token },
  );

export const createPurchaseOrderApi = (token: string, payload: NewPurchaseOrderPayload) =>
  apiRequest<{ purchaseOrder: PurchaseOrder }>("/admin/purchase-orders", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });

export const getQualityInspectionsApi = (token: string) =>
  apiRequest<{ inspections: QualityInspection[] }>("/admin/quality-inspections", { method: "GET", token });

export const getReviewsApi = (token: string) =>
  apiRequest<{ reviews: Review[] }>("/admin/reviews", { method: "GET", token });

export const getDashboardApi = (token: string) =>
  apiRequest<DashboardResponse>("/admin/dashboard", { method: "GET", token });

export const getMlInsightsApi = (token: string) =>
  apiRequest<MlInsightsResponse>("/admin/ml-insights", { method: "GET", token });

export const getReportsApi = (token: string) =>
  apiRequest<ReportsResponse>("/admin/reports", { method: "GET", token });
