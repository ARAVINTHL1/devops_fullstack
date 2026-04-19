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

const debugNotifications = async () => {
  await connectDB();

  console.log("\n🔍 NOTIFICATION SYSTEM DEBUG");
  console.log("========================================\n");

  // Check Users
  const User = mongoose.model("User", new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
  }));

  const users = await User.find({}).lean();
  console.log(`📋 Users in Database: ${users.length}`);
  if (users.length > 0) {
    users.forEach(u => {
      console.log(`   - ${u.name} (${u.email}) - Role: ${u.role}`);
    });
  }

  const employees = await User.find({ role: { $in: ["employee", "admin"] } }).lean();
  console.log(`\n👥 Employees/Admins: ${employees.length}`);
  if (employees.length === 0) {
    console.log("   ⚠️  NO EMPLOYEES/ADMINS! Notifications will go nowhere.");
  } else {
    employees.forEach(e => {
      console.log(`   - ${e.email}`);
    });
  }

  // Check Orders
  const Order = mongoose.model("Order", new mongoose.Schema({
    orderId: String,
    buyerName: String,
    buyerEmail: String,
    date: Date,
    items: Array,
    total: Number,
  }, { timestamps: true }));

  const orders = await Order.find({}).sort({ date: -1 }).lean();
  console.log(`\n📦 Orders in Database: ${orders.length}`);
  if (orders.length > 0) {
    orders.slice(0, 5).forEach(o => {
      console.log(`   - ${o.orderId} (${o.buyerEmail})`);
    });
  }

  // Check Notifications
  const Notification = mongoose.model("Notification", new mongoose.Schema({
    userId: String,
    userEmail: String,
    type: String,
    title: String,
    message: String,
    orderId: String,
    orderNumber: String,
    productId: String,
    productName: String,
    currentStock: Number,
    read: Boolean,
  }, { timestamps: true }));

  const notifications = await Notification.find({}).sort({ createdAt: -1 }).lean();
  console.log(`\n🔔 Notifications in Database: ${notifications.length}`);
  if (notifications.length === 0) {
    console.log("   ❌ NO NOTIFICATIONS! Notifications are not being created.");
  } else {
    notifications.slice(0, 5).forEach((n, i) => {
      console.log(`   ${i + 1}. [${n.type}] ${n.title}`);
      console.log(`      To: ${n.userEmail}`);
      console.log(`      Product: ${n.productName || "N/A"}`);
    });
  }

  // Check notification counts by type
  const typeCounts = await Notification.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);
  console.log(`\n📊 Notifications by Type:`);
  typeCounts.forEach(t => {
    console.log(`   - ${t._id}: ${t.count}`);
  });

  // Check unread notifications
  const unreadCount = await Notification.countDocuments({ read: false });
  console.log(`\n📬 Unread Notifications: ${unreadCount}`);

  console.log("\n✅ DEBUG COMPLETE\n");

  await mongoose.disconnect();
};

debugNotifications().catch(console.error);
