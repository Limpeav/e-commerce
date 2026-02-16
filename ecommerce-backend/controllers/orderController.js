import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import Product from "../models/Product.js";
import Notification from "../models/notificationModel.js";
import {
  calculateShippingFee,
  getShippingQuote,
} from "../utils/shippingCalculator.js";
import {
  emitNotificationCreated,
  emitOrderUpdated,
} from "../realtime/socket.js";

const roundCurrency = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const resolveProductUnitPrice = (product) => {
  if (
    typeof product.discountPrice === "number" &&
    product.discountPrice > 0 &&
    product.discountPrice < product.price
  ) {
    return product.discountPrice;
  }

  return product.price;
};

const trimText = (value) => (value ? value.toString().trim() : "");

const buildOrderCode = (orderId) => orderId.toString().slice(-8).toUpperCase();
const SUPPORTED_PAYMENT_METHODS = new Set([
  "BAKONG_KHQR",
  "Cash on Delivery",
  "Bank Transfer",
]);

const reserveStockForOrderItems = async (orderItems = []) => {
  const reserved = [];

  for (const item of orderItems) {
    const quantity = Number(item.quantity || 0);
    if (!item.product || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Invalid order item payload");
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true, select: "_id title stock" }
    );

    if (!updatedProduct) {
      throw new Error(`Insufficient stock for ${item.name || "one item"}`);
    }

    reserved.push({
      product: item.product,
      quantity,
    });
  }

  return reserved;
};

const restoreStockForOrderItems = async (orderItems = []) => {
  for (const item of orderItems) {
    const quantity = Number(item.quantity || 0);
    if (!item.product || !Number.isInteger(quantity) || quantity < 1) {
      continue;
    }

    await Product.updateOne({ _id: item.product }, { $inc: { stock: quantity } });
  }
};

