interface Notification {
  _id: string;
  userId: string;
  userEmail: string;
  type: "new_order" | "order_confirmed" | "order_status_changed" | "low_stock_alert";
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  productId?: string;
  productName?: string;
  currentStock?: number;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
}

interface UnreadCountResponse {
  count: number;
}

const API_BASE_URL = "http://localhost:5000/api/notifications";
const TOKEN_STORAGE_KEY = "msh_auth_token";

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getNotificationsApi(): Promise<NotificationsResponse> {
  return apiRequest<NotificationsResponse>("/", {
    method: "GET",
  });
}

export async function getUnreadCountApi(): Promise<UnreadCountResponse> {
  return apiRequest<UnreadCountResponse>("/unread-count", {
    method: "GET",
  });
}

export async function markAsReadApi(notificationId: string): Promise<{ notification: Notification }> {
  return apiRequest<{ notification: Notification }>(`/${notificationId}/read`, {
    method: "PUT",
  });
}

export async function markAllReadApi(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/mark-all-read", {
    method: "PUT",
  });
}

export type { Notification, NotificationsResponse, UnreadCountResponse };
