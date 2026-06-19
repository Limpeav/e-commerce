import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Product from "../models/Product.js";
import Order from "../models/orderModel.js";
import CsvBuilderDraft from "../models/CsvBuilderDraft.js";
import { normalizeProductCategory } from "../utils/productCategories.js";
import cloudinary from "../config/cloudinary.js";
import {
  removeImageBackground,
} from "../utils/backgroundRemoval.js";

const ADMIN_VISIBLE_ORDER_FILTER = {
  $or: [
    { paymentMethod: { $ne: "BAKONG_KHQR" } },
    { paymentStatus: "Paid" },
  ],
};

const uploadImageBuffer = (file, folder) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: file.mimetype === "image/png" ? "png" : undefined,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });

const sanitizeDraftRow = (row = {}) => ({
  title: String(row.title || "").trim(),
  price: String(row.price || "").trim(),
  discountPrice: String(row.discountPrice || "").trim(),
  category: normalizeProductCategory(row.category),
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

const getTimezoneName = (timezoneOffsetMinutes = 0) => {
  const offsetMinutes = Number.isFinite(Number(timezoneOffsetMinutes))
    ? -Number(timezoneOffsetMinutes)
    : 0;
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
  const minutes = String(absoluteMinutes % 60).padStart(2, "0");

  return `${sign}${hours}:${minutes}`;
};

const formatReportDateKey = (value, timezoneOffsetMinutes = 0) => {
  const localDate = new Date(
    new Date(value).getTime() - Number(timezoneOffsetMinutes || 0) * 60 * 1000
  );

  return localDate.toISOString().slice(0, 10);
};

const parseMonthlyReportDateRange = (dateString, timezoneOffsetMinutes = 0) => {
  const { selectedDate } = parseReportDateRange(dateString, timezoneOffsetMinutes);
  const offsetMinutes = Number.isFinite(Number(timezoneOffsetMinutes))
    ? Number(timezoneOffsetMinutes)
    : 0;
  const [year, month] = selectedDate.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1, 0, offsetMinutes, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, offsetMinutes, 0, 0));

  return {
    selectedDate: `${year}-${String(month).padStart(2, "0")}`,
    start,
    end,
  };
};

const parseTrendReportDateRange = (dateString, timezoneOffsetMinutes = 0) => {
  const { selectedDate, end } = parseReportDateRange(dateString, timezoneOffsetMinutes);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 30);

  return {
    selectedDate,
    start,
    end,
  };
};

