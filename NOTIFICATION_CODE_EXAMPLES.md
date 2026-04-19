# Notification System - Code Implementation Examples

## 📝 Complete Code Examples

### 1. Database Model

**File:** `server/src/models/Notification.js`

```javascript
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { 
      type: String, 
      required: true, 
      index: true  // Indexed for fast lookups
    },
    userEmail: { 
      type: String, 
      required: true  // Used for filtering
    },
    type: { 
      type: String, 
      enum: [
        "new_order",           // Sent when order placed
        "order_confirmed",     // Sent when admin confirms
        "order_status_changed", // Sent with any status change
        "low_stock_alert"      // Sent when stock < 500
      ],
      required: true 
    },
    title: { 
      type: String, 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    
    // Order context
    orderId: { 
      type: String  // MongoDB ObjectId as string
    },
    orderNumber: { 
      type: String  // Human-readable: "ORD-20260317-001"
    },
    
    // Product context
    productId: { 
      type: String 
    },
    productName: { 
      type: String 
    },
    currentStock: { 
      type: Number  // For low-stock alerts
    },
    
    // Read tracking
    read: { 
      type: Boolean, 
      default: false 
    },
    readAt: { 
      type: Date  // When marked as read
    },
  },
  { timestamps: true }  // Auto-adds createdAt & updatedAt
);

export const Notification = mongoose.model("Notification", notificationSchema);
```

---

### 2. Creating Notifications on Order Placement

**File:** `server/src/routes/buyer.js` (Lines 100-155)