const createNotificationSafely = async (payload) => {
  try {
    const notification = await Notification.create(payload);
    emitNotificationCreated(notification);
  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

// @desc    Get shipping fee quote
// @route   GET|POST /api/orders/shipping-fee
// @access  Private
export const getShippingFeeQuote = asyncHandler(async (req, res) => {
  const input = req.method === "GET" ? req.query : req.body || {};
  const shippingAddress =
    input.shippingAddress && typeof input.shippingAddress === "object"
      ? input.shippingAddress
      : input;

  if (!trimText(shippingAddress.city)) {
    res.status(400);
    throw new Error("City is required to calculate shipping fee");
  }

  const payload = {
    shippingAddress: {
      city: trimText(shippingAddress.city),
      country: trimText(shippingAddress.country || "Cambodia"),
    },
    itemCount: Number(input.itemCount || 1),
    totalQuantity: Number(input.totalQuantity || input.itemCount || 1),
    itemsPrice: Number(input.itemsPrice || 0),
  };

  res.json(getShippingQuote(payload));
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, shippingCarrier } = req.body;

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
  }

  if (
    !shippingAddress?.fullName ||
    !shippingAddress?.address ||
    !shippingAddress?.city ||
    !shippingAddress?.phone
  ) {
    res.status(400);
    throw new Error("Incomplete shipping address");
  }

  const normalizedShippingAddress = {
    fullName: trimText(shippingAddress.fullName),
    address: trimText(shippingAddress.address),
    city: trimText(shippingAddress.city),
    postalCode: trimText(shippingAddress.postalCode),
    country: trimText(shippingAddress.country || "Cambodia"),
    phone: trimText(shippingAddress.phone),
    latitude: Number.isFinite(Number(shippingAddress.latitude))
      ? Number(shippingAddress.latitude)
      : undefined,
    longitude: Number.isFinite(Number(shippingAddress.longitude))
      ? Number(shippingAddress.longitude)
      : undefined,
  };

  const selectedPaymentMethod = trimText(paymentMethod) || "Cash on Delivery";
  if (!SUPPORTED_PAYMENT_METHODS.has(selectedPaymentMethod)) {
    res.status(400);
    throw new Error("Unsupported payment method");
  }

  const normalizedCarrier = trimText(shippingCarrier) || "J&T Express";
  if (!["j&t express", "vireak buntham express"].includes(normalizedCarrier.toLowerCase())) {
    res.status(400);
    throw new Error("Unsupported shipping carrier");
  }

  const quantityByProduct = new Map();
  for (const item of orderItems) {
    const productId = item?.product?.toString();
    const quantity = Number(item?.quantity || 0);

    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      res.status(400);
      throw new Error("Invalid order item payload");
    }

    const existingQuantity = quantityByProduct.get(productId) || 0;
    quantityByProduct.set(productId, existingQuantity + quantity);
  }

  const normalizedItems = [...quantityByProduct.entries()].map(([product, quantity]) => ({
    product,
    quantity,
  }));

  const invalidItem = normalizedItems.find(
    (item) => !item.product || !Number.isInteger(item.quantity) || item.quantity < 1
  );

  if (invalidItem) {
    res.status(400);
    throw new Error("Invalid order item payload");
  }

  const productIds = [...new Set(normalizedItems.map((item) => item.product.toString()))];
  const products = await Product.find({ _id: { $in: productIds } }).select(
    "_id title image price discountPrice stock"
  );

  if (products.length !== productIds.length) {
    res.status(400);
    throw new Error("One or more products were not found");
  }

  const productById = new Map(products.map((product) => [product._id.toString(), product]));

  const sanitizedOrderItems = normalizedItems.map((item) => {
    const product = productById.get(item.product.toString());
    const unitPrice = resolveProductUnitPrice(product);

    if (typeof product.stock === "number" && product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.title}`);
    }

    return {
      product: product._id,
      name: product.title,
      quantity: item.quantity,
      image: product.image,
      price: roundCurrency(unitPrice),
    };
  });

  const itemsPrice = roundCurrency(
    sanitizedOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  const totalQuantity = sanitizedOrderItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  // Shipping fee is always calculated server-side from delivery location.
  const shippingPrice = calculateShippingFee({
    shippingAddress: normalizedShippingAddress,
    itemCount: sanitizedOrderItems.length,
    totalQuantity,
    itemsPrice,
  });

  const configuredTaxRate = Number(process.env.ORDER_TAX_RATE);
  const taxRate =
    Number.isFinite(configuredTaxRate) && configuredTaxRate >= 0
      ? configuredTaxRate
      : 0.08;
  const taxPrice = roundCurrency(itemsPrice * taxRate);
  const totalPrice = roundCurrency(itemsPrice + shippingPrice + taxPrice);

  let reservedStock = [];
  let createdOrder;

  try {
    reservedStock = await reserveStockForOrderItems(sanitizedOrderItems);

    const order = new Order({
      user: req.user._id,
      orderItems: sanitizedOrderItems,
      shippingAddress: normalizedShippingAddress,
      paymentMethod: selectedPaymentMethod,
      shippingCarrier: normalizedCarrier,
      taxPrice,
      shippingPrice,
      totalPrice,
      stockRestored: false,
    });

    createdOrder = await order.save();
  } catch (error) {
    if (reservedStock.length > 0) {
      await restoreStockForOrderItems(reservedStock);
    }

    if (res.statusCode < 400) {
      const message = String(error.message || "");
      res.status(message.includes("stock") ? 400 : 500);
    }

    throw error;
  }

  await createdOrder.populate("user", "name email");

  let googleMapsLink = "";
  if (normalizedShippingAddress.latitude && normalizedShippingAddress.longitude) {
    googleMapsLink = `https://www.google.com/maps?q=${normalizedShippingAddress.latitude},${normalizedShippingAddress.longitude}`;
  }

  const orderCode = buildOrderCode(createdOrder._id);

  await createNotificationSafely({
    type: "order",
    audience: "admin",
    title: "New Order Received",
    message: `${createdOrder.user.name} placed order #${orderCode} for $${createdOrder.totalPrice.toFixed(2)}`,
    orderId: createdOrder._id,
    userId: req.user._id,
    link: `/admin/orders/${createdOrder._id}`,
    googleMapsLink,
  });

  await createNotificationSafely({
    type: "order",
    audience: "user",
    recipient: req.user._id,
    title: "Order Confirmed",
    message: `Your order #${orderCode} has been placed successfully. Shipping: $${shippingPrice.toFixed(
      2
    )}, Carrier: ${normalizedCarrier}, Total: $${createdOrder.totalPrice.toFixed(2)}.`,
    orderId: createdOrder._id,
    userId: req.user._id,
    link: `/orders/${createdOrder._id}`,
  });

  emitOrderUpdated(createdOrder, { reason: "created" });

  res.status(201).json(createdOrder);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isOwner = order.user?._id?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to access this order");
  }

  res.json(order);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const previousStatus = order.orderStatus;
  const nextStatus = trimText(req.body.orderStatus) || previousStatus;

  const validOrderStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
  if (!validOrderStatuses.includes(nextStatus)) {
    res.status(400);
    throw new Error("Invalid order status");
  }

  if (previousStatus === "Cancelled" && nextStatus !== "Cancelled" && order.stockRestored) {
    try {
      await reserveStockForOrderItems(order.orderItems);
      order.stockRestored = false;
    } catch (error) {
      res.status(400);
      throw new Error(`Cannot reopen order: ${error.message}`);
    }
  } else if (
    previousStatus !== "Cancelled" &&
    nextStatus === "Cancelled" &&
    ["Pending", "Processing"].includes(previousStatus) &&
    !order.stockRestored
  ) {
    await restoreStockForOrderItems(order.orderItems);
    order.stockRestored = true;
  }

  order.orderStatus = nextStatus;

  if (nextStatus === "Delivered") {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  } else if (previousStatus === "Delivered" && nextStatus !== "Delivered") {
    order.isDelivered = false;
    order.deliveredAt = undefined;
  }

  const updatedOrder = await order.save();

  if (previousStatus !== nextStatus) {
    await createNotificationSafely({
      type: "order",
      audience: "user",
      recipient: order.user,
      userId: order.user,
      orderId: order._id,
      title: "Order Status Updated",
      message: `Order #${buildOrderCode(order._id)} is now ${nextStatus}.`,
      link: `/orders/${order._id}`,
    });
  }

  emitOrderUpdated(updatedOrder, { reason: "status_changed" });

  res.json(updatedOrder);
});

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment-status
// @access  Private/Admin
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const { paymentStatus } = req.body;
  const validStatuses = ["Pending", "Paid", "Failed", "Refunded"];
  if (!validStatuses.includes(paymentStatus)) {
    res.status(400);
    throw new Error("Invalid payment status");
  }

  const previousStatus = order.paymentStatus;
  order.paymentStatus = paymentStatus;

  if (paymentStatus === "Paid") {
    order.isPaid = true;
    order.paidAt = Date.now();
  } else {
    order.isPaid = false;
    order.paidAt = undefined;
  }

  const updatedOrder = await order.save();

  if (previousStatus !== paymentStatus) {
    await createNotificationSafely({
      type: "payment",
      audience: "user",
      recipient: order.user,
      userId: order.user,
      orderId: order._id,
      title: "Payment Status Updated",
      message: `Payment for order #${buildOrderCode(order._id)} is now ${paymentStatus}.`,
      link: `/orders/${order._id}`,
    });
  }

  emitOrderUpdated(updatedOrder, { reason: "payment_status_changed" });

  res.json(updatedOrder);
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private/Admin
export const updateOrderToPaid = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Admin access required");
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.isPaid) {
    return res.json(order);
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentStatus = "Paid";
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.email_address,
  };

  const updatedOrder = await order.save();

  await createNotificationSafely({
    type: "payment",
    audience: "user",
    recipient: order.user,
    userId: order.user,
    orderId: order._id,
    title: "Payment Confirmed",
    message: `Payment for order #${buildOrderCode(order._id)} has been confirmed.`,
    link: `/orders/${order._id}`,
  });

  emitOrderUpdated(updatedOrder, { reason: "payment_marked_paid" });

  res.json(updatedOrder);
});

