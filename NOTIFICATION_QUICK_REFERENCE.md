# Notification System - Quick Reference Guide

## 🎯 System Overview

**Type:** Pull-based HTTP polling (5-second interval)  
**Database:** MongoDB (`notifications` collection)  
**Architecture:** REST API with TanStack Query for client-side caching

---

## 📊 Notification Types

```
┌─────────────────────────────────────────┐
│      NOTIFICATION TYPE MAPPING          │
├─────────────────────────────────────────┤
│ new_order ................... Order placed or created
│ order_confirmed ............ Order status → "confirmed"
│ order_status_changed ....... Order status changes
│ low_stock_alert ............ Product stock < 500 units
└─────────────────────────────────────────┘
```

---

## 🔄 Creation Flow

```
USER ACTION                DATABASE             RECIPIENTS
═══════════════════════════════════════════════════════════════════
1. Buyer places order
   POST /buyer/orders  ──→  Save Order       ──→  Employees ✓
                       ──→  Create Notif     ──→  Admins ✓
                       ──→  Reduce Stock     ──→  Buyer ✓
                       ──→  Check < 500?
                            YES? → Low Stock Alert to Employees & Admins

2. Admin confirms order
   PUT /admin/orders/:id/status
   (status="confirmed")     ──→  Update Order  ──→  Buyer ✓
                       ──→  Create Notif

3. Admin changes status 
   (not pending/confirmed)  ──→  Update Order  ──→  Buyer ✓
                       ──→  Create Notif
```

---

## 📍 Key Files Map

```
SERVER
├── Models
│   └── server/src/models/Notification.js
│       └── Schema: userId, userEmail, type, title, message, etc.
│
├── Routes
│   ├── server/src/routes/buyer.js (Line 102-152)
│   │   └── POST /orders → Create new_order + low_stock_alert
│   │
│   ├── server/src/routes/admin.js (Line 226-248)
│   │   └── PUT /orders/:id/status → Create order_confirmed/order_status_changed
│   │
│   └── server/src/routes/notifications.js
│       ├── GET / ...................... Fetch notifications
│       ├── GET /unread-count .......... Get unread count
│       ├── PUT /:id/read ............. Mark as read
│       └── PUT /mark-all-read ........ Mark all as read
│
└── Integration
    └── server/src/index.js → Mount all routes

CLIENT
├── API Client
│   └── src/lib/notifications-api.ts
│       ├── getNotificationsApi()
│       ├── getUnreadCountApi()
│       ├── markAsReadApi()
│       └── markAllReadApi()
│
└── UI Component
    └── src/components/NotificationBell.tsx
        └── TanStack Query + Polling (5s interval)
```

---

## 🔌 API Endpoints (All Protected by JWT)

### GET /api/notifications/
**Fetch user's notifications**
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/notifications/
```
Returns: `{ notifications: [...], limit: 50 }`

### GET /api/notifications/unread-count
**Get unread notification count**
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/notifications/unread-count
```
Returns: `{ count: 5 }`

### PUT /api/notifications/:id/read
**Mark single notification as read**
```bash
curl -X PUT -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/notifications/507f1f77bcf86cd799439011/read
```
Returns: `{ notification: {..., read: true, readAt: "2026-03-17T..."} }`

### PUT /api/notifications/mark-all-read
**Mark all notifications as read**
```bash
curl -X PUT -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/notifications/mark-all-read
```
Returns: `{ message: "All notifications marked as read." }`

---

## 💾 MongoDB Schema Breakdown

```javascript
{
  _id: ObjectId,                    // Auto-generated
  userId: String (indexed),         // Recipient user ID
  userEmail: String,                // Recipient email (filter key)
  type: String (enum),              // one of 4 types
  title: String,                    // Display title
  message: String,                  // Full message
  orderId: String,                  // Order reference (optional)
  orderNumber: String,              // Human-readable ID "ORD-20260317-001"
  productId: String,                // Product reference (optional)
  productName: String,              // Product name (optional)
  currentStock: Number,             // Stock level for alerts (optional)
  read: Boolean,                    // Read/unread flag
  readAt: Date,                     // When marked as read (optional)
  createdAt: Date,                  // Auto timestamp
  updatedAt: Date                   // Auto timestamp
}
```

---

## ⚡ Real-Time Delivery

### Current: HTTP Polling

```
┌─────────────┐
│   Browser   │
│             │
│  Polling    │─────────────────────┐
│  every 5s   │                     │
│             │                     │
└─────────────┘                     │
       ▲                           │
       │                           ▼
       │                    ┌──────────────┐
       │                    │  Express API │
       │                    │              │
       └────────────────────┤  MongoDB     │
       (Response + data)    │              │
                           └──────────────┘
```

**Latency:** ~5 seconds (on average)
**API Calls/minute/user:** 24 calls
**For 1000 users:** ~24,000 API calls/minute

### Future: WebSocket Alternative

