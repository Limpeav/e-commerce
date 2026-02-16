import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Product from "../models/Product.js";
import Order from "../models/orderModel.js";
import { summarizeSentiment } from "../utils/sentiment.js";

const getReviewModerationStatus = (review) => review?.moderationStatus || "Approved";
const getApprovedReviews = (reviews = []) =>
  (Array.isArray(reviews) ? reviews : []).filter(
    (review) => getReviewModerationStatus(review) === "Approved"
  );

const recalculateProductReviewMetrics = (product) => {
  const approvedReviews = getApprovedReviews(product?.reviews || []);
  const totalRating = approvedReviews.reduce(
    (sum, review) => sum + Number(review.rating || 0),
    0
  );

  product.numReviews = approvedReviews.length;
  product.rating = approvedReviews.length ? totalRating / approvedReviews.length : 0;
  product.sentimentSummary = summarizeSentiment(approvedReviews);
};

const toMonthKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const buildMonthTimeline = (months) => {
  const points = [];
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const point = new Date(now);
    point.setMonth(now.getMonth() - offset);
    points.push(point);
  }

  return points;
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

  // Count paid and unpaid orders
  const paidOrdersCount = await Order.countDocuments({
    paymentStatus: "Paid",
  });
  const unpaidOrdersCount = await Order.countDocuments({
    paymentStatus: { $ne: "Paid" },
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

  // Sentiment quick summary (for dashboard card)
  const sentimentProducts = await Product.find({ numReviews: { $gt: 0 } }).select(
    "sentimentSummary numReviews"
  );

  const sentimentTotals = sentimentProducts.reduce(
    (totals, product) => {
      const summary = product.sentimentSummary || {};
      const positive = Number(summary.positive || 0);
      const neutral = Number(summary.neutral || 0);
      const negative = Number(summary.negative || 0);
      const total = Number(summary.total || product.numReviews || 0);

      totals.reviews += total;
      totals.positive += positive;
      totals.neutral += neutral;
      totals.negative += negative;
      return totals;
    },
    { reviews: 0, positive: 0, neutral: 0, negative: 0 }
  );

  const sentimentDistribution = {
    positiveRate: sentimentTotals.reviews ? sentimentTotals.positive / sentimentTotals.reviews : 0,
    neutralRate: sentimentTotals.reviews ? sentimentTotals.neutral / sentimentTotals.reviews : 0,
    negativeRate: sentimentTotals.reviews ? sentimentTotals.negative / sentimentTotals.reviews : 0,
  };

  res.json({
    admin: req.user.name,
    users: usersCount,
    products: productsCount,
    orders: ordersCount,
    revenue: totalRevenue,
    pendingOrders: pendingOrdersCount,
    paidOrders: paidOrdersCount,
    unpaidOrders: unpaidOrdersCount,
    recentActivity: recentActivity.slice(0, 5).map(({ timestamp, ...activity }) => activity),
    sentiment: {
      totals: sentimentTotals,
      distribution: sentimentDistribution,
    },
  });
});