// @desc    Cancel own order before shipping
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isOwner = order.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to cancel this order");
  }

  if (order.orderStatus === "Cancelled") {
    return res.json(order);
  }

  if (order.orderStatus === "Shipped" || order.orderStatus === "Delivered") {
    res.status(400);
    throw new Error("Order can only be cancelled before shipping");
  }

  order.orderStatus = "Cancelled";
  order.isDelivered = false;
  order.deliveredAt = undefined;

  if (!order.stockRestored) {
    await restoreStockForOrderItems(order.orderItems);
    order.stockRestored = true;
  }

  const updatedOrder = await order.save();

  const orderCode = buildOrderCode(updatedOrder._id);
  await createNotificationSafely({
    type: "order",
    audience: "admin",
    title: "Order Cancelled",
    message: `Order #${orderCode} was cancelled by customer.`,
    orderId: updatedOrder._id,
    userId: updatedOrder.user,
    link: `/admin/orders/${updatedOrder._id}`,
  });

  await createNotificationSafely({
    type: "order",
    audience: "user",
    recipient: updatedOrder.user,
    userId: updatedOrder.user,
    orderId: updatedOrder._id,
    title: "Order Cancelled",
    message: `Order #${orderCode} has been cancelled.`,
    link: `/orders/${updatedOrder._id}`,
  });

  emitOrderUpdated(updatedOrder, { reason: "cancelled" });
  res.json(updatedOrder);
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const shouldRestoreStock =
    !order.stockRestored &&
    ["Pending", "Processing"].includes(order.orderStatus);

  if (shouldRestoreStock) {
    await restoreStockForOrderItems(order.orderItems);
  }

  await order.deleteOne();
  res.json({ message: "Order removed" });
});

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private/Admin
export const getOrderStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ orderStatus: "Pending" });
  const deliveredOrders = await Order.countDocuments({ orderStatus: "Delivered" });

  const revenueData = await Order.aggregate([
    { $match: { paymentStatus: "Paid" } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
  ]);

  const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

  res.json({
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalRevenue,
  });
});
