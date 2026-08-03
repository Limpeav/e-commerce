import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Product from "../models/Product.js";
import Order from "../models/orderModel.js";
import cloudinary from "../config/cloudinary.js";
import {
  buildDashboardReviewHealth,
  buildSentimentAnalytics,
} from "../utils/sentiment.js";
import { normalizeProductCategory } from "../utils/productCategories.js";

const ADMIN_VISIBLE_ORDER_FILTER = {
  $or: [
    { paymentMethod: { $ne: "BAKONG_KHQR" } },
    { paymentStatus: "Paid" },
  ],
};

const ADMIN_MANAGED_USERS_FILTER = {
  $or: [
    { role: { $ne: "user" } },
    { role: "user", isVerified: true },
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

const SENTIMENT_LABELS = new Set(["Positive", "Neutral", "Negative"]);

const parseOptionalReportDateBoundary = (
  dateString,
  timezoneOffsetMinutes = 0,
  isEndBoundary = false
) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ""))) {
    return null;
  }

  const offsetMinutes = Number.isFinite(Number(timezoneOffsetMinutes))
    ? Number(timezoneOffsetMinutes)
    : 0;
  const [year, month, day] = String(dateString).split("-").map(Number);
  const boundary = new Date(Date.UTC(year, month - 1, day, 0, offsetMinutes, 0, 0));

  if (isEndBoundary) {
    boundary.setUTCDate(boundary.getUTCDate() + 1);
  }

  return boundary;
};

const getReportReviewTimestamp = (review = {}) => {
  const timestamp = new Date(review.createdAt || review.updatedAt || 0).getTime();
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
};

const getReportReviewSentimentLabel = (review = {}) => {
  if (SENTIMENT_LABELS.has(review.sentimentLabel)) {
    return review.sentimentLabel;
  }

  const rating = Number(review.rating || 0);
  if (rating >= 4) return "Positive";
  if (rating <= 2) return "Negative";
  return "Neutral";
};

const reviewMatchesDateRange = (review = {}, startDate, endDate) => {
  if (!startDate && !endDate) {
    return true;
  }

  const timestamp = getReportReviewTimestamp(review);
  if (!timestamp) {
    return false;
  }

  if (startDate && timestamp < startDate.getTime()) {
    return false;
  }

  if (endDate && timestamp >= endDate.getTime()) {
    return false;
  }

  return true;
};

const normalizeSentimentQueryLabel = (value) => {
  const label = String(value || "").trim();
  return SENTIMENT_LABELS.has(label) ? label : "";
};

const buildSentimentReportPayload = async (query = {}) => {
  const dateFrom = /^\d{4}-\d{2}-\d{2}$/.test(String(query.dateFrom || ""))
    ? String(query.dateFrom)
    : "";
  const dateTo = /^\d{4}-\d{2}-\d{2}$/.test(String(query.dateTo || ""))
    ? String(query.dateTo)
    : "";
  const startDate = parseOptionalReportDateBoundary(
    dateFrom,
    query.timezoneOffset,
    false
  );
  const endDate = parseOptionalReportDateBoundary(
    dateTo,
    query.timezoneOffset,
    true
  );

  if (startDate && endDate && startDate >= endDate) {
    const error = new Error("Start date must be before or equal to end date");
    error.statusCode = 400;
    throw error;
  }

  const selectedCategory = normalizeProductCategory(query.category);
  const category =
    selectedCategory && selectedCategory.toLowerCase() !== "all"
      ? selectedCategory
      : "";
  const productId = String(query.productId || "").trim();
  const productSearch = String(query.productSearch || query.search || "").trim();
  const normalizedProductSearch = productSearch.toLowerCase();
  const sentiment = normalizeSentimentQueryLabel(query.sentiment);
  const productSentiment = normalizeSentimentQueryLabel(query.productSentiment);

  const products = await Product.find({})
    .select("title category image reviews rating numReviews")
    .lean();

  const filteredProducts = products.flatMap((product) => {
    const productCategory =
      normalizeProductCategory(product.category) || "Uncategorized";
    const productKey = String(product._id || "");

    if (category && productCategory !== category) {
      return [];
    }

    if (productId && productKey !== productId) {
      return [];
    }

    if (
      normalizedProductSearch &&
      ![
        product.title,
        productCategory,
        productKey,
      ].some((value) =>
        String(value || "").toLowerCase().includes(normalizedProductSearch)
      )
    ) {
      return [];
    }

    const dateFilteredReviews = (Array.isArray(product.reviews)
      ? product.reviews
      : []
    ).filter((review) => reviewMatchesDateRange(review, startDate, endDate));

    if (
      productSentiment &&
      !dateFilteredReviews.some(
        (review) => getReportReviewSentimentLabel(review) === productSentiment
      )
    ) {
      return [];
    }

    const reportReviews = sentiment
      ? dateFilteredReviews.filter(
          (review) => getReportReviewSentimentLabel(review) === sentiment
        )
      : dateFilteredReviews;

    return [
      {
        ...product,
        category: productCategory,
        reviews: reportReviews,
      },
    ];
  });

  return {
    generatedAt: new Date().toISOString(),
    filters: {
      dateFrom,
      dateTo,
      category,
      productId,
      productSearch,
      sentiment,
      productSentiment,
    },
    sentiment: buildSentimentAnalytics(filteredProducts, {
      negativeProductLimit: 10,
    }),
  };
};

