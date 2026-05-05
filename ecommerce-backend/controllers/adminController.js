import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Product from "../models/Product.js";
import Order from "../models/orderModel.js";
import CsvBuilderDraft from "../models/CsvBuilderDraft.js";

const sanitizeDraftRow = (row = {}) => ({
  title: String(row.title || "").trim(),
  price: String(row.price || "").trim(),
  discountPrice: String(row.discountPrice || "").trim(),
  category: String(row.category || "").trim(),
  description: String(row.description || "").trim(),
  stock: String(row.stock || "").trim(),
  image: String(row.image || "").trim(),
  imageName: String(row.imageName || "").trim(),
});

const sanitizeDraftFileName = (fileName = "") => {
  const sanitized = String(fileName || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-");

  if (!sanitized) {
    return "products-import-ready.csv";
  }

  return sanitized.toLowerCase().endsWith(".csv")
    ? sanitized
    : `${sanitized}.csv`;
};

// @desc    Admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardData = asyncHandler(async (req, res) => {
  // Get counts
  const usersCount = await User.countDocuments();
  const productsCount = await Product.countDocuments();
  const ordersCount = await Order.countDocuments();
  const pendingOrdersCount = await Order.countDocuments({
    orderStatus: "Pending",
  });
  const processingOrdersCount = await Order.countDocuments({
    orderStatus: "Processing",
  });
  const shippedOrdersCount = await Order.countDocuments({
    orderStatus: "Shipped",
  });
  const deliveredOrdersCount = await Order.countDocuments({
    orderStatus: "Delivered",
  });
  const cancelledOrdersCount = await Order.countDocuments({
    orderStatus: "Cancelled",
  });

  // Count paid and unpaid orders
  const paidOrdersCount = await Order.countDocuments({
    paymentStatus: "Paid",
  });
  const unpaidOrdersCount = await Order.countDocuments({
    paymentStatus: { $ne: "Paid" },
  });
  const cashToCollectCount = await Order.countDocuments({
    paymentMethod: "Cash on Delivery",
    paymentStatus: { $ne: "Paid" },
    orderStatus: { $nin: ["Delivered", "Cancelled"] },
  });

  // Calculate total revenue from paid orders
  const revenueData = await Order.aggregate([
    { $match: { paymentStatus: "Paid" } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
  ]);
  const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

  // Get recent activity (users only – exclude admin actions)
  const recentOrders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(3)
    .populate("user", "name email role");

  const recentUsers = await User.find({ role: "user" })
    .sort({ createdAt: -1 })
    .limit(2)
    .select("name email createdAt");

  // Format recent activity
  const recentActivity = [];

  recentOrders.forEach((order) => {
    // Only track orders placed by normal users, not admins
    if (order.user && order.user.role === "user") {
      const itemsCount = order.orderItems ? order.orderItems.length : 0;
      recentActivity.push({
        id: order._id.toString(),
        action: `New order placed`,
        description: `Order #${order._id.toString().slice(-6)}`,
        userName: order.user.name || order.user.email,
        userEmail: order.user.email,
        amount: order.totalPrice,
        itemsCount: itemsCount,
        orderStatus: order.orderStatus || "Pending",
        paymentStatus: order.paymentStatus || "Pending",
        time: getTimeAgo(order.createdAt),
        timestamp: order.createdAt,
        type: "order",
      });
    }
  });

  recentUsers.forEach((user) => {
    recentActivity.push({
      id: user._id.toString(),
      action: `New user registered`,
      description: user.email,
      userName: user.name || "Unknown",
      userEmail: user.email,
      time: getTimeAgo(user.createdAt),
      timestamp: user.createdAt,
      type: "user",
    });
  });

  // Sort by actual timestamp
  recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json({
    admin: req.user.name,
    users: usersCount,
    products: productsCount,
    orders: ordersCount,
    revenue: totalRevenue,
    pendingOrders: pendingOrdersCount,
    processingOrders: processingOrdersCount,
    shippedOrders: shippedOrdersCount,
    deliveredOrders: deliveredOrdersCount,
    cancelledOrders: cancelledOrdersCount,
    paidOrders: paidOrdersCount,
    unpaidOrders: unpaidOrdersCount,
    cashToCollect: cashToCollectCount,
    recentActivity: recentActivity.slice(0, 5).map(({ timestamp, ...activity }) => activity),
  });
});

// @desc    Upload product image for CSV builder
// @route   POST /api/admin/uploads/product-image
// @access  Private/Admin
export const uploadProductImage = asyncHandler(async (req, res) => {
  if (!req.file?.path) {
    res.status(400);
    throw new Error("Image file is required");
  }

  res.status(201).json({
    message: "Image uploaded successfully",
    imageUrl: req.file.path,
    originalName: req.file.originalname,
  });
});

// @desc    Get CSV builder draft
// @route   GET /api/admin/csv-builder-draft
// @access  Private/Admin
export const getCsvBuilderDraft = asyncHandler(async (req, res) => {
  const draft = await CsvBuilderDraft.findOne({ admin: req.user._id }).lean();

  res.json({
    rows: draft?.rows || [],
    fileName: draft?.fileName || "products-import-ready.csv",
    updatedAt: draft?.updatedAt || null,
  });
});

// @desc    Save CSV builder draft
// @route   PUT /api/admin/csv-builder-draft
// @access  Private/Admin
export const saveCsvBuilderDraft = asyncHandler(async (req, res) => {
  const incomingRows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  const rows = incomingRows.map(sanitizeDraftRow);
  const fileName = sanitizeDraftFileName(req.body?.fileName);

  const draft = await CsvBuilderDraft.findOneAndUpdate(
    { admin: req.user._id },
    { admin: req.user._id, rows, fileName },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  res.json({
    message: "Draft saved successfully",
    rows: draft.rows || [],
    fileName: draft.fileName || "products-import-ready.csv",
    updatedAt: draft.updatedAt || null,
  });
});

// Helper function to get relative time
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " year" + (Math.floor(interval) > 1 ? "s" : "") + " ago";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " month" + (Math.floor(interval) > 1 ? "s" : "") + " ago";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " day" + (Math.floor(interval) > 1 ? "s" : "") + " ago";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hour" + (Math.floor(interval) > 1 ? "s" : "") + " ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " min" + (Math.floor(interval) > 1 ? "s" : "") + " ago";

  return Math.floor(seconds) + " sec" + (Math.floor(seconds) > 1 ? "s" : "") + " ago";
}
