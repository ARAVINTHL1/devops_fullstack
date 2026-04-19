# Notification System Analysis - MS Garments Hub

## Executive Summary
This Node.js/Express project implements a **pull-based notification system** using MongoDB for persistence. Notifications are created whenever orders are placed or orders change status, with automatic low-stock alerts triggered at a 500-unit threshold. The system uses HTTP polling (5-second intervals) for real-time delivery with no WebSocket implementation.

---

## 1. Notification Data Model (Schema & Fields)

**Location:** [server/src/models/Notification.js](server/src/models/Notification.js)

```javascript
{
  userId: { type: String, required: true, index: true }           // Recipient user ID
  userEmail: { type: String, required: true }                     // Recipient email
  type: { enum: ["new_order", "order_confirmed", "order_status_changed", "low_stock_alert"] }
  title: { type: String, required: true }                         // Display title
  message: { type: String, required: true }                       // Detailed message
  
  // Order-related fields (optional)
  orderId: { type: String }                                       // MongoDB Order ID
  orderNumber: { type: String }                                   // Human-readable Order ID (e.g., "ORD-20260317-001")
  
  // Product-related fields (optional)
  productId: { type: String }                                     // Product reference
  productName: { type: String }                                   // Product name
  currentStock: { type: Number }                                  // Current stock level (for low-stock alerts)
  
  // Read status tracking
  read: { type: Boolean, default: false }                         // Read/unread status
  readAt: { type: Date }                                          // When marked as read
  
  // Timestamps
  createdAt: { type: Date, auto: true }                          // Creation timestamp
  updatedAt: { type: Date, auto: true }                          // Last update timestamp
}
```

**Key Features:**
- Indexed on `userId` for fast lookups
- Supports 4 notification types
- Tracks read status with timestamps
- Optional context fields (order/product details)

---

## 2. Notification Creation & Storage

### 2.1 Creation Points

Notifications are created in two main workflows:

#### **A. Order Placement (Buyer Route)**
**Location:** [server/src/routes/buyer.js](server/src/routes/buyer.js) - Lines 102-152

**Trigger:** `POST /api/buyer/orders`

**What Happens:**
1. Buyer places an order for a product
2. Product stock is reduced by order quantity
3. **Two types of notifications are created:**
   - **New Order Notification** - Sent to all employees & admins
   - **Buyer Confirmation** - Sent to the buyer
   - **Low Stock Alert** (conditional) - Sent to all employees & admins if stock < 500 units

```javascript
// Example: Order for 2,700 units of 3,000 stock
// → Remaining stock: 300 units
// → LOW STOCK ALERT triggered (below 500 threshold)
// → Notifications created: 
//    1. Admin: "New Order Received"
//    2. Employee: "New Order Received"  
//    3. Admin: "Low Stock Alert"
//    4. Employee: "Low Stock Alert"
//    5. Buyer: "Order Placed Successfully"
```

**Notification Recipients:**
```
Query: User.find({ role: { $in: ["employee", "admin"] } })
```

#### **B. Order Status Change (Admin Route)**
**Location:** [server/src/routes/admin.js](server/src/routes/admin.js) - Lines 226-248

**Trigger:** `PUT /api/admin/orders/:orderId/status`

**What Happens:**
1. Admin updates order status (e.g., "pending" → "confirmed")
2. If status = "confirmed": Buyer is notified with `order_confirmed` type
3. If status ≠ "confirmed" & ≠ "pending": Buyer is notified with `order_status_changed` type

**Valid Statuses:** `["pending", "confirmed", "processing", "shipped", "delivered"]`

### 2.2 Storage Mechanism

**Database:** MongoDB

**Collection:** `notifications`

**Persistence Method:**
- Single create: `Notification.create({})`
- Batch create: `Notification.insertMany([...])`