const buildSentimentReportCsv = (report) => {
  const sentiment = report.sentiment || {};
  const filters = report.filters || {};
  const rows = [
    ["Generated At", report.generatedAt],
    ["Date From", filters.dateFrom || "All"],
    ["Date To", filters.dateTo || "All"],
    ["Category", filters.category || "All"],
    ["Product Search", filters.productSearch || "All"],
    ["Review Sentiment", filters.sentiment || "All"],
    ["Product Sentiment", filters.productSentiment || "All"],
    [],
    ["Summary"],
    ["Total Reviews", sentiment.total || 0],
    ["Positive Reviews", sentiment.positive || 0],
    ["Neutral Reviews", sentiment.neutral || 0],
    ["Negative Reviews", sentiment.negative || 0],
    ["Positive Rate", `${Number(sentiment.positiveRate || 0).toFixed(1)}%`],
    ["Negative Rate", `${Number(sentiment.negativeRate || 0).toFixed(1)}%`],
    ["Average Sentiment Score", Number(sentiment.averageScore || 0).toFixed(2)],
    ["Overall Label", sentiment.label || "Neutral"],
    [],
    ["Top Negative Products Needing Action"],
    [
      "Product ID",
      "Product",
      "Category",
      "Total Reviews",
      "Negative Reviews",
      "Negative Rate",
      "Average Rating",
      "Average Sentiment Score",
      "Priority Score",
      "Latest Negative Review Date",
      "Latest Negative Review Rating",
      "Latest Negative Review",
    ],
    ...(sentiment.topNegativeProducts || []).map((product) => [
      product.productId,
      product.productTitle,
      product.category,
      product.totalReviews,
      product.negative,
      `${Number(product.negativeRate || 0).toFixed(1)}%`,
      Number(product.averageRating || 0).toFixed(2),
      Number(product.averageScore || 0).toFixed(2),
      Number(product.actionPriority || 0).toFixed(2),
      product.latestNegativeReview?.createdAt
        ? new Date(product.latestNegativeReview.createdAt).toISOString()
        : "",
      product.latestNegativeReview?.rating || "",
      product.latestNegativeReview?.comment || "",
    ]),
    [],
    ["Product Insights"],
    [
      "Product ID",
      "Product",
      "Category",
      "Total Reviews",
      "Positive",
      "Neutral",
      "Negative",
      "Negative Rate",
      "Average Rating",
      "Average Sentiment Score",
    ],
    ...(sentiment.productInsights || []).map((product) => [
      product.productId,
      product.productTitle,
      product.category,
      product.totalReviews,
      product.positive,
      product.neutral,
      product.negative,
      `${Number(product.negativeRate || 0).toFixed(1)}%`,
      Number(product.averageRating || 0).toFixed(2),
      Number(product.averageScore || 0).toFixed(2),
    ]),
    [],
    ["Category Insights"],
    [
      "Category",
      "Total Reviews",
      "Positive",
      "Neutral",
      "Negative",
      "Negative Rate",
      "Average Rating",
      "Average Sentiment Score",
    ],
    ...(sentiment.categoryInsights || []).map((category) => [
      category.category,
      category.totalReviews,
      category.positive,
      category.neutral,
      category.negative,
      `${Number(category.negativeRate || 0).toFixed(1)}%`,
      Number(category.averageRating || 0).toFixed(2),
      Number(category.averageScore || 0).toFixed(2),
    ]),
    [],
    ["Trend"],
    [
      "Month",
      "Total Reviews",
      "Positive",
      "Neutral",
      "Negative",
      "Negative Rate",
      "Average Rating",
      "Average Sentiment Score",
    ],
    ...(sentiment.trend || []).map((month) => [
      month.month,
      month.totalReviews,
      month.positive,
      month.neutral,
      month.negative,
      `${Number(month.negativeRate || 0).toFixed(1)}%`,
      Number(month.averageRating || 0).toFixed(2),
      Number(month.averageScore || 0).toFixed(2),
    ]),
  ];

  return rows
    .map((row) => row.map(formatCsvValue).join(","))
    .join("\n");
};

