import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Product from "../models/Product.js";
import Notification from "../models/notificationModel.js";
import {
    shouldSendLowStockAlert,
    syncLowStockAlertFlag,
} from "../utils/stockAlerts.js";
import {
    sendLowStockTelegramAlert,
    sendOrderTelegramAlert,
} from "../utils/sendTelegramMessage.js";

const createHttpError = (statusCode, message) =>
    Object.assign(new Error(message), { statusCode });

const dispatchOrderAlerts = ({
    createdOrder,
    shippingAddress,
    paymentMethod,
    totalPrice,
    orderItems,
    googleMapsLink,
    lowStockAlerts,
}) => {
    setImmediate(async () => {
        try {
            await sendOrderTelegramAlert({
                orderId: createdOrder._id.toString().slice(-8).toUpperCase(),
                customerName: createdOrder.user?.name || shippingAddress.fullName,
                customerPhone: shippingAddress.phone,
                totalPrice,
                paymentMethod,
                itemCount: orderItems.reduce(
                    (totalItems, item) => totalItems + Number(item.quantity || 0),
                    0
                ),
                shippingAddress: [
                    shippingAddress.address,
                    shippingAddress.city,
                    shippingAddress.postalCode,
                    shippingAddress.country,
                ]
                    .filter(Boolean)
                    .join(", "),
                googleMapsLink,
            });
        } catch (telegramError) {
            console.error("Telegram order alert failed:", telegramError.message);
        }

        for (const alert of lowStockAlerts) {
            try {
                await sendLowStockTelegramAlert({
                    title: alert.title,
                    category: alert.category,
                    stock: alert.stock,
                    productId: alert.productId.toString(),
                    imageUrl: alert.imageUrl,
                });

                await Product.updateOne(
                    { _id: alert.productId },
                    { $set: { lowStockAlertSent: true } }
                );
            } catch (telegramError) {
                console.error("Telegram low stock alert failed:", telegramError.message);
            }
        }
    });
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error("No order items");
    } else {
        const session = await mongoose.startSession();
        const lowStockAlerts = [];

        try {
            let createdOrder;

            await session.withTransaction(async () => {
                const productIds = orderItems.map((item) => item.product);
                const products = await Product.find({ _id: { $in: productIds } }).session(session);
                const productMap = new Map(
                    products.map((product) => [product._id.toString(), product])
                );

                for (const item of orderItems) {
                    const product = productMap.get(String(item.product));

                    if (!product) {
                        throw createHttpError(404, `Product not found for item: ${item.name}`);
                    }

                    if (product.stock < item.quantity) {
                        throw createHttpError(
                            409,
                            `${product.title} only has ${product.stock} left, but ${item.quantity} were requested. Please update your cart and try again.`
                        );
                    }
                }

                for (const item of orderItems) {
                    const product = productMap.get(String(item.product));
                    const previousStock = product.stock;
                    product.stock -= item.quantity;
                    product.totalSold = Math.max(
                        0,
                        Number(product.totalSold || 0) + Number(item.quantity || 0)
                    );
                    syncLowStockAlertFlag(product);
                    await product.save({ session });

                    if (
                        shouldSendLowStockAlert({
                            previousStock,
                            currentStock: product.stock,
                            lowStockAlertSent: product.lowStockAlertSent,
                        })
                    ) {
                        lowStockAlerts.push({
                            productId: product._id,
                            title: product.title,
                            category: product.category,
                            stock: product.stock,
                            imageUrl: product.image,
                        });
                    }
                }

                const order = new Order({
                    user: req.user._id,
                    orderItems,
                    shippingAddress,
                    paymentMethod,
                    taxPrice,
                    shippingPrice,
                    totalPrice,
                    stockReduced: true,
                    stockRestored: false,
                });

                [createdOrder] = await Order.create([order], { session });
            });

            await createdOrder.populate("user", "name email");

            let googleMapsLink = "";
            if (shippingAddress.latitude && shippingAddress.longitude) {
                googleMapsLink = `https://www.google.com/maps?q=${shippingAddress.latitude},${shippingAddress.longitude}`;
            }

            const notification = new Notification({
                type: "order",
                title: "New Order Received",
                message: `${createdOrder.user.name} placed a new order #${createdOrder._id.toString().slice(-8).toUpperCase()} for $${totalPrice.toFixed(2)}`,
                orderId: createdOrder._id,
                userId: req.user._id,
                link: `/admin/orders/${createdOrder._id}`,
                googleMapsLink: googleMapsLink,
            });

            await notification.save();

            res.status(201).json(createdOrder);

            dispatchOrderAlerts({
                createdOrder,
                shippingAddress,
                paymentMethod,
                totalPrice,
                orderItems,
                googleMapsLink,
                lowStockAlerts,
            });
        } catch (error) {
            if (!res.headersSent) {
                res.status(error.statusCode || 500).json({
                    message: error.message || "Failed to create order",
                });
                return;
            }

            throw error;
        } finally {
            await session.endSession();
        }
    }
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
    const order = await Order.findById(req.params.id).populate(
        "user",
        "name email"
    );

    if (!order) {
        res.status(404);
        throw new Error("Order not found");
    }

    const isPortalUser = ["admin", "seller", "delivery"].includes(req.user?.role);
    const isOwner = order.user?._id?.toString() === req.user?._id?.toString();

    if (!isPortalUser && !isOwner) {
        res.status(403);
        throw new Error("Not authorized to view this order");
    }

    res.json(order);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();

    try {
        let updatedOrder;

        await session.withTransaction(async () => {
            const order = await Order.findById(req.params.id).session(session);

            if (!order) {
                res.status(404);
                throw new Error("Order not found");
            }

            const nextStatus = req.body.orderStatus || order.orderStatus;
            const previousStatus = order.orderStatus;
            order.orderStatus = nextStatus;

            if (nextStatus === "Delivered") {
                order.isDelivered = true;
                order.deliveredAt = Date.now();
            }

            if (
                nextStatus === "Cancelled" &&
                previousStatus !== "Cancelled" &&
                order.stockReduced &&
                !order.stockRestored
            ) {
                for (const item of order.orderItems) {
                    const product = await Product.findById(item.product).session(session);

                    if (product) {
                        product.stock += item.quantity;
                        product.totalSold = Math.max(
                            0,
                            Number(product.totalSold || 0) - Number(item.quantity || 0)
                        );
                        syncLowStockAlertFlag(product);
                        await product.save({ session });
                    }
                }
                order.stockRestored = true;
            }

            updatedOrder = await order.save({ session });
        });

        res.json(updatedOrder);
    } finally {
        await session.endSession();
    }
});

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment-status
// @access  Private/Admin
export const updatePaymentStatus = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        const { paymentStatus } = req.body;

        // Validate payment status
        const validStatuses = ["Pending", "Paid", "Failed", "Refunded"];
        if (!validStatuses.includes(paymentStatus)) {
            res.status(400);
            throw new Error("Invalid payment status");
        }

        order.paymentStatus = paymentStatus;

        // Update isPaid and paidAt when marked as Paid
        if (paymentStatus === "Paid") {
            order.isPaid = true;
            order.paidAt = Date.now();
        } else if (paymentStatus === "Pending" || paymentStatus === "Failed" || paymentStatus === "Refunded") {
            order.isPaid = false;
            order.paidAt = undefined;
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error("Order not found");
    }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
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
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error("Order not found");
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getUserOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({
        createdAt: -1,
    });
    res.json(orders);
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        await order.deleteOne();
        res.json({ message: "Order removed" });
    } else {
        res.status(404);
        throw new Error("Order not found");
    }
});

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private/Admin
export const getOrderStats = asyncHandler(async (req, res) => {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: "Pending" });
    const deliveredOrders = await Order.countDocuments({
        orderStatus: "Delivered",
    });

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
