import express from "express";
import { requireRole } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Supplier } from "../models/Supplier.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { QualityInspection } from "../models/QualityInspection.js";
import { Review } from "../models/Review.js";
import { Forecast } from "../models/Forecast.js";
import { MLModel, PricingSuggestion, Anomaly } from "../models/MLInsight.js";
import { Notification } from "../models/Notification.js";
import { hashPassword } from "../utils/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.use(requireRole("admin", "employee"));

const toDateString = (value) => {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
};

const loadDemandForecastFromMlFiles = () => {
  try {
    const mlModelsPath = path.join(__dirname, "../../../ml_models/models");
    const forecastPath = path.join(mlModelsPath, "forecast_results.json");

    if (!fs.existsSync(forecastPath)) {
      return [];
    }

    const forecastData = JSON.parse(fs.readFileSync(forecastPath, "utf8"));
    const dates = forecastData?.forecast?.dates ?? [];
    const predicted = forecastData?.forecast?.predicted_rounded ?? forecastData?.forecast?.predicted_sales ?? [];
    const historicalActual = forecastData?.historical?.actual_sales ?? [];

    // Show forecast against a rolling window from the current date.
    const pointCount = Math.max(dates.length, predicted.length);
    const today = new Date();

    return Array.from({ length: pointCount }, (_value, index) => {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() + index);

      return {
        day: dayDate.toISOString().slice(0, 10),
        predicted: Number(predicted[index] ?? 0),
        actual: historicalActual[index] !== undefined ? Number(historicalActual[index]) : null,
      };
    });
  } catch (error) {
    console.error("Error loading demand forecast from ML files:", error.message);
    return [];
  }
};

const buildPoNumber = async () => {
  const today = new Date();
  const yyyymmdd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const count = await PurchaseOrder.countDocuments();
  return `PO-${yyyymmdd}-${String(count + 1).padStart(4, "0")}`;
};

router.get("/employees", requireRole("admin"), async (_req, res) => {
  const employees = await User.find({ role: "employee" }).sort({ createdAt: -1 }).lean();
  return res.json({
    employees: employees.map((employee) => ({
      id: employee._id.toString(),
      name: employee.name,
      email: employee.email,
      role: employee.role,
      status: employee.status,
      department: employee.department ?? "",
      phone: employee.phone ?? "",
      createdAt: toDateString(employee.createdAt),
      lastLogin: toDateString(employee.lastLogin),
    })),
  });
});

router.post("/employees", requireRole("admin"), async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");
  const department = String(req.body.department ?? "").trim();
  const phone = String(req.body.phone ?? "").trim();

  if (!name || !email || !password || !department || !phone) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    return res.status(409).json({ message: "Email already exists." });
  }

  const employee = await User.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    role: "employee",
    status: "active",
    department,
    phone,
  });

  return res.status(201).json({
    employee: {
      id: employee._id.toString(),
      name: employee.name,
      email: employee.email,
      role: employee.role,
      status: employee.status,
      department: employee.department,
      phone: employee.phone,
      createdAt: toDateString(employee.createdAt),
      lastLogin: toDateString(employee.lastLogin),
    },
  });
});

router.get("/products", async (_req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  return res.json({ products });
});

router.get("/products/low-stock", async (_req, res) => {
  const lowStockProducts = await Product.find({ stock: { $lt: 500 } }).sort({ stock: 1 }).lean();
  return res.json({
    products: lowStockProducts.map(product => ({
      id: product._id.toString(),
      sku: product.sku,
      name: product.name,
      category: product.category,
      stock: product.stock,
      costPrice: product.costPrice,
      wholesalePrice: product.wholesalePrice,
      reorderThreshold: 500,
      status: product.stock === 0 ? "out_of_stock" : "low_stock",
    }))
  });
});

router.get("/alerts/low-stock", async (req, res) => {
  const alerts = await Notification.find({ 
    type: "low_stock_alert",
    userEmail: req.authUser.email,
  }).sort({ createdAt: -1 }).limit(100).lean();
  
  return res.json({
    alerts: alerts.map(alert => ({
      id: alert._id.toString(),
      productId: alert.productId,
      productName: alert.productName,
      currentStock: alert.currentStock,
      message: alert.message,
      read: alert.read,
      createdAt: alert.createdAt,
    }))
  });
});