const getSentimentReportFileName = (filters = {}) => {
  const dateRange =
    filters.dateFrom || filters.dateTo
      ? `${filters.dateFrom || "start"}-to-${filters.dateTo || "latest"}`
      : "all-dates";

  return `sentiment-report-${dateRange}.csv`;
};

// @desc    Admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardData = asyncHandler(async (req, res) => {
  // Get counts
  const usersCount = await User.countDocuments(ADMIN_MANAGED_USERS_FILTER);
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
  const profitData = await Order.aggregate([
    {
      $match: {
        paymentStatus: "Paid",
        orderStatus: { $ne: "Cancelled" },
      },
    },
    { $unwind: "$orderItems" },
    {
      $lookup: {
        from: "products",
        localField: "orderItems.product",
        foreignField: "_id",
        as: "profitProduct",
      },
    },
    {
      $addFields: {
        profitUnitCost: {
          $ifNull: [
            "$orderItems.costPrice",
            {
              $ifNull: [
                { $arrayElemAt: ["$profitProduct.costPrice", 0] },
                0,
              ],
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        productProfit: {
          $sum: {
            $multiply: [
              {
                $subtract: [
                  "$orderItems.price",
                  "$profitUnitCost",
                ],
              },
              "$orderItems.quantity",
            ],
          },
        },
      },
    },
  ]);
  const productProfit = profitData.length > 0 ? profitData[0].productProfit : 0;
  const productsForSentiment = await Product.find({})
    .select("title category reviews")
    .lean();
  const sentiment = buildSentimentAnalytics(productsForSentiment);
  const reviewHealth = buildDashboardReviewHealth(productsForSentiment, sentiment);

  // Get recent activity (users only – exclude admin actions)
  const recentOrders = await Order.find(ADMIN_VISIBLE_ORDER_FILTER)
    .sort({ createdAt: -1 })
    .limit(3)
    .populate("user", "name email role");

  const recentUsers = await User.find({ role: "user", isVerified: true })
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
    profit: productProfit,
    pendingOrders: pendingOrdersCount,
    processingOrders: processingOrdersCount,
    deliveredOrders: deliveredOrdersCount,
    cancelledOrders: cancelledOrdersCount,
    paidOrders: paidOrdersCount,
    unpaidOrders: unpaidOrdersCount,
    cashToCollect: cashToCollectCount,
    sentiment,
    reviewHealth,
    recentActivity: recentActivity.slice(0, 5).map((activity) => {
      const publicActivity = { ...activity };
      delete publicActivity.timestamp;
      return publicActivity;
    }),
  });
});

// @desc    Customer sentiment analytics for admin reports
// @route   GET /api/admin/sentiment-report
// @access  Private/Portal
export const getSentimentReport = asyncHandler(async (req, res) => {
  const report = await buildSentimentReportPayload(req.query);

  if (req.query.format === "csv") {
    const csv = buildSentimentReportCsv(report);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${getSentimentReportFileName(report.filters)}"`
    );
    res.send(csv);
    return;
  }

  res.json(report);
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

// @desc    Upload product image for admin product forms
// @route   POST /api/admin/uploads/product-image
// @access  Private/Admin
export const uploadProductImage = asyncHandler(async (req, res) => {
  if (!req.file?.buffer) {
    res.status(400);
    throw new Error("Image file is required");
  }

  const uploadedImage = await uploadImageBuffer(req.file, "products/admin-uploads");

  res.status(201).json({
    message: "Image uploaded successfully",
    imageUrl: uploadedImage.secure_url,
    originalName: req.file.originalname,
    backgroundRemoved: false,
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