```javascript
// Would emit notifications in real-time with < 100ms latency
io.to(`user:${userId}`).emit('notification', notification);
```

---

## 🚨 Low Stock Alert Logic

```javascript
if (product.stock < 500) {
  // Create alerts for all employees & admins
  const threshold = 500;
  const current = product.stock;
  
  // Example from order placing 2,700 units of 3,000:
  // 3,000 - 2,700 = 300 units remaining
  // 300 < 500 → Alert triggered
  
  // Each employee/admin gets:
  // type: "low_stock_alert"
  // title: "⚠️ Low Stock Alert: PRODUCT_NAME"
  // message: "Stock fallen to 300 units (Threshold: 500 units)"
}
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|-----------------|
| **Authentication** | JWT token required in `Authorization` header |
| **Authorization** | Users can only see notifications with matching `userEmail` |
| **Ownership** | Notifications filtered by `req.authUser.email` |
| **Read Access** | Only owner can mark as read |

---

## 📈 Statistics Queries

### Get counts by notification type
```javascript
await Notification.aggregate([
  { $group: { _id: "$type", count: { $sum: 1 } } }
]);
// Returns: [{_id: "new_order", count: 45}, {_id: "low_stock_alert", count: 12}, ...]
```

### Get unread count for user
```javascript
await Notification.countDocuments({
  userEmail: "buyer@example.com",
  read: false
});
// Returns: 5
```

### Get notifications sent in last 24 hours
```javascript
await Notification.find({
  createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
}).count();
```

---

## 🧪 Testing

### Run Tests
```bash
# View all notifications
node test_notifications.js

# Debug system state
node debug_notifications.js

# Comprehensive test
node test_notifications_complete.js

# Create test data
node create_test_notifications.cjs

# Test low stock alerts
node test_low_stock_alert.js

# Test order notifications
node test_order_notifications.js
```

### Manual Testing with curl

```bash
# 1. Login/Get Token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@example.com","password":"password"}' | jq -r '.token')

# 2. Get Notifications
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/notifications/

# 3. Get Unread Count
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/notifications/unread-count

# 4. Mark as Read
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/notifications/[NOTIF_ID]/read
```

---

## 🎭 Role-Based Notification Behavior

```
NOTIFICATION TYPE           SENT TO              TRIGGER
═════════════════════════════════════════════════════════════════
new_order                   Buyer ✓              Buyer places order
                           Employees ✓
                           Admins ✓

order_confirmed            Buyer ✓              Admin sets status="confirmed"

order_status_changed       Buyer ✓              Admin changes status
                                               (NOT pending/confirmed)

low_stock_alert            Employees ✓          Stock falls < 500 units
                           Admins ✓             (automatic with order)
                           (NOT Buyers)
```

---

## 📊 Example: Complete Notification Lifecycle

```
TIME    ACTION                          DATABASE                CLIENT
════════════════════════════════════════════════════════════════════════
T+0s    Buyer places order ────────────→ Order created ─────────→ 
        POST /buyer/orders               Notifications created
                                         (7 total)
                               
T+2s    ─────────────────────────────────────────────────────→ GET /notifications/
                                                               (Poll #1)
                                                               ← 1 notification
                               
T+4s    ────────────────────────────────────────────────────→ See bell badge "1"
                               
T+5s    User clicks bell ──────────────────────────────────→ GET /notifications/
                                                               (Poll #2)
                                                               ← Same 1 notif
                               
T+6s    User clicks notification ─────────────────────────→ PUT /notifications/:id/read
                               
T+7s    ──────────────────────────────────────────────────→ Notification marked read
                                                               ← {read: true}
                               
T+10s   ────────────────────────────────────────────────→ GET /unread-count
                                                               (Poll)
                                                               ← {count: 0}
                               
T+11s   ──────────────────────────────────────────────────→ Bell badge disappears
```

---

## ⚙️ Configuration

**File:** `server/src/config.js`

```javascript
{
  port: 5000,                              // API port
  mongoUri: "mongodb://127.0.0.1:27017/ms-garments-hub",
  jwtSecret: "change-me-in-env",
  adminEmail: "admin@msgarments.com",
  frontendOrigin: "http://localhost:8080"
}
```

**Client:** `src/lib/notifications-api.ts`

```typescript
const API_BASE_URL = "http://localhost:5000/api/notifications";
const POLL_INTERVAL = 5000; // ms
```

---

## ✅ Checklist: Notification Flow

- [x] User authenticates (JWT token)
- [x] Buyer places order
- [x] order.stock reduced
- [x] Notification records created in MongoDB
- [x] Admin/Employee see "new_order" notification
- [x] Buyer sees "order_placed" notification
- [x] Low stock alert created (if stock < 500)
- [x] Client polls every 5 seconds
- [x] Notifications appear in UI
- [x] User clicks to mark as read
- [x] Read status updated in DB
- [x] Unread count badge updated
- [x] Admin confirms order
- [x] "order_confirmed" notification sent to buyer
- [x] Buyer receives update on next poll