**Example Storage:**
```javascript
// After order placed
await Notification.insertMany([
  {
    userId: employee._id,
    userEmail: "emp1@company.com",
    type: "new_order",
    title: "New Order Received",
    message: "Buyer Jack placed order ORD-20260317-001 worth ₹405,000",
    orderId: orderId,
    orderNumber: "ORD-20260317-001",
    productName: "COTTON LEGGINGS",
    read: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // ... more notifications
]);
```

---

## 3. What Triggers Notifications (Events & Actions)

### Notification Trigger Matrix

| Event | Trigger | Recipients | Types Created |
|-------|---------|-----------|-----------------|
| **Order Placed** | Buyer places order with quantity | Employees, Admins, Buyer | `new_order`, `low_stock_alert` (if stock < 500) |
| **Order Confirmed** | Admin changes status to "confirmed" | Buyer | `order_confirmed` |
| **Order Status Change** | Admin changes status (not "pending"/"confirmed") | Buyer | `order_status_changed` |
| **Low Stock Alert** | Stock falls below 500 units after any order | Employees, Admins | `low_stock_alert` |

### Low Stock Alert Logic

```javascript
// In buyer.js - Line 132-148
if (product.stock < 500) {
  // Create low stock alert for all employees and admins
  const lowStockNotifications = employeesAndAdmins.map(user => ({
    type: "low_stock_alert",
    title: `⚠️ Low Stock Alert: ${product.name}`,
    message: `Stock for ${product.name} has fallen to ${product.stock} units (Threshold: 500 units)`,
    productName: product.name,
    currentStock: product.stock
  }));
}
```

---

## 4. Notification Retrieval & Delivery to Users

### 4.1 API Endpoints

**Location:** [server/src/routes/notifications.js](server/src/routes/notifications.js)

All endpoints are protected by `authenticate` middleware (JWT token required).

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| `GET` | `/api/notifications/` | Get all notifications for current user | `{ notifications: [...], count: N }` |
| `GET` | `/api/notifications/unread-count` | Get count of unread notifications | `{ count: N }` |
| `PUT` | `/api/notifications/:id/read` | Mark single notification as read | `{ notification: {...} }` with `readAt` timestamp |
| `PUT` | `/api/notifications/mark-all-read` | Mark all notifications as read | `{ message: "..." }` |

#### **GET /api/notifications/** (Retrieve Notifications)
```javascript
// Request
GET /api/notifications/

// Response
{
  notifications: [
    {
      _id: "507f1f77bcf86cd799439011",
      userId: "507f1f77bcf86cd799439012",
      userEmail: "buyer@example.com",
      type: "new_order",
      title: "Order Placed Successfully",
      message: "Your order ORD-20260317-001 has been placed for ₹405,000.00...",
      orderId: "507f1f77bcf86cd799439013",
      orderNumber: "ORD-20260317-001",
      productId: "507f1f77bcf86cd799439014",
      productName: "COTTON LEGGINGS",
      read: false,
      readAt: null,
      createdAt: "2026-03-17T10:30:00Z",
      updatedAt: "2026-03-17T10:30:00Z"
    }
  ]
}
```

**Details:**
- Returns **50 most recent notifications** (`.limit(50)`)
- Sorted by `createdAt` (newest first)
- Only notifications for authenticated user's email
- Uses `.lean()` for performance optimization

#### **GET /api/notifications/unread-count** (Badge Count)
```javascript
// Request
GET /api/notifications/unread-count

// Response
{ count: 3 }  // Number of unread notifications for current user
```

---

## 5. Subscription & Listener Mechanisms

### Current Architecture: **No Real Subscriptions**

The system uses **HTTP Polling** instead of subscriptions:

#### Client-Side Polling (React/TypeScript)
**Location:** [src/components/NotificationBell.tsx](src/components/NotificationBell.tsx)