```javascript
router.post("/orders", async (req, res) => {
  // 1. VALIDATE INPUT
  const productId = String(req.body.productId ?? "").trim();
  const quantity = Number(req.body.quantity);
  const paymentMethod = String(req.body.paymentMethod ?? "").trim();

  if (!productId || Number.isNaN(quantity) || quantity <= 0 || !paymentMethod) {
    return res.status(400).json({ 
      message: "Product, quantity, and payment method are required." 
    });
  }

  // 2. FIND PRODUCT
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  // 3. CHECK STOCK AVAILABILITY
  if (product.stock < quantity) {
    return res.status(400).json({ 
      message: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}` 
    });
  }

  // 4. CALCULATE PRICE
  const totalPrice = Number(product.wholesalePrice) * quantity;

  // 5. CREATE ORDER
  const order = await Order.create({
    orderId: await buildOrderId(),  // "ORD-20260317-001"
    buyerName: req.authUser.name,
    buyerEmail: req.authUser.email,
    date: new Date(),
    items: [
      {
        product: product.name,
        quantity: quantity,
        price: product.wholesalePrice,
      }
    ],
    itemCount: 1,
    total: totalPrice,
    status: "pending",
    paymentMethod,
    paymentStatus: "pending",
  });

  // 6. REDUCE STOCK
  product.stock -= quantity;
  await product.save();

  // 7. SEND NOTIFICATIONS
  try {
    // Get all employees and admins
    const employeesAndAdmins = await User.find({
      role: { $in: ["employee", "admin"] }
    }).select("_id email").lean();

    // Build notifications array
    const notifications = [];

    // 7a. NOTIFY EMPLOYEES/ADMINS ABOUT NEW ORDER
    employeesAndAdmins.forEach(user => {
      notifications.push({
        userId: user._id,
        userEmail: user.email,
        type: "new_order",
        title: "New Order Received",
        message: `Buyer ${req.authUser.name} placed a new order ${order.orderId} worth ₹${totalPrice.toFixed(2)}`,
        orderId: order._id,
        orderNumber: order.orderId,
        productId: product._id.toString(),
        productName: product.name,
        read: false,
      });
    });

    // 7b. NOTIFY BUYER ABOUT THEIR OWN ORDER
    notifications.push({
      userId: req.authUser._id,
      userEmail: req.authUser.email,
      type: "new_order",
      title: "Order Placed Successfully",
      message: `Your order ${order.orderId} has been placed for ₹${totalPrice.toFixed(2)}. Waiting for confirmation.`,
      orderId: order._id,
      orderNumber: order.orderId,
      productId: product._id.toString(),
      productName: product.name,
      read: false,
    });

    // 7c. CHECK FOR LOW STOCK ALERT (< 500 units)
    if (product.stock < 500) {
      console.log(`🚨 LOW STOCK ALERT: ${product.name} stock is now ${product.stock} units`);
      
      employeesAndAdmins.forEach(user => {
        notifications.push({
          userId: user._id,
          userEmail: user.email,
          type: "low_stock_alert",
          title: `⚠️ Low Stock Alert: ${product.name}`,
          message: `Stock for ${product.name} has fallen to ${product.stock} units (Threshold: 500 units)`,
          productId: product._id.toString(),
          productName: product.name,
          currentStock: product.stock,
          read: false,
        });
      });
    }

    // 7d. BATCH INSERT ALL NOTIFICATIONS
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`✅ Created ${notifications.length} notifications for order ${order.orderId}`);
    }

  } catch (notificationError) {
    console.error("Failed to create notifications:", notificationError);
    // Don't fail the order if notifications fail
  }

  // 8. RETURN RESPONSE
  return res.status(201).json({
    order: {
      id: order._id.toString(),
      orderId: order.orderId,
      buyerName: order.buyerName,
      date: toDateString(order.date),
      items: order.items,
      itemCount: order.itemCount,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    },
  });
});
```

---

### 3. Creating Notifications on Order Status Change

**File:** `server/src/routes/admin.js` (Lines 200-260)

```javascript
router.put("/orders/:orderId/status", async (req, res) => {
  // 1. VALIDATE STATUS
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: "Invalid status value. Must be: pending, confirmed, processing, shipped, or delivered" 
    });
  }

  // 2. UPDATE ORDER
  const order = await Order.findByIdAndUpdate(
    orderId,
    { status },
    { new: true, runValidators: true }
  ).lean();

  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }

  // 3. NOTIFY BUYER ON STATUS CHANGES
  // 3a. ORDER CONFIRMED
  if (status === "confirmed") {
    try {
      const buyer = await User.findOne({ email: order.buyerEmail })
        .select("_id email")
        .lean();
      
      if (buyer) {
        await Notification.create({
          userId: buyer._id,
          userEmail: buyer.email,
          type: "order_confirmed",
          title: "Order Confirmed",
          message: `Your order ${order.orderId} has been confirmed and is being processed. Total: ₹${order.total.toFixed(2)}`,
          orderId: order._id,
          orderNumber: order.orderId,
          read: false,
        });
      }
    } catch (notificationError) {
      console.error("Failed to create buyer notification:", notificationError);
      // Don't fail the status update if notification fails
    }
  }

  // 3b. OTHER STATUS CHANGES
  if (status !== "confirmed" && status !== "pending") {
    try {
      const buyer = await User.findOne({ email: order.buyerEmail })
        .select("_id email")
        .lean();
      
      if (buyer) {
        await Notification.create({
          userId: buyer._id,
          userEmail: buyer.email,
          type: "order_status_changed",
          title: "Order Status Updated",
          message: `Your order ${order.orderId} status has been updated to: ${status}`,
          orderId: order._id,
          orderNumber: order.orderId,
          read: false,
        });
      }
    } catch (notificationError) {
      console.error("Failed to create status change notification:", notificationError);
    }
  }

  // 4. RETURN UPDATED ORDER
  return res.json({
    order: {
      id: order._id.toString(),
      orderId: order.orderId,
      buyerName: order.buyerName,
      date: toDateString(order.date),
      items: order.items || [],
      itemCount: order.itemCount || order.items?.length || 0,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus || "pending",
    },
  });
});
```

---

### 4. Notification API Routes

**File:** `server/src/routes/notifications.js`

```javascript
import express from "express";
import { Notification } from "../models/Notification.js";

const router = express.Router();

// All routes are protected by authenticate middleware from index.js

/**
 * GET /api/notifications/
 * Get all notifications for the current user
 * 
 * Returns: Last 50 notifications sorted by newest first
 */