router.post("/products", async (req, res) => {
  const product = await Product.create(req.body);
  return res.status(201).json({ product });
});

router.get("/orders", async (_req, res) => {
  const orders = await Order.find().sort({ date: -1 }).lean();
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
  const order = await Order.create(req.body);
  return res.status(201).json({ order });
});

router.put("/orders/:orderId/status", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value." });
  }

  const order = await Order.findByIdAndUpdate(
    orderId,
    { status },
    { new: true, runValidators: true }
  ).lean();

  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }

  // Notify buyer when order status changes to confirmed
  if (status === "confirmed") {
    try {
      const buyer = await User.findOne({ email: order.buyerEmail }).select("_id email").lean();
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

  // Notify buyer for any status change (optional - can be expanded)
  if (status !== "confirmed" && status !== "pending") {
    try {
      const buyer = await User.findOne({ email: order.buyerEmail }).select("_id email").lean();
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

router.get("/suppliers", async (_req, res) => {
  const suppliers = await Supplier.find().sort({ createdAt: -1 }).lean();
  return res.json({ suppliers });
});

router.post("/suppliers", async (req, res) => {
  const supplier = await Supplier.create(req.body);
  return res.status(201).json({ supplier });
});

router.get("/purchase-orders", async (req, res) => {
  const supplierId = String(req.query.supplierId ?? "").trim();
  const filter = supplierId ? { supplierId } : {};

  const purchaseOrders = await PurchaseOrder.find(filter).sort({ createdAt: -1 }).lean();
  return res.json({
    purchaseOrders: purchaseOrders.map((po) => ({
      id: po._id.toString(),
      poNumber: po.poNumber,
      supplierId: po.supplierId.toString(),
      supplierName: po.supplierName,
      itemName: po.itemName,
      quantity: po.quantity,
      unitCost: po.unitCost,
      totalAmount: po.totalAmount,
      expectedDelivery: toDateString(po.expectedDelivery),
      notes: po.notes,
      status: po.status,
      createdAt: toDateString(po.createdAt),
    })),
  });
});

router.post("/purchase-orders", async (req, res) => {
  const supplierId = String(req.body.supplierId ?? "").trim();
  const itemName = String(req.body.itemName ?? "").trim();
  const expectedDelivery = String(req.body.expectedDelivery ?? "").trim();
  const notes = String(req.body.notes ?? "").trim();
  const quantity = Number(req.body.quantity);
  const unitCost = Number(req.body.unitCost);

  if (!supplierId || !itemName || !expectedDelivery || Number.isNaN(quantity) || Number.isNaN(unitCost)) {
    return res.status(400).json({ message: "Supplier, item, quantity, unit cost and delivery date are required." });
  }

  if (quantity <= 0 || unitCost < 0) {
    return res.status(400).json({ message: "Quantity must be greater than 0 and unit cost cannot be negative." });
  }

  const supplier = await Supplier.findById(supplierId).lean();
  if (!supplier) {
    return res.status(404).json({ message: "Supplier not found." });
  }

  const poNumber = await buildPoNumber();
  const purchaseOrder = await PurchaseOrder.create({
    poNumber,
    supplierId,
    supplierName: supplier.name,
    itemName,
    quantity,
    unitCost,
    totalAmount: quantity * unitCost,
    expectedDelivery: new Date(expectedDelivery),
    notes,
    status: "placed",
  });

  return res.status(201).json({
    purchaseOrder: {
      id: purchaseOrder._id.toString(),
      poNumber: purchaseOrder.poNumber,
      supplierId: purchaseOrder.supplierId.toString(),
      supplierName: purchaseOrder.supplierName,
      itemName: purchaseOrder.itemName,
      quantity: purchaseOrder.quantity,
      unitCost: purchaseOrder.unitCost,
      totalAmount: purchaseOrder.totalAmount,
      expectedDelivery: toDateString(purchaseOrder.expectedDelivery),
      notes: purchaseOrder.notes,
      status: purchaseOrder.status,
      createdAt: toDateString(purchaseOrder.createdAt),
    },
  });
});

router.get("/quality-inspections", async (_req, res) => {
  const inspections = await QualityInspection.find().sort({ date: -1 }).lean();
  return res.json({
    inspections: inspections.map((inspection) => ({
      id: inspection._id.toString(),
      inspectionId: inspection.inspectionId,
      batch: inspection.batch,
      product: inspection.product,
      defects: inspection.defects,
      score: inspection.score,
      status: inspection.status,
      date: toDateString(inspection.date),
    })),
  });
});

router.post("/quality-inspections", async (req, res) => {
  const inspection = await QualityInspection.create(req.body);
  return res.status(201).json({ inspection });
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
  const review = await Review.create(req.body);
  return res.status(201).json({ review });
});

router.get("/ml-insights", async (_req, res) => {
  try {
    const mlModelsPath = path.join(__dirname, "../../../ml_models/models");
    console.log("=== ML Insights Debug ===");
    console.log("__dirname:", __dirname);
    console.log("mlModelsPath:", mlModelsPath);
    console.log("Path exists:", fs.existsSync(mlModelsPath));
    
    // Read ML model results from JSON files
    let demandForecast = [];
    let dynamicPricing = [];
    let anomalies = [];
    let modelInfo = null;

    // Load demand forecast
    const forecastPath = path.join(mlModelsPath, "forecast_results.json");
    console.log("Forecast path:", forecastPath, "exists:", fs.existsSync(forecastPath));
    demandForecast = loadDemandForecastFromMlFiles();
    if (fs.existsSync(forecastPath)) {
      const forecastData = JSON.parse(fs.readFileSync(forecastPath, "utf8"));
      modelInfo = forecastData.model_info;
      console.log("Loaded demand forecast:", demandForecast.length, "records");
    }

    // Load pricing suggestions
    const pricingPath = path.join(mlModelsPath, "pricing_suggestions.json");
    if (fs.existsSync(pricingPath)) {
      const pricingData = JSON.parse(fs.readFileSync(pricingPath, "utf8"));
      dynamicPricing = pricingData.suggestions.map((item, idx) => ({
        id: String(idx),
        product: item.fabric,
        current: item.current_price,
        suggested: item.suggested_price,
        reason: `${item.price_change_percent > 0 ? 'Increase' : item.price_change_percent < 0 ? 'Decrease' : 'Maintain'} price by ${Math.abs(item.price_change_percent).toFixed(1)}% based on ${item.season} season demand (${item.confidence} confidence)`
      }));
    }

    // Load anomaly alerts
    const anomalyPath = path.join(mlModelsPath, "anomaly_alerts.json");
    if (fs.existsSync(anomalyPath)) {
      const anomalyData = JSON.parse(fs.readFileSync(anomalyPath, "utf8"));
      anomalies = anomalyData.alerts.map((alert, idx) => ({
        id: String(idx),
        type: alert.type === 'sales_spike' ? 'Spike' : 'Drop',
        description: String(alert.message ?? "")
          .replace(/\bWool\b/gi, "")
          .replace(/\s{2,}/g, " ")
          .trim(),
        severity: alert.severity,
        timeLabel: (() => {
          const now = new Date();
          now.setDate(now.getDate() - idx);
          return now.toISOString().slice(0, 10);
        })()
      }));
    }

    const response = {
      models: modelInfo ? [{
        id: "1",
        name: "LSTM Demand Forecasting",
        type: modelInfo.model_type,
        accuracy: `MAE: ${modelInfo.test_mae.toFixed(2)} units`,
        trained: modelInfo.trained_on
      }] : [],
      demandForecast,
      dynamicPricing,
      anomalies,
      message: anomalies.length === 0 ? "No anomaly alerts." : null
    };
    
    console.log("Response:", JSON.stringify({
      modelsCount: response.models.length,
      forecastCount: response.demandForecast.length,
      pricingCount: response.dynamicPricing.length,
      anomaliesCount: response.anomalies.length
    }));
    
    return res.json(response);
  } catch (error) {
    console.error("Error loading ML insights:", error);
    
    // Fallback to database if ML files don't exist
    const [models, demandForecast, dynamicPricing, anomalies] = await Promise.all([
      MLModel.find().sort({ createdAt: -1 }).lean(),
      Forecast.find().sort({ createdAt: 1 }).lean(),
      PricingSuggestion.find().sort({ createdAt: -1 }).lean(),
      Anomaly.find().sort({ createdAt: -1 }).lean(),
    ]);

    return res.json({
      models: models.map((model) => ({ ...model, id: model._id.toString() })),
      demandForecast: demandForecast.map((point) => ({ id: point._id.toString(), day: point.day, actual: point.actual, predicted: point.predicted })),
      dynamicPricing: dynamicPricing.map((item) => ({ id: item._id.toString(), product: item.product, current: item.current, suggested: item.suggested, reason: item.reason })),
      anomalies: anomalies.map((item, idx) => ({
        id: item._id.toString(),
        type: item.type,
        description: item.description,
        severity: item.severity,
        time: (() => {
          const now = new Date();
          now.setDate(now.getDate() - idx);
          return now.toISOString().slice(0, 10);
        })(),
      })),
    });
  }
});

router.get("/reports", async (_req, res) => {
  const [orders, topBuyersRaw] = await Promise.all([
    Order.find().sort({ date: 1 }).lean(),
    Order.aggregate([
      { $group: { _id: "$buyerName", orders: { $sum: 1 }, revenue: { $sum: "$total" } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const monthlyMap = new Map();

  for (const order of orders) {
    const date = new Date(order.date);
    const month = date.toLocaleString("en-US", { month: "short" });

    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { month, revenue: 0, orders: 0 });
    }

    const row = monthlyMap.get(month);
    row.revenue += order.total;
    row.orders += 1;
  }

  const monthlyData = Array.from(monthlyMap.values());

  return res.json({
    monthlyData,
    topBuyers: topBuyersRaw.map((buyer) => ({
      name: buyer._id,
      orders: buyer.orders,
      revenue: buyer.revenue,
    })),
  });
});

router.get("/dashboard", async (_req, res) => {
  const [products, orders, demandForecastDb] = await Promise.all([
    Product.find().lean(),
    Order.find().sort({ date: -1 }).lean(),
    Forecast.find().sort({ createdAt: 1 }).lean(),
  ]);

  const demandForecastFromFiles = loadDemandForecastFromMlFiles();
  const demandForecast = demandForecastFromFiles.length > 0
    ? demandForecastFromFiles
    : demandForecastDb.map((row) => ({ day: row.day, actual: row.actual, predicted: row.predicted }));

  const lowStockProducts = products.filter((product) => product.stock < 500);
  const recentOrders = orders.slice(0, 5).map((order) => ({
    id: order._id.toString(),
    buyerName: order.buyerName,
    date: toDateString(order.date),
    total: order.total,
    status: order.status,
    orderId: order.orderId,
  }));

  const categoryTotals = new Map();
  for (const product of products) {
    categoryTotals.set(product.category, (categoryTotals.get(product.category) ?? 0) + Number(product.stock ?? 0));
  }

  const categorySum = Array.from(categoryTotals.values()).reduce((sum, value) => sum + value, 0);
  const categoryData = Array.from(categoryTotals.entries()).map(([name, value]) => ({
    name,
    value: categorySum ? Math.round((value / categorySum) * 100) : 0,
  }));

  const monthlyRevenueMap = new Map();
  for (const order of orders) {
    const month = new Date(order.date).toLocaleString("en-US", { month: "short" });
    const row = monthlyRevenueMap.get(month) ?? { month, revenue: 0, orders: 0 };
    row.revenue += Number(order.total ?? 0);
    row.orders += 1;
    monthlyRevenueMap.set(month, row);
  }

  const revenueData = Array.from(monthlyRevenueMap.values());
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);

  return res.json({
    stats: {
      totalRevenue,
      activeOrders: orders.filter((order) => order.status !== "delivered").length,
      products: products.length,
      lowStock: lowStockProducts.length,
    },
    revenueData,
    categoryData,
    demandForecast,
    recentOrders,
    lowStockProducts: lowStockProducts.map((product) => ({ id: product._id.toString(), name: product.name, stock: product.stock })),
  });
});

export default router;