// @desc    Sentiment summary report
// @route   GET /api/admin/reports/sentiment
// @access  Private/Admin
export const getSentimentReport = asyncHandler(async (req, res) => {
  const products = await Product.find({ numReviews: { $gt: 0 } }).select(
    "title rating numReviews sentimentSummary category stock"
  );

  const totals = {
    productsWithReviews: products.length,
    reviews: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  const productInsights = products.map((product) => {
    const summary = product.sentimentSummary || {};
    const positive = Number(summary.positive || 0);
    const neutral = Number(summary.neutral || 0);
    const negative = Number(summary.negative || 0);
    const total = Number(summary.total || product.numReviews || 0);
    const averageScore = Number(summary.averageScore || 0);
    const label = summary.label || "Neutral";

    totals.reviews += total;
    totals.positive += positive;
    totals.neutral += neutral;
    totals.negative += negative;

    return {
      id: product._id,
      title: product.title,
      category: product.category,
      stock: product.stock,
      rating: product.rating,
      numReviews: product.numReviews,
      sentiment: {
        label,
        averageScore,
        positive,
        neutral,
        negative,
        total,
      },
    };
  });

  const weakProducts = [...productInsights]
    .filter((item) => item.sentiment.total > 0)
    .sort((a, b) => {
      const aNegativeRatio = a.sentiment.negative / a.sentiment.total;
      const bNegativeRatio = b.sentiment.negative / b.sentiment.total;
      return bNegativeRatio - aNegativeRatio;
    })
    .slice(0, 10);

  res.json({
    totals,
    distribution: {
      positiveRate: totals.reviews ? Number((totals.positive / totals.reviews).toFixed(4)) : 0,
      neutralRate: totals.reviews ? Number((totals.neutral / totals.reviews).toFixed(4)) : 0,
      negativeRate: totals.reviews ? Number((totals.negative / totals.reviews).toFixed(4)) : 0,
    },
    weakProducts,
  });
});

// @desc    Feedback trends over time
// @route   GET /api/admin/reports/feedback-trends
// @access  Private/Admin
export const getFeedbackTrends = asyncHandler(async (req, res) => {
  const trendRows = await Product.aggregate([
    { $unwind: "$reviews" },
    {
      $match: {
        $expr: {
          $eq: [{ $ifNull: ["$reviews.moderationStatus", "Approved"] }, "Approved"],
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$reviews.createdAt" },
          month: { $month: "$reviews.createdAt" },
          sentiment: { $ifNull: ["$reviews.sentimentLabel", "Neutral"] },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const timelineMap = new Map();

  for (const row of trendRows) {
    const { year, month, sentiment } = row._id;
    const period = `${year}-${String(month).padStart(2, "0")}`;
    const existing = timelineMap.get(period) || {
      period,
      positive: 0,
      neutral: 0,
      negative: 0,
      total: 0,
    };

    if (sentiment === "Positive") {
      existing.positive += row.count;
    } else if (sentiment === "Negative") {
      existing.negative += row.count;
    } else {
      existing.neutral += row.count;
    }

    existing.total += row.count;
    timelineMap.set(period, existing);
  }

  const trends = [...timelineMap.values()];

  res.json({
    trends,
    totalPeriods: trends.length,
    totalReviews: trends.reduce((sum, row) => sum + row.total, 0),
  });
});

// @desc    Inventory trends and low-stock report
// @route   GET /api/admin/reports/inventory
// @access  Private/Admin
export const getInventoryReport = asyncHandler(async (req, res) => {
  const requestedMonths = Number.parseInt(req.query.months, 10);
  const months = Number.isFinite(requestedMonths)
    ? Math.min(Math.max(requestedMonths, 1), 24)
    : 6;

  const requestedThreshold = Number.parseInt(req.query.lowStockThreshold, 10);
  const lowStockThreshold = Number.isFinite(requestedThreshold)
    ? Math.max(requestedThreshold, 0)
    : 10;

  const products = await Product.find({}).select(
    "_id title category stock price discountPrice image"
  );

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const outOfStockCount = products.filter((product) => Number(product.stock || 0) <= 0).length;
  const lowStockProducts = products
    .filter(
      (product) =>
        Number(product.stock || 0) > 0 && Number(product.stock || 0) <= lowStockThreshold
    )
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    .slice(0, 20)
    .map((product) => ({
      id: product._id,
      title: product.title,
      category: product.category,
      stock: Number(product.stock || 0),
      image: product.image,
    }));

  const stockByCategoryMap = new Map();
  for (const product of products) {
    const category = product.category || "Uncategorized";
    const existing = stockByCategoryMap.get(category) || {
      category,
      products: 0,
      totalStock: 0,
      outOfStock: 0,
    };

    existing.products += 1;
    existing.totalStock += Number(product.stock || 0);
    if (Number(product.stock || 0) <= 0) {
      existing.outOfStock += 1;
    }

    stockByCategoryMap.set(category, existing);
  }

  const monthTimeline = buildMonthTimeline(months);
  const startDate = monthTimeline[0];

  const soldRows = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        orderStatus: { $ne: "Cancelled" },
      },
    },
    { $unwind: "$orderItems" },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        unitsSold: { $sum: "$orderItems.quantity" },
        grossSales: {
          $sum: {
            $multiply: ["$orderItems.price", "$orderItems.quantity"],
          },
        },
      },
    },
  ]);

  const soldMap = new Map();
  for (const row of soldRows) {
    const key = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
    soldMap.set(key, {
      period: key,
      unitsSold: Number(row.unitsSold || 0),
      grossSales: Number(row.grossSales || 0),
    });
  }

  const trends = monthTimeline.map((point) => {
    const key = toMonthKey(point);
    return (
      soldMap.get(key) || {
        period: key,
        unitsSold: 0,
        grossSales: 0,
      }
    );
  });

  res.json({
    summary: {
      totalProducts,
      totalStock,
      outOfStockCount,
      lowStockCount: lowStockProducts.length,
      lowStockThreshold,
    },
    trends,
    lowStockProducts,
    stockByCategory: [...stockByCategoryMap.values()].sort((a, b) =>
      a.category.localeCompare(b.category)
    ),
  });
});