router.get("/", async (req, res) => {
  const notifications = await Notification.find({ 
    userEmail: req.authUser.email  // Current user's email
  })
    .sort({ createdAt: -1 })        // Newest first
    .limit(50)                        // Max 50 notifications
    .lean();                          // Performance optimization

  return res.json({
    notifications: notifications.map((n) => ({
      _id: n._id.toString(),
      userId: n.userId.toString(),
      userEmail: n.userEmail,
      type: n.type,
      title: n.title,
      message: n.message,
      ...(n.orderId && { orderId: n.orderId.toString() }),
      ...(n.orderNumber && { orderNumber: n.orderNumber }),
      ...(n.productId && { productId: n.productId }),
      ...(n.productName && { productName: n.productName }),
      ...(n.currentStock !== undefined && { currentStock: n.currentStock }),
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
      readAt: n.readAt ? n.readAt.toISOString() : null,
    })),
  });
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications for current user
 * 
 * Returns: { count: number }
 */
router.get("/unread-count", async (req, res) => {
  const count = await Notification.countDocuments({
    userEmail: req.authUser.email,  // Current user's email
    read: false,                     // Only unread
  });

  return res.json({ count });
});

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 * 
 * Returns: Updated notification with readAt timestamp
 */
router.put("/:id/read", async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { 
      _id: req.params.id, 
      userEmail: req.authUser.email  // Ensure user owns this notification
    },
    { 
      read: true, 
      readAt: new Date()
    },
    { new: true }  // Return updated document
  ).lean();

  if (!notification) {
    return res.status(404).json({ message: "Notification not found." });
  }

  return res.json({
    notification: {
      _id: notification._id.toString(),
      userId: notification.userId.toString(),
      userEmail: notification.userEmail,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      orderId: notification.orderId?.toString(),
      orderNumber: notification.orderNumber,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
      readAt: notification.readAt?.toISOString(),
    },
  });
});

/**
 * PUT /api/notifications/mark-all-read
 * Mark all unread notifications as read for current user
 * 
 * Returns: { message: "..." }
 */
router.put("/mark-all-read", async (req, res) => {
  await Notification.updateMany(
    { 
      userEmail: req.authUser.email,  // Current user's email
      read: false                      // Only unread notifications
    },
    { 
      read: true, 
      readAt: new Date()
    }
  );

  return res.json({ message: "All notifications marked as read." });
});

export default router;
```

---

### 5. Client API Service

**File:** `src/lib/notifications-api.ts`

```typescript
// Type definitions
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

// Configuration
const API_BASE_URL = "http://localhost:5000/api/notifications";
const TOKEN_STORAGE_KEY = "msh_auth_token";

/**
 * Helper function to make authenticated API requests
 */
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

/**
 * Get all notifications for current user
 */
export async function getNotificationsApi(): Promise<NotificationsResponse> {
  return apiRequest<NotificationsResponse>("/", {
    method: "GET",
  });
}

/**
 * Get count of unread notifications
 */
export async function getUnreadCountApi(): Promise<UnreadCountResponse> {
  return apiRequest<UnreadCountResponse>("/unread-count", {
    method: "GET",
  });
}

/**
 * Mark a single notification as read
 */
