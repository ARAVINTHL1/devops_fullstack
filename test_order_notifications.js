#!/usr/bin/env node
import mongoose from "mongoose";
import { config } from "./server/src/config.js";

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const testOrderAndNotifications = async () => {
  await connectDB();

  console.log("\n🧪 TEST: Place Order & Check Notifications");
  console.log("==========================================\n");

  // Get a buyer and product
  const User = mongoose.model("User", new mongoose.Schema({ name: String, email: String, role: String }, { timestamps: true }));
  const Product = mongoose.model("Product", new mongoose.Schema({ name: String, stock: Number, wholesalePrice: Number }, { timestamps: true }));
  const Order = mongoose.model("Order", new mongoose.Schema({ 
    orderId: String, 
    buyerEmail: String, 
    buyerName: String,
    items: Array,
    total: Number,
    date: Date 
  }, { timestamps: true }));
  const Notification = mongoose.model("Notification", new mongoose.Schema({
    userEmail: String,
    type: String,
    title: String,
    message: String,
    productName: String,
    currentStock: Number,
  }, { timestamps: true }));

  // Find a buyer
  const buyer = await User.findOne({ role: "buyer" }).lean();
  if (!buyer) {
    console.log("❌ No buyer found!");
    await mongoose.disconnect();
    return;
  }
  console.log(`👤 Buyer: ${buyer.name} (${buyer.email})`);

  // Find a product with high stock
  const product = await Product.findOne({ stock: { $gt: 1000 } }).lean();
  if (!product) {
    console.log("❌ No product with stock > 1000 found!");
    await mongoose.disconnect();
    return;
  }
  console.log(`📦 Product: ${product.name} (Stock: ${product.stock})`);

  // Simulate order creation (what buyer API does)
  console.log("\n📝 Creating order...");
  const orderId = `ORD-TEST-${Date.now()}`;
  const orderQuantity = 100;
  const totalPrice = product.wholesalePrice * orderQuantity;

  const order = await Order.create({
    orderId,
    buyerEmail: buyer.email,
    buyerName: buyer.name,
    items: [{ product: product.name, quantity: orderQuantity, price: product.wholesalePrice }],
    total: totalPrice,
    date: new Date(),
  });

  console.log(`✅ Order created: ${orderId}`);

  // Update product stock
  await Product.updateOne({ _id: product._id }, { $inc: { stock: -orderQuantity } });
  const updatedProduct = await Product.findById(product._id).lean();
  console.log(`📊 Product stock updated: ${product.stock} → ${updatedProduct.stock}`);

  // Get employees and admins
  const employeesAndAdmins = await User.find({ role: { $in: ["employee", "admin"] } }).select("email").lean();
  console.log(`\n👥 Creating notifications for ${employeesAndAdmins.length} employees/admins + 1 buyer`);

  // Create notifications
  const notificationsToCreate = [
    // For buyer
    {
      userEmail: buyer.email,
      type: "new_order",
      title: "✅ Order Placed Successfully",
      message: `Your order ${orderId} has been placed for ₹${totalPrice.toFixed(2)}`,
      productName: product.name,
      read: false,
    },
    // For employees/admins
    ...employeesAndAdmins.map(user => ({
      userEmail: user.email,
      type: "new_order",
      title: "📦 New Order Received",
      message: `Buyer ${buyer.name} placed order ${orderId} for ₹${totalPrice.toFixed(2)}`,
      productName: product.name,
      read: false,
    })),
  ];

  // Check for low stock
  if (updatedProduct.stock < 500) {
    console.log(`⚠️  LOW STOCK DETECTED: ${product.name} stock is now ${updatedProduct.stock}`);
    const lowStockNotifs = employeesAndAdmins.map(user => ({
      userEmail: user.email,
      type: "low_stock_alert",
      title: "⚠️ Low Stock Alert",
      message: `${product.name} stock is now ${updatedProduct.stock} units (below 500)`,
      productName: product.name,
      currentStock: updatedProduct.stock,
      read: false,
    }));
    notificationsToCreate.push(...lowStockNotifs);
  }

  // Insert notifications
  const inserted = await Notification.insertMany(notificationsToCreate);
  console.log(`✅ Created ${inserted.length} notifications\n`);

  // Check notifications for buyer
  console.log(`🔍 Checking notifications for BUYER (${buyer.email}):`);
  const buyerNotifs = await Notification.find({ userEmail: buyer.email }).sort({ createdAt: -1 }).limit(5).lean();
  buyerNotifs.forEach((n, i) => {
    console.log(`   ${i+1}. [${n.type}] ${n.title}`);
    console.log(`      Message: ${n.message}`);
  });

  // Check notifications for first admin
  if (employeesAndAdmins.length > 0) {
    const adminEmail = employeesAndAdmins[0].email;
    console.log(`\n🔍 Checking notifications for ADMIN (${adminEmail}):`);
    const adminNotifs = await Notification.find({ userEmail: adminEmail }).sort({ createdAt: -1 }).limit(5).lean();
    adminNotifs.forEach((n, i) => {
      console.log(`   ${i+1}. [${n.type}] ${n.title}`);
      console.log(`      Message: ${n.message}`);
    });
  }

  console.log("\n✅ Test completed!");
  await mongoose.disconnect();
};

testOrderAndNotifications().catch(console.error);