```typescript
// TanStack Query with polling interval
const { data: notificationsData } = useQuery({
  queryKey: ["notifications"],
  queryFn: getNotificationsApi,
  refetchInterval: 5000,  // ← Poll every 5 seconds
  enabled: true,
  retry: 1,
  refetchOnWindowFocus: false,
});

const { data: unreadCountData } = useQuery({
  queryKey: ["notifications-unread-count"],
  queryFn: getUnreadCountApi,
  refetchInterval: 5000,  // ← Poll every 5 seconds
  enabled: true,
  retry: 1,
  refetchOnWindowFocus: false,
});
```

**Implications:**
- ✅ Notifications update every 5 seconds
- ✅ Simple to implement, no WebSocket complexity
- ❌ More API calls (inefficient at scale)
- ❌ Not true real-time (5-second latency)
- ❌ Battery drain on mobile clients

### Listener Models (Not Implemented)

**What's missing:**
- ❌ WebSocket connections
- ❌ Server-sent events (SSE)
- ❌ Socket.IO integration
- ❌ Message queues (Redis, RabbitMQ)
- ❌ Change streams (MongoDB native)

---

## 6. API Endpoints for Notifications

### Complete Endpoint Reference

#### Base URL
```
http://localhost:5000/api/notifications
```

#### Authentication
All endpoints require JWT token in header:
```
Authorization: Bearer <JWT_TOKEN>
```

### Endpoint Details

#### 1. **GET /api/notifications/** - Get Notifications for Current User

```bash
curl -X GET "http://localhost:5000/api/notifications/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "notifications": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "userEmail": "buyer@example.com",
      "type": "new_order",
      "title": "Order Placed Successfully",
      "message": "Your order ORD-20260317-001 has been placed for ₹405,000.00...",
      "orderId": "507f1f77bcf86cd799439013",
      "orderNumber": "ORD-20260317-001",
      "productId": "507f1f77bcf86cd799439014",
      "productName": "COTTON LEGGINGS",
      "currentStock": 300,
      "read": false,
      "readAt": null,
      "createdAt": "2026-03-17T10:30:00.000Z",
      "updatedAt": "2026-03-17T10:30:00.000Z"
    }
  ]
}
```

**Query Logic:**
```javascript
const notifications = await Notification.find({ 
  userEmail: req.authUser.email  // Current user's email
})
  .sort({ createdAt: -1 })       // Newest first
  .limit(50)                       // Max 50 notifications
  .lean();                         // Performance optimization
```

#### 2. **GET /api/notifications/unread-count** - Get Unread Count

```bash
curl -X GET "http://localhost:5000/api/notifications/unread-count" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{ "count": 3 }
```

**Query Logic:**
```javascript
const count = await Notification.countDocuments({
  userEmail: req.authUser.email,
  read: false
});
```

#### 3. **PUT /api/notifications/:id/read** - Mark Notification as Read

```bash
curl -X PUT "http://localhost:5000/api/notifications/507f1f77bcf86cd799439011/read" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "notification": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "userEmail": "buyer@example.com",
    "type": "new_order",
    "title": "Order Placed Successfully",
    "message": "Your order ORD-20260317-001...",
    "orderId": "507f1f77bcf86cd799439013",
    "orderNumber": "ORD-20260317-001",
    "read": true,
    "readAt": "2026-03-17T10:35:00.000Z",
    "createdAt": "2026-03-17T10:30:00.000Z",
    "updatedAt": "2026-03-17T10:35:00.000Z"
  }
}
```

**Update Logic:**
```javascript
const notification = await Notification.findOneAndUpdate(
  { 
    _id: req.params.id,
    userEmail: req.authUser.email  // Ensure user owns this notification
  },
  { 
    read: true,
    readAt: new Date()
  },
  { new: true }
);
```

**Error Response (404 Not Found):**
```json
{ "message": "Notification not found." }
```

#### 4. **PUT /api/notifications/mark-all-read** - Mark All as Read

```bash
curl -X PUT "http://localhost:5000/api/notifications/mark-all-read" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{ "message": "All notifications marked as read." }
```