// @desc    Review moderation queue
// @route   GET /api/admin/reviews
// @access  Private/Admin
export const getReviewModerationQueue = asyncHandler(async (req, res) => {
  const statusFilter = String(req.query.status || "").trim();
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);

  const products = await Product.find({ "reviews.0": { $exists: true } }).select(
    "_id title image category reviews"
  );

  const allReviews = [];
  const counts = {
    Pending: 0,
    Approved: 0,
    Rejected: 0,
  };

  for (const product of products) {
    for (const review of product.reviews || []) {
      const moderationStatus = getReviewModerationStatus(review);
      if (counts[moderationStatus] !== undefined) {
        counts[moderationStatus] += 1;
      }

      if (statusFilter && statusFilter !== moderationStatus) {
        continue;
      }

      allReviews.push({
        reviewId: review._id,
        productId: product._id,
        productTitle: product.title,
        productImage: product.image,
        productCategory: product.category,
        reviewerName: review.name,
        rating: review.rating,
        comment: review.comment || "",
        sentimentLabel: review.sentimentLabel || "Neutral",
        sentimentScore: Number(review.sentimentScore || 0),
        moderationStatus,
        moderationNote: review.moderationNote || "",
        createdAt: review.createdAt,
        moderatedAt: review.moderatedAt,
      });
    }
  }

  allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = allReviews.length;
  const start = (page - 1) * limit;
  const end = start + limit;

  res.json({
    items: allReviews.slice(start, end),
    counts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

// @desc    Moderate a product review
// @route   PATCH /api/admin/reviews/:productId/:reviewId
// @access  Private/Admin
export const moderateReview = asyncHandler(async (req, res) => {
  const { productId, reviewId } = req.params;
  const nextStatus = String(req.body.status || "").trim();
  const moderationNote = String(req.body.moderationNote || "").trim();

  if (!["Pending", "Approved", "Rejected"].includes(nextStatus)) {
    res.status(400);
    throw new Error("Status must be Pending, Approved, or Rejected");
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const review = product.reviews.id(reviewId);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  review.moderationStatus = nextStatus;
  review.moderationNote = moderationNote;
  review.moderatedBy = req.user._id;
  review.moderatedAt = new Date();

  recalculateProductReviewMetrics(product);
  await product.save();

  res.json({
    message: "Review moderation updated",
    review: {
      reviewId: review._id,
      moderationStatus: review.moderationStatus,
      moderationNote: review.moderationNote,
      moderatedAt: review.moderatedAt,
    },
    product: {
      id: product._id,
      title: product.title,
      rating: product.rating,
      numReviews: product.numReviews,
      sentimentSummary: product.sentimentSummary,
    },
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
