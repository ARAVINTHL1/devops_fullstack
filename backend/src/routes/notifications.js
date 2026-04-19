import express from "express";
import { Notification } from "../models/Notification.js";

const router = express.Router();

// All routes are protected by authenticate middleware from index.js

// Get notifications for current user
router.get("/", async (req, res) => {
  const notifications = await Notification.find({ 
    userEmail: req.authUser.email 
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

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

// Get unread count
router.get("/unread-count", async (req, res) => {
  const count = await Notification.countDocuments({
    userEmail: req.authUser.email,
    read: false,
  });

  return res.json({ count });
});

// Mark notification as read
router.put("/:id/read", async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { 
      _id: req.params.id, 
      userEmail: req.authUser.email 
    },
    { 
      read: true, 
      readAt: new Date() 
    },
    { new: true }
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
      ...(notification.orderId && { orderId: notification.orderId.toString() }),
      ...(notification.orderNumber && { orderNumber: notification.orderNumber }),
      ...(notification.productId && { productId: notification.productId }),
      ...(notification.productName && { productName: notification.productName }),
      ...(notification.currentStock !== undefined && { currentStock: notification.currentStock }),
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
      readAt: notification.readAt ? notification.readAt.toISOString() : null,
    },
  });
});

// Mark all as read
router.put("/mark-all-read", async (req, res) => {
  await Notification.updateMany(
    { 
      userEmail: req.authUser.email,
      read: false 
    },
    { 
      read: true, 
      readAt: new Date() 
    }
  );

  return res.json({ message: "All notifications marked as read." });
});

export default router;