**Update Logic:**
```javascript
await Notification.updateMany(
  { 
    userEmail: req.authUser.email,
    read: false  // Only unread notifications
  },
  { 
    read: true,
    readAt: new Date()
  }
);
```

---

## 7. Real-Time Notification Delivery

### Current Implementation: HTTP Polling

#### Client-Side Flow
```
1. React Component Mounts (NotificationBell)
   ↓
2. TanStack Query initiates polling
   ↓
3. Every 5 seconds: GET /api/notifications/
   ↓
4. Every 5 seconds: GET /api/notifications/unread-count
   ↓
5. Component updates with new data
   ↓
6. User sees bell badge update with unread count
   ↓
7. User clicks Popover to see notification list
```

#### Server-Side Flow (Per Request)
```
1. Client sends GET /api/notifications/
   ↓
2. Middleware authenticates JWT token
   ↓
3. Route handler queries MongoDB:
   SELECT * FROM notifications 
   WHERE userEmail = ? 
   ORDER BY createdAt DESC 
   LIMIT 50
   ↓
4. Response sent to client
   ↓
5. Client updates React state via TanStack Query cache
```

### No WebSocket Implementation

**Checked for WebSocket/Real-Time:**
- ❌ `socket.io` - Not in package.json
- ❌ `ws` (WebSocket library) - Not in package.json
- ❌ `socket.io-client` - Not in package.json
- ❌ Server-Sent Events (SSE) - Not implemented

### Latency & Performance

| Metric | Value |
|--------|-------|
| Polling Interval | 5 seconds |
| Max Latency | ~5 seconds |
| API Calls per User per Minute | 24 calls (12 for notifications + 12 for count) |
| For 100 Active Users per Minute | 2,400 API calls |
| For 1000 Active Users per Minute | 24,000 API calls |

### Alternative Real-Time Architectures

**Could be implemented:**

1. **WebSocket (Socket.IO)**
   ```javascript
   // Server
   io.on('connection', (socket) => {
     socket.on('join-user', (userId) => {
       socket.join(`user:${userId}`);
     });
     // Emit when notification created
     io.to(`user:${userId}`).emit('notification', notificationData);
   });
   ```

2. **Server-Sent Events (SSE)**
   ```javascript
   // Client
   const eventSource = new EventSource('/api/notifications/stream', {
     headers: { Authorization: `Bearer ${token}` }
   });
   eventSource.addEventListener('notification', (e) => {
     // Update UI
   });
   ```

3. **MongoDB Change Streams**
   ```javascript
   const changeStream = Notification.collection.watch([
     { $match: { 'fullDocument.userEmail': userEmail } }
   ]);
   changeStream.on('change', (change) => {
     io.to(userEmail).emit('notification', change.fullDocument);
   });
   ```

---

## 8. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (React)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NotificationBell Component                                      │
│  ├─ TanStack Query (queries auto-refetch every 5s)             │
│  ├─ Query: ["notifications"] → getNotificationsApi()           │
│  ├─ Query: ["notifications-unread-count"] → getUnreadCountApi()│
│  └─ Mutations: markAsReadApi, markAllReadApi                   │
│                                                                  │
└────────────────┬──────────────────────────────────────────────┘
                 │ HTTP Polling (5s interval)
                 │ GET /api/notifications/
                 │ GET /api/notifications/unread-count
                 │ PUT /api/notifications/:id/read
                 │ PUT /api/notifications/mark-all-read
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API LAYER (Express.js)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  server/src/routes/notifications.js                             │
│  ├─ GET  / ................. Get notifications for user        │
│  ├─ GET  /unread-count ...... Get unread count                 │
│  ├─ PUT  /:id/read .......... Mark as read                     │
│  └─ PUT  /mark-all-read .... Mark all as read                  │
│                                                                  │
│  All routes protected by authenticate middleware               │
│  All routes filtered by req.authUser.email                     │
│                                                                  │
└────────────────┬──────────────────────────────────────────────┘
                 │ MongoDB Queries
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER (MongoDB)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Collection: notifications                                      │
│  └─ Indexed on: userId                                         │
│                                                                  │
│  Data stored after:                                             │
│  ├─ Order placement: new_order, low_stock_alert               │
│  ├─ Order status change: order_confirmed, order_status_changed│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