const buildDailyBreakdown = (start, end, rows, timezoneOffsetMinutes = 0) => {
  const rowsByDate = new Map(
    rows.map((row) => [
      row._id,
      {
        date: row._id,
        totalCash: Number(row.totalCash || 0),
        orderCount: Number(row.orderCount || 0),
        averageOrderValue: Number(row.averageOrderValue || 0),
      },
    ])
  );
  const days = [];
  const cursor = new Date(start);

  while (cursor < end) {
    const date = formatReportDateKey(cursor, timezoneOffsetMinutes);
    days.push(
      rowsByDate.get(date) || {
        date,
        totalCash: 0,
        orderCount: 0,
        averageOrderValue: 0,
      }
    );
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
};

const formatCsvValue = (value) => {
  const normalized = String(value ?? "");
  return /[",\n\r]/.test(normalized)
    ? `"${normalized.replace(/"/g, '""')}"`
    : normalized;
};

const buildCashReportPayload = async ({ date, timezoneOffset, period = "day" }) => {
  const normalizedPeriod = ["day", "month", "trend"].includes(period) ? period : "day";
  const range =
    normalizedPeriod === "month"
      ? parseMonthlyReportDateRange(date, timezoneOffset)
      : normalizedPeriod === "trend"
        ? parseTrendReportDateRange(date, timezoneOffset)
        : parseReportDateRange(date, timezoneOffset);
  const { selectedDate, start, end } = range;
  const paidCashMatch = {
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Paid",
    paidAt: {
      $gte: start,
      $lt: end,
    },
  };
  const timezone = getTimezoneName(timezoneOffset);

  const [orders, summaryData, dailyRows, pendingCashData] = await Promise.all([
    normalizedPeriod === "day"
      ? Order.find(paidCashMatch)
          .sort({ paidAt: -1 })
          .populate("user", "name email")
          .lean()
      : Promise.resolve([]),
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
    normalizedPeriod === "day"
      ? Promise.resolve([])
      : Order.aggregate([
          { $match: paidCashMatch },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$paidAt",
                  timezone,
                },
              },
              totalCash: { $sum: "$totalPrice" },
              orderCount: { $sum: 1 },
              averageOrderValue: { $avg: "$totalPrice" },
            },
          },
          { $sort: { _id: 1 } },
        ]),
    Order.aggregate([
      {
        $match: {
          paymentMethod: "Cash on Delivery",
          paymentStatus: { $ne: "Paid" },
          orderStatus: { $nin: ["Delivered", "Cancelled"] },
        },
      },
      {
        $group: {
          _id: null,
          pendingCashCount: { $sum: 1 },
          pendingCashAmount: { $sum: "$totalPrice" },
        },
      },
    ]),
  ]);

  const summary = summaryData[0] || {
    totalCash: 0,
    orderCount: 0,
    averageOrderValue: 0,
  };
  const pendingCash = pendingCashData[0] || {
    pendingCashCount: 0,
    pendingCashAmount: 0,
  };

  return {
    date: selectedDate,
    period: normalizedPeriod,
    generatedAt: new Date().toISOString(),
    range: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    summary: {
      totalCash: Number(summary.totalCash || 0),
      orderCount: Number(summary.orderCount || 0),
      averageOrderValue: Number(summary.averageOrderValue || 0),
      pendingCashCount: Number(pendingCash.pendingCashCount || 0),
      pendingCashAmount: Number(pendingCash.pendingCashAmount || 0),
    },
    dailyBreakdown:
      normalizedPeriod === "day"
        ? []
        : buildDailyBreakdown(start, end, dailyRows, timezoneOffset),
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
    ["Pending Cash Amount", report.summary.pendingCashAmount.toFixed(2)],
    [],
    ...(report.period === "day"
      ? [
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
        ]
      : [
          ["Date", "Paid Cash Orders", "Total Cash", "Average Order Value"],
          ...report.dailyBreakdown.map((day) => [
            day.date,
            day.orderCount,
            day.totalCash.toFixed(2),
            day.averageOrderValue.toFixed(2),
          ]),
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
  const ordersCount = await Order.countDocuments(ADMIN_VISIBLE_ORDER_FILTER);
  const pendingOrdersCount = await Order.countDocuments({
    ...ADMIN_VISIBLE_ORDER_FILTER,
    orderStatus: "Pending",
  });
  const processingOrdersCount = await Order.countDocuments({
    ...ADMIN_VISIBLE_ORDER_FILTER,
    orderStatus: { $in: ["Processing", "Shipped"] },
  });
  const deliveredOrdersCount = await Order.countDocuments({
    ...ADMIN_VISIBLE_ORDER_FILTER,
    orderStatus: "Delivered",
  });
  const cancelledOrdersCount = await Order.countDocuments({
    ...ADMIN_VISIBLE_ORDER_FILTER,
    orderStatus: "Cancelled",
  });

  // Count paid and unpaid orders
  const paidOrdersCount = await Order.countDocuments({
    paymentStatus: "Paid",
  });
  const unpaidOrdersCount = await Order.countDocuments({
    ...ADMIN_VISIBLE_ORDER_FILTER,
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
  const recentOrders = await Order.find(ADMIN_VISIBLE_ORDER_FILTER)
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
    period: req.query.period,
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
  if (!req.file?.buffer) {
    res.status(400);
    throw new Error("Image file is required");
  }

  const shouldRemoveBackground =
    req.body?.removeBackground === "true" ||
    req.body?.removeBackground === true;
  const imageFile = shouldRemoveBackground
    ? await removeImageBackground(req.file)
    : req.file;
  const uploadedImage = await uploadImageBuffer(
    imageFile,
    "products/admin-uploads"
  );

  res.status(201).json({
    message: shouldRemoveBackground
      ? "Background removed and image uploaded successfully"
      : "Image uploaded successfully",
    imageUrl: uploadedImage.secure_url,
    originalName: req.file.originalname,
    backgroundRemoved: shouldRemoveBackground,
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