export async function markAsReadApi(notificationId: string): Promise<{ notification: Notification }> {
  return apiRequest<{ notification: Notification }>(`/${notificationId}/read`, {
    method: "PUT",
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllReadApi(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/mark-all-read", {
    method: "PUT",
  });
}

export type { Notification, NotificationsResponse, UnreadCountResponse };
```

---

### 6. Notification Bell Component (React)

**File:** `src/components/NotificationBell.tsx`

```typescript
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import {
  getNotificationsApi,
  getUnreadCountApi,
  markAsReadApi,
  markAllReadApi,
  type Notification,
} from "@/lib/notifications-api";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  /**
   * Query 1: Fetch notifications
   * - Polls every 5 seconds for real-time updates
   * - Caches results using TanStack Query
   */
  const { data: notificationsData, error: notificationsError } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotificationsApi,
    refetchInterval: 5000,  // ← Poll every 5 seconds
    enabled: true,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  /**
   * Query 2: Fetch unread count
   * - Polls every 5 seconds independently
   */
  const { data: unreadCountData, error: unreadCountError } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: getUnreadCountApi,
    refetchInterval: 5000,  // ← Poll every 5 seconds
    enabled: true,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Log errors for debugging
  if (notificationsError) {
    console.error("Notifications fetch error:", notificationsError);
  }
  if (unreadCountError) {
    console.error("Unread count fetch error:", unreadCountError);
  }

  /**
   * Mutation 1: Mark single notification as read
   * - Calls API
   * - Invalidates both queries to refresh data
   */
  const markAsReadMutation = useMutation({
    mutationFn: markAsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  /**
   * Mutation 2: Mark all as read
   * - Calls API
   * - Invalidates both queries to refresh data
   */
  const markAllReadMutation = useMutation({
    mutationFn: markAllReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  // Extract data or defaults
  const notifications = notificationsData?.notifications || [];
  const unreadCount = unreadCountData?.count || 0;

  // Debug logging
  useEffect(() => {
    console.log("🔔 Notifications loaded:", notifications.length);
    console.log("📊 Unread count:", unreadCount);
    if (notificationsError) {
      console.error("❌ Notifications error:", notificationsError);
    }
  }, [notifications, unreadCount, notificationsError]);

  // Event handlers
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification._id);
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  // Helper to get icon by type
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "new_order":
        return "📦";
      case "order_confirmed":
        return "✅";
      case "order_status_changed":
        return "🔄";
      case "low_stock_alert":
        return "⚠️";
      default:
        return "🔔";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0">
        <div className="border-b p-4 flex justify-between items-center">
          <h2 className="font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b cursor-pointer hover:bg-muted transition ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
```

---

### 7. Server Integration

**File:** `server/src/index.js`

```javascript
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { connectDatabase, ensureDefaultAdmin } from "./db.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import buyerRoutes from "./routes/buyer.js";
import notificationRoutes from "./routes/notifications.js";
import { authenticate } from "./middleware/auth.js";

const app = express();

// CORS Configuration
const allowedOrigins = new Set(
  String(config.frontendOrigin)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed for this origin"));
    },
  }),
);

// Middleware
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/", (_req, res) => {
  res.status(200).send("MS Garments Hub API is running. Open frontend at http://localhost:8080");
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", authenticate, adminRoutes);
app.use("/api/buyer", authenticate, buyerRoutes);
app.use("/api/notifications", authenticate, notificationRoutes);  // ← Notification routes

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

// Server startup
const isServerAlreadyRunning = async (port) => {
  try {
    const response = await fetch(`http://localhost:${port}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
};

const listen = (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
      resolve(server);
    });

    server.on("error", reject);
  });
};

const start = async () => {
  await connectDatabase();
  await ensureDefaultAdmin();

  try {
    await listen(config.port);
  } catch (error) {
    if (error?.code === "EADDRINUSE") {
      const alreadyRunning = await isServerAlreadyRunning(config.port);

      if (alreadyRunning) {
        console.log(`API already running on http://localhost:${config.port}`);
        return;
      }
    }

    throw error;
  }
};

start().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
```

---

## 🧪 Test Examples

### Testing Notification Creation

```javascript
// test_notifications.js
import mongoose from "mongoose";
import { config } from "./server/src/config.js";

const connectDB = async () => {
  await mongoose.connect(config.mongoUri);
  console.log("✅ Connected to MongoDB");
};

const testNotifications = async () => {
  await connectDB();

  const Notification = mongoose.model("Notification", new mongoose.Schema(
    {
      userId: String,
      userEmail: String,
      type: String,
      title: String,
      message: String,
      read: { type: Boolean, default: false },
      readAt: Date,
    },
    { timestamps: true }
  ));

  // Get recent notifications
  const notifications = await Notification.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  console.log(`Found ${notifications.length} notifications`);
  notifications.forEach((n, i) => {
    console.log(`${i + 1}. [${n.type}] ${n.title} → ${n.userEmail}`);
  });

  // Statistics
  const counts = await Notification.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);

  console.log("\n📊 By Type:");
  counts.forEach(c => {
    console.log(`   ${c._id}: ${c.count}`);
  });

  await mongoose.disconnect();
};

testNotifications().catch(console.error);
```

### Testing API with cURL

```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@example.com","password":"password"}' | jq -r '.token')

echo "Token: $TOKEN"

# 2. Get notifications
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/notifications/ | jq

# 3. Get unread count
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/notifications/unread-count | jq

# 4. Mark notification as read
NOTIF_ID="507f1f77bcf86cd799439011"  # Replace with actual ID
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/notifications/$NOTIF_ID/read | jq

# 5. Mark all as read
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/notifications/mark-all-read | jq
```