TRIGGERS ◄─────┐
                │
┌───────────────┴─────────────────┬──────────────────┐
│                                 │                  │
▼                                 ▼                  ▼
Buyer places order         Admin confirms order   Product stock < 500
POST /api/buyer/orders     PUT /api/admin/orders/  Automatic trigger
├─ Create order            :id/status
├─ Reduce stock            └─ Create notification
├─ Create notifications        for buyer
└─ Check low stock
```

---

## 9. Complete Notification Flow Examples

### Example 1: Order Placed → Low Stock Alert

```
INITIAL STATE:
├─ Product: "COTTON LEGGINGS"
├─ Stock: 3,000 units
└─ Threshold: 500 units

BUYER PLACES ORDER:
├─ Quantity: 2,700 units
└─ POST /api/buyer/orders (jack@gmail.com)

BACKEND PROCESSING:
1. Find product (COTTON LEGGINGS)
2. Verify stock: 3,000 >= 2,700 ✓
3. Create Order document
4. Reduce stock: 3,000 - 2,700 = 300 units
5. Query employees & admins: ["emp1@co.com", "emp2@co.com", "admin@co.com"]
6. Build notifications array:
   ├─ Notification 1: emp1@co.com - type: "new_order"
   ├─ Notification 2: emp2@co.com - type: "new_order"
   ├─ Notification 3: admin@co.com - type: "new_order"
   ├─ Notification 4: emp1@co.com - type: "low_stock_alert" (300 < 500)
   ├─ Notification 5: emp2@co.com - type: "low_stock_alert"
   ├─ Notification 6: admin@co.com - type: "low_stock_alert"
   └─ Notification 7: jack@gmail.com - type: "new_order"
7. Batch insert all 7 notifications into MongoDB
8. Return order confirmation to buyer

NOTIFICATIONS IN DB:
├─ emp1@co.com (2 unread):
│  ├─ "New Order Received - Buyer Jack placed order ORD-20260317-001"
│  └─ "⚠️ Low Stock Alert: COTTON LEGGINGS - Stock fell to 300 units"
├─ emp2@co.com (2 unread):
│  ├─ "New Order Received - Buyer Jack placed order ORD-20260317-001"
│  └─ "⚠️ Low Stock Alert: COTTON LEGGINGS - Stock fell to 300 units"
├─ admin@co.com (2 unread):
│  ├─ "New Order Received - Buyer Jack placed order ORD-20260317-001"
│  └─ "⚠️ Low Stock Alert: COTTON LEGGINGS - Stock fell to 300 units"
└─ jack@gmail.com (1 unread):
   └─ "Order Placed Successfully - Your order ORD-20260317-001 worth ₹405,000"

CLIENT-SIDE (5-SECOND POLL):
1. GET /api/notifications/ (jack@gmail.com)
2. Response: [new_order notification]
3. GET /api/notifications/unread-count
4. Response: { count: 1 }
5. Bell icon shows badge "1"
6. User clicks bell → sees order confirmation
```

### Example 2: Admin Confirms Order

```
USER STATE:
├─ Admin logged in at admin@msgarments.com
└─ Order exists: ORD-20260317-001 (status: "pending", buyer: jack@gmail.com)

ADMIN CONFIRMS ORDER:
└─ PUT /api/admin/orders/[ORDER_ID]/status
   Body: { status: "confirmed" }

