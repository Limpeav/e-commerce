import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Product from "../models/Product.js";
import Order from "../models/orderModel.js";

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
