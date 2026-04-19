import express from "express";
import { requireRole } from "../middleware/auth.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";

const router = express.Router();

router.use(requireRole("buyer"));

const toDateString = (value) => {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
};

const buildOrderId = async () => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const count = await Order.countDocuments();
  return `ORD-${datePart}-${String(count + 1).padStart(4, "0")}`;
};

const getBuyerOrdersFilter = (authUser) => ({
  $or: [
    { buyerEmail: authUser.email },
    { buyerName: authUser.name },
  ],
});

router.get("/products", async (_req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  return res.json({ products });
});

router.get("/orders", async (req, res) => {
  const orders = await Order.find(getBuyerOrdersFilter(req.authUser)).sort({ date: -1 }).lean();

  return res.json({
    orders: orders.map((order) => ({
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
    })),
  });
});

router.post("/orders", async (req, res) => {
  const productId = String(req.body.productId ?? "").trim();
  const quantity = Number(req.body.quantity);
  const paymentMethod = String(req.body.paymentMethod ?? "").trim();

  if (!productId || Number.isNaN(quantity) || quantity <= 0 || !paymentMethod) {
    return res.status(400).json({ message: "Product, quantity, and payment method are required." });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  // Check if sufficient stock is available
  if (product.stock < quantity) {
    return res.status(400).json({ message: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}` });
  }

  const totalPrice = Number(product.wholesalePrice) * quantity;

  const order = await Order.create({
    orderId: await buildOrderId(),
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

  // Reduce stock
  product.stock -= quantity;
  await product.save();

  // Notify all employees and admins about the new order and check for low stock
  try {
    const employeesAndAdmins = await User.find({
      role: { $in: ["employee", "admin"] }
    }).select("_id email").lean();

    const notifications = employeesAndAdmins.map(user => ({
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
    }));

    // Also notify the buyer about their order
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

    // Check for low stock alert (< 500 units)
    if (product.stock < 500) {
      console.log(`🚨 LOW STOCK ALERT: ${product.name} stock is now ${product.stock} units (below threshold of 500)`);
      const lowStockNotifications = employeesAndAdmins.map(user => ({
        userId: user._id,
        userEmail: user.email,
        type: "low_stock_alert",
        title: `⚠️ Low Stock Alert: ${product.name}`,
        message: `Stock for ${product.name} has fallen to ${product.stock} units (Threshold: 500 units)`,
        productId: product._id.toString(),
        productName: product.name,
        currentStock: product.stock,
        read: false,
      }));
      notifications.push(...lowStockNotifications);
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`✅ Created ${notifications.length} notifications for order ${order.orderId}`);
    }
  } catch (notificationError) {
    console.error("Failed to create notifications:", notificationError);
    // Don't fail the order if notifications fail
  }

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

router.post("/orders/:id/reorder", async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, ...getBuyerOrdersFilter(req.authUser) });
  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }

  const newOrder = await Order.create({
    orderId: await buildOrderId(),
    buyerName: req.authUser.name,
    buyerEmail: req.authUser.email,
    date: new Date(),
    items: order.items,
    itemCount: order.itemCount || order.items?.length || 0,
    total: order.total,
    status: "pending",
    paymentMethod: order.paymentMethod,
    paymentStatus: "pending",
  });

  return res.status(201).json({
    order: {
      id: newOrder._id.toString(),
      orderId: newOrder.orderId,
      buyerName: newOrder.buyerName,
      date: toDateString(newOrder.date),
      items: newOrder.items || [],
      itemCount: newOrder.itemCount,
      total: newOrder.total,
      status: newOrder.status,
      paymentMethod: newOrder.paymentMethod,
      paymentStatus: newOrder.paymentStatus,
    },
  });
});

router.get("/reviews", async (_req, res) => {
  const reviews = await Review.find().sort({ date: -1 }).lean();
  return res.json({
    reviews: reviews.map((review) => ({
      id: review._id.toString(),
      buyer: review.buyer,
      product: review.product,
      rating: review.rating,
      comment: review.comment,
      helpful: review.helpful,
      status: review.status,
      date: toDateString(review.date),
    })),
  });
});

router.post("/reviews", async (req, res) => {
  const product = String(req.body.product ?? "").trim();
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment ?? "").trim();

  if (!product || Number.isNaN(rating) || rating < 1 || rating > 5 || !comment) {
    return res.status(400).json({ message: "Product, rating (1-5), and comment are required." });
  }

  const review = await Review.create({
    buyer: req.authUser.name,
    product,
    rating,
    comment,
    helpful: 0,
    status: "pending",
    date: new Date(),
  });

  return res.status(201).json({
    review: {
      id: review._id.toString(),
      buyer: review.buyer,
      product: review.product,
      rating: review.rating,
      comment: review.comment,
      helpful: review.helpful,
      status: review.status,
      date: toDateString(review.date),
    },
  });
});

router.post("/reviews/:id/helpful", async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { $inc: { helpful: 1 } }, { new: true }).lean();

  if (!review) {
    return res.status(404).json({ message: "Review not found." });
  }

  return res.json({
    review: {
      id: review._id.toString(),
      buyer: review.buyer,
      product: review.product,
      rating: review.rating,
      comment: review.comment,
      helpful: review.helpful,
      status: review.status,
      date: toDateString(review.date),
    },
  });
});

router.get("/dashboard", async (req, res) => {
  const [orders, products] = await Promise.all([
    Order.find(getBuyerOrdersFilter(req.authUser)).sort({ date: -1 }).lean(),
    Product.find().lean(),
  ]);

  const activeOrders = orders.filter((order) => order.status !== "delivered").length;
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const recentOrders = orders.slice(0, 5).map((order) => ({
    id: order._id.toString(),
    orderId: order.orderId,
    date: toDateString(order.date),
    total: order.total,
    status: order.status,
  }));

  return res.json({
    stats: {
      myOrders: orders.length,
      activeOrders,
      totalSpent,
      productsAvailable: products.length,
    },
    recentOrders,
  });
});

export default router;