BACKEND PROCESSING:
1. Find order by ID
2. Validate status is in allowed list ✓
3. Update order: status = "confirmed"
4. Check: status === "confirmed" ✓
5. Find buyer user: User.findOne({ email: "jack@gmail.com" })
6. Create notification:
   {
     userId: buyer._id,
     userEmail: "jack@gmail.com",
     type: "order_confirmed",
     title: "Order Confirmed",
     message: "Your order ORD-20260317-001 has been confirmed and is being processed. Total: ₹405,000.00",
     orderId: order._id,
     orderNumber: "ORD-20260317-001",
     read: false
   }
7. Insert into MongoDB
8. Return updated order to admin

JACK'S NOTIFICATIONS:
├─ Before: [order placed notification] (read: false)
└─ After: [order placed notification, order confirmed notification] (both read: false)

JACK'S CLIENT (5-SECOND POLL):
1. GET /api/notifications/
2. Response includes:
   ├─ "Order Placed Successfully - Your order ORD-20260317-001..."
   └─ "Order Confirmed - Your order has been confirmed..."
3. GET /api/notifications/unread-count
4. Response: { count: 2 }
5. Bell shows badge "2"
6. Jack clicks notification → reads both
7. PUT /api/notifications/[NOTIF_ID]/read
8. Response: read = true, readAt = timestamp
```

---

## 10. Test Files & Debugging

### Test Files available:

| File | Purpose | Location |
|------|---------|----------|
| `test_notifications.js` | Check notifications in database | Root |
| `debug_notifications.js` | Debug system state (users, orders, notifications) | Root |
| `test_notifications_complete.js` | Comprehensive notification testing | Root |
| `create_test_notifications.cjs` | Create test notifications manually | Root |
| `test_low_stock_alert.js` | Test low stock alert trigger | Root |
| `test_order_notifications.js` | Test order-related notifications | Root |

### Running Tests (Example):

```bash
# Check notifications in database
node test_notifications.js

# Debug system state
node debug_notifications.js

# Run comprehensive test
node test_notifications_complete.js
```

---

## 11. Security & Access Control

### Authentication
- ✅ All notification routes require JWT token
- ✅ Token provided via `Authorization: Bearer <token>` header
- ✅ Middleware: `authenticate` in [server/src/middleware/auth.js](server/src/middleware/auth.js)

### Authorization
- ✅ Users can only see their own notifications (filtered by `userEmail`)
- ✅ Can only mark their own notifications as read
- ✅ Cannot access other users' notifications

### Data Validation
- ✅ User email must match authenticated user
- ✅ Notification ID must exist in database
- ✅ Status values validated against enum

---

## 12. Summary Table

| Aspect | Implementation |
|--------|-----------------|
| **Model Storage** | MongoDB - `notifications` collection |
| **Creation Trigger** | Order placement, Order status changes |
| **Notification Types** | 4 types: new_order, order_confirmed, order_status_changed, low_stock_alert |
| **Recipients** | Buyers, Employees, Admins (role-based) |
| **Delivery Method** | HTTP polling (5-second interval) |
| **Real-Time** | Not true real-time (~5 second latency) |
| **Websocket** | Not implemented |
| **API Endpoints** | 4 endpoints (GET notifications, GET unread count, PUT mark as read, PUT mark all read) |
| **Authentication** | JWT token required |
| **Authorization** | User can only see own notifications |
| **Low Stock Threshold** | 500 units |
| **Performance** | .lean() queries, indexed on userId |

---

## 13. Potential Improvements

### Performance
- [ ] Implement WebSocket for true real-time delivery
- [ ] Use Redis for notification caching
- [ ] Implement Server-Sent Events (SSE) instead of polling
- [ ] Add pagination for notification list

### Functionality
- [ ] Notification categories/filtering
- [ ] Delete/archive notifications
- [ ] Notification preferences per user
- [ ] Email notifications in addition to in-app
- [ ] Notification templates
- [ ] Bulk operations (delete all, archive all)

### Monitoring
- [ ] Add logging for notification creation
- [ ] Track delivery success/failure
- [ ] Monitor polling request frequency
- [ ] Alert on low-stock threshold changes

