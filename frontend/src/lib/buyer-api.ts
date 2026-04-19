import { apiRequest } from "@/lib/api";
import type { Product, Order, Review } from "@/lib/admin-api";

export interface BuyerDashboardResponse {
  stats: {
    myOrders: number;
    activeOrders: number;
    totalSpent: number;
    productsAvailable: number;
  };
  recentOrders: Array<{
    id: string;
    orderId: string;
    date: string;
    total: number;
    status: "pending" | "confirmed" | "processing" | "shipped" | "delivered";
  }>;
}

export interface BuyerOrderPayload {
  productId: string;
  quantity: number;
  paymentMethod: string;
}

export interface BuyerReviewPayload {
  product: string;
  rating: number;
  comment: string;
}

export const getBuyerDashboardApi = (token: string) =>
  apiRequest<BuyerDashboardResponse>("/buyer/dashboard", { method: "GET", token });

export const getBuyerProductsApi = (token: string) =>
  apiRequest<{ products: Product[] }>("/buyer/products", { method: "GET", token });

export const getBuyerOrdersApi = (token: string) =>
  apiRequest<{ orders: Order[] }>("/buyer/orders", { method: "GET", token });

export const createBuyerOrderApi = (token: string, payload: BuyerOrderPayload) =>
  apiRequest<{ order: Order }>("/buyer/orders", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });

export const reorderBuyerOrderApi = (token: string, orderId: string) =>
  apiRequest<{ order: Order }>(`/buyer/orders/${orderId}/reorder`, {
    method: "POST",
    token,
  });

export const getBuyerReviewsApi = (token: string) =>
  apiRequest<{ reviews: Review[] }>("/buyer/reviews", { method: "GET", token });

export const createBuyerReviewApi = (token: string, payload: BuyerReviewPayload) =>
  apiRequest<{ review: Review }>("/buyer/reviews", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });

export const markBuyerReviewHelpfulApi = (token: string, reviewId: string) =>
  apiRequest<{ review: Review }>(`/buyer/reviews/${reviewId}/helpful`, {
    method: "POST",
    token,
  });
