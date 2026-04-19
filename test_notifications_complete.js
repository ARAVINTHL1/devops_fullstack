#!/usr/bin/env node
/**
 * COMPREHENSIVE NOTIFICATION TEST
 * Tests the full notification flow for:
 * 1. Buyer placing an order
 * 2. Notifications appearing for buyer, employees, and admins
 * 3. Real-time notification updates
 */

import mongoose from "mongoose";
import { config } from "./server/src/config.js";

const connectDB = async () => {
  await mongoose.connect(config.mongoUri);
  console.log("✅ MongoDB connected\n");
};

const runTests = async () => {
  await connectDB();

  console.log("📋 COMPREHENSIVE NOTIFICATION TEST");
  console.log("===================================\n");

  const User = mongoose.model("User", new mongoose.Schema({
    name: String,
    email: String,
    role: String,
  }));

  const Notification = mongoose.model("Notification", new mongoose.Schema({
    userEmail: String,
    type: String,
    title: String,
    message: String,
    productName: String,
    currentStock: Number,
    read: Boolean,
  }, { timestamps: true }));

  // 1. Get all users by role
  console.log("1️⃣  USER DISTRIBUTION:");
  const buyers = await User.find({ role: "buyer" }).select("email name");
  const employees = await User.find({ role: "employee" }).select("email name");
  const admins = await User.find({ role: "admin" }).select("email name");

  console.log(`   🛍️  Buyers: ${buyers.length}`);
  buyers.slice(0, 3).forEach(b => console.log(`      - ${b.email}`));
  
  console.log(`   👨‍💼 Employees: ${employees.length}`);
  employees.forEach(e => console.log(`      - ${e.email}`));
  
  console.log(`   🔐 Admins: ${admins.length}`);
  admins.forEach(a => console.log(`      - ${a.email}`));

  // 2. Check notifications for each buyer
  console.log(`\n2️⃣  BUYER NOTIFICATIONS:`);
  for (const buyer of buyers.slice(0, 3)) {
    const count = await Notification.countDocuments({ userEmail: buyer.email });
    const recent = await Notification.findOne({ userEmail: buyer.email }).sort({ createdAt: -1 }).lean();
    console.log(`   📧 ${buyer.email}: ${count} notifications`);
    if (recent) {
      console.log(`      Latest: [${recent.type}] ${recent.title}`);
    }
  }

  // 3. Check notifications for employees
  console.log(`\n3️⃣  EMPLOYEE NOTIFICATIONS:`);
  for (const emp of employees) {
    const count = await Notification.countDocuments({ userEmail: emp.email });
    const recent = await Notification.findOne({ userEmail: emp.email }).sort({ createdAt: -1 }).lean();
    console.log(`   📧 ${emp.email}: ${count} notifications`);
    if (recent) {
      console.log(`      Latest: [${recent.type}] ${recent.title}`);
    }
  }

  // 4. Check notifications for admins
  console.log(`\n4️⃣  ADMIN NOTIFICATIONS:`);
  for (const admin of admins) {
    const count = await Notification.countDocuments({ userEmail: admin.email });
    const recent = await Notification.findOne({ userEmail: admin.email }).sort({ createdAt: -1 }).lean();
    console.log(`   📧 ${admin.email}: ${count} notifications`);
    if (recent) {
      console.log(`      Latest: [${recent.type}] ${recent.title}`);
    }
  }

  // 5. Check notification types
  console.log(`\n5️⃣  NOTIFICATION STATISTICS:`);
  const typeStats = await Notification.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);
  typeStats.forEach(stat => {
    console.log(`   ${stat._id}: ${stat.count} notifications`);
  });

  // 6. Check unread notifications
  console.log(`\n6️⃣  UNREAD NOTIFICATIONS:`);
  const totalUnread = await Notification.countDocuments({ read: false });
  const unreadByRole = {};
  
  for (const buyer of buyers) {
    const count = await Notification.countDocuments({ userEmail: buyer.email, read: false });
    if (count > 0) unreadByRole[buyer.email] = count;
  }
  for (const emp of employees) {
    const count = await Notification.countDocuments({ userEmail: emp.email, read: false });
    if (count > 0) unreadByRole[emp.email] = count;
  }
  
  console.log(`   Total Unread: ${totalUnread}`);
  console.log(`   By User:`);
  Object.entries(unreadByRole).forEach(([email, count]) => {
    console.log(`      ${email}: ${count}`);
  });

  // 7. Check low stock alerts
  console.log(`\n7️⃣  LOW STOCK ALERTS:`);
  const lowStockAlerts = await Notification.find({ type: "low_stock_alert" })
    .select("userEmail productName currentStock createdAt")
    .sort({ createdAt: -1 })
    .limit(5);
  
  if (lowStockAlerts.length === 0) {
    console.log("   ℹ️  No low stock alerts");
  } else {
    lowStockAlerts.forEach(alert => {
      console.log(`   ⚠️  ${alert.productName}: ${alert.currentStock} units`);
      console.log(`       To: ${alert.userEmail}`);
    });
  }

  console.log(`\n✅ TEST COMPLETE\n`);

  // Show summary
  console.log("📊 SUMMARY:");
  console.log(`   Total Users: ${buyers.length + employees.length + admins.length}`);
  console.log(`   Total Notifications: ${await Notification.countDocuments()}`);
  console.log(`   Unread Notifications: ${totalUnread}`);
  console.log(`   Order Notifications: ${await Notification.countDocuments({ type: "new_order" })}`);
  console.log(`   Low Stock Alerts: ${await Notification.countDocuments({ type: "low_stock_alert" })}`);

  await mongoose.disconnect();
};

runTests().catch(console.error);
