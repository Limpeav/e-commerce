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

const parseReportDateRange = (dateString, timezoneOffsetMinutes = 0) => {
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ""))
    ? String(dateString)
    : new Date().toISOString().slice(0, 10);
  const offsetMinutes = Number.isFinite(Number(timezoneOffsetMinutes))
    ? Number(timezoneOffsetMinutes)
    : 0;
  const [year, month, day] = selectedDate.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, 0, offsetMinutes, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    selectedDate,
    start,
    end,
  };
};

const formatCsvValue = (value) => {
  const normalized = String(value ?? "");
  return /[",\n\r]/.test(normalized)
    ? `"${normalized.replace(/"/g, '""')}"`
    : normalized;
};

const buildCashReportPayload = async ({ date, timezoneOffset }) => {
  const { selectedDate, start, end } = parseReportDateRange(date, timezoneOffset);
  const paidCashMatch = {
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Paid",
    paidAt: {
      $gte: start,
      $lt: end,
    },
  };

  const [orders, summaryData, pendingCashCount] = await Promise.all([
    Order.find(paidCashMatch)
      .sort({ paidAt: -1 })
      .populate("user", "name email")
      .lean(),
    Order.aggregate([
      { $match: paidCashMatch },
      {
        $group: {
          _id: null,
          totalCash: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: "$totalPrice" },
        },
      },
    ]),
    Order.countDocuments({
      paymentMethod: "Cash on Delivery",
      paymentStatus: { $ne: "Paid" },
      orderStatus: { $nin: ["Delivered", "Cancelled"] },
    }),
  ]);

  const summary = summaryData[0] || {
    totalCash: 0,
    orderCount: 0,
    averageOrderValue: 0,
  };

  return {
    date: selectedDate,
    generatedAt: new Date().toISOString(),
    range: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    summary: {
      totalCash: Number(summary.totalCash || 0),
      orderCount: Number(summary.orderCount || 0),
      averageOrderValue: Number(summary.averageOrderValue || 0),
      pendingCashCount,
    },
    orders: orders.map((order) => ({
      id: order._id.toString(),
      shortId: order._id.toString().slice(-8),
      customerName: order.shippingAddress?.fullName || order.user?.name || "N/A",
      customerPhone: order.shippingAddress?.phone || "N/A",
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      paidAt: order.paidAt,
      totalPrice: Number(order.totalPrice || 0),
    })),
  };
};

const buildCashReportCsv = (report) => {
  const rows = [
    ["Date", report.date],
    ["Generated At", report.generatedAt],
    ["Total Cash", report.summary.totalCash.toFixed(2)],
    ["Paid Cash Orders", report.summary.orderCount],
    ["Average Order Value", report.summary.averageOrderValue.toFixed(2)],
    ["Pending Cash Orders", report.summary.pendingCashCount],
    [],
    [
      "Order ID",
      "Customer",
      "Phone",
      "Paid At",
      "Payment",
      "Order Status",
      "Total",
    ],
    ...report.orders.map((order) => [
      `#${order.shortId}`,
      order.customerName,
      order.customerPhone,
      order.paidAt ? new Date(order.paidAt).toISOString() : "",
      order.paymentStatus,
      order.orderStatus,
      order.totalPrice.toFixed(2),
    ]),
  ];

  return rows
    .map((row) => row.map(formatCsvValue).join(","))
    .join("\n");
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

// @desc    Daily cash report for admin and cashier accounts
// @route   GET /api/admin/cash-report
// @access  Private/Portal
export const getDailyCashReport = asyncHandler(async (req, res) => {
  if (req.user?.role === "delivery") {
    res.status(403);
    throw new Error("Delivery accounts cannot view cash reports");
  }

  const report = await buildCashReportPayload({
    date: req.query.date,
    timezoneOffset: req.query.timezoneOffset,
  });

  if (req.query.format === "csv") {
    const csv = buildCashReportCsv(report);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="cash-report-${report.date}.csv"`
    );
    res.send(csv);
    return;
  }

  res.json(report);
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
