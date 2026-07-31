import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Product from "../models/Product.js";
import Notification from "../models/notificationModel.js";
import {
    emitDomainChanged,
    emitNotificationCreated,
    emitOrderCreated,
    emitOrderUpdated,
} from "../realtime/socket.js";
import {
    getInventoryStockAlert,
    getStockAlertTargetStock,
    syncLowStockAlertFlag,
} from "../utils/stockAlerts.js";
import {
    sendOrderTelegramAlert,
    sendOrderReceiptTelegramPhoto,
} from "../utils/sendTelegramMessage.js";
import {
    createStockAlertPayload,
    dispatchInventoryStockAlerts,
} from "../utils/inventoryNotifications.js";
import { createPaymentSuccessNotification } from "../utils/paymentNotifications.js";
import { sendDeliveryReviewRequestEmail } from "../utils/sendEmail.js";
import {
    normalizeSelectedColor,
    getProductImageForColor,
    validateProductColor,
    validateProductSize,
} from "../utils/productOptions.js";
import {
    adjustProductInventory,
    getAvailableStock,
    hasSizeStock,
} from "../utils/productInventory.js";
import {
    calculateFinancialTotals,
    getFinancialSettings,
} from "../utils/financialSettings.js";

const createHttpError = (statusCode, message) =>
    Object.assign(new Error(message), { statusCode });

const resolveOrderItemProductId = (item) =>
    item?.product?._id?.toString?.() || item?.product?.toString?.() || null;

const getOrderInventoryQuantities = (orderItems = []) => {
    const quantityByProductSize = new Map();
    const quantityByProduct = new Map();

    for (const item of orderItems) {
        const productId = String(item.product?._id || item.product);
        const size = String(item.size || "").trim().toUpperCase();
        const color = normalizeSelectedColor(item.color);
        const quantity = Number(item.quantity || 0);
        const inventoryKey = `${productId}::${size}::${color.toLowerCase()}`;

        quantityByProductSize.set(
            inventoryKey,
            {
                productId,
                size,
                color,
                quantity:
                    Number(quantityByProductSize.get(inventoryKey)?.quantity || 0)
                    + quantity,
            }
        );
        quantityByProduct.set(
            productId,
            Number(quantityByProduct.get(productId) || 0) + quantity
        );
    }

    return { quantityByProductSize, quantityByProduct };
};

const stripOrderCostPrices = (order) => {
    const orderData = typeof order?.toObject === "function"
        ? order.toObject()
        : { ...(order || {}) };

    return {
        ...orderData,
        orderItems: Array.isArray(orderData.orderItems)
            ? orderData.orderItems.map((item) => {
                const itemData = typeof item?.toObject === "function"
                    ? item.toObject()
                    : { ...(item || {}) };
                delete itemData.costPrice;
                return itemData;
            })
            : [],
    };
};

const DELIVERY_ORDER_STATUSES = ["Delivered"];
const ORDER_STATUS_SEQUENCE = ["Pending", "Processing", "Delivered"];

const applyOrderStatusTimestamps = (order, nextStatus, now = new Date()) => {
    if (nextStatus === "Processing") {
        order.processedAt = order.processedAt || now;
    }

    if (nextStatus === "Delivered") {
        order.processedAt = order.processedAt || now;
        order.isDelivered = true;
        order.deliveredAt = order.deliveredAt || now;
    }
};

const restoreOrderStockIfNeeded = async (order, session) => {
    if (order.stockReserved) {
        for (const item of order.orderItems) {
            const product = await Product.findById(item.product).session(session);

            if (product) {
                adjustProductInventory(product, {
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    action: "release",
                });
                await product.save({ session });
            }
        }

        order.stockReserved = false;
    }

    if (!order.stockReduced || order.stockRestored) {
        return;
    }

    for (const item of order.orderItems) {
        const product = await Product.findById(item.product).session(session);

        if (product) {
            adjustProductInventory(product, {
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                action: "restore",
            });
            product.totalSold = Math.max(
                0,
                Number(product.totalSold || 0) - Number(item.quantity || 0)
            );
            syncLowStockAlertFlag(product);
            await product.save({ session });
        }
    }

    order.stockRestored = true;
};

const reduceReservedOrderStockIfNeeded = async (order, session) => {
    if (!order.stockReserved || order.stockReduced || order.stockRestored) {
        return { productIds: [], stockAlerts: [] };
    }

    const { quantityByProductSize, quantityByProduct } =
        getOrderInventoryQuantities(order.orderItems);
    const productIds = [
        ...new Set([...quantityByProductSize.values()].map((item) => item.productId)),
    ];
    const products = await Product.find({ _id: { $in: productIds } }).session(session);
    const productById = new Map(
        products.map((product) => [product._id.toString(), product])
    );
    const previousStockByProduct = new Map(
        products.map((product) => {
            const productId = product._id.toString();
            return [
                productId,
                getAvailableStock(product)
                    + Number(quantityByProduct.get(productId) || 0),
            ];
        })
    );
    const previousStockByInventoryKey = new Map();

    for (const [inventoryKey, { productId, size, color, quantity }] of quantityByProductSize) {
        const product = productById.get(productId);
        if (!product) {
            throw createHttpError(409, "A product in this order no longer exists");
        }

        previousStockByInventoryKey.set(
            inventoryKey,
            getStockAlertTargetStock(product, { size, color }) + quantity
        );
    }

    for (const { productId, size, color, quantity } of quantityByProductSize.values()) {
        const product = productById.get(productId);
        adjustProductInventory(product, {
            size,
            color,
            quantity,
            action: "release",
        });
        adjustProductInventory(product, {
            size,
            color,
            quantity,
            action: "reduce",
        });
        product.totalSold = Math.max(
            0,
            Number(product.totalSold || 0) + quantity
        );
    }

    const stockAlerts = [];
    const productAlertIds = new Set();

    for (const [inventoryKey, { productId, size, color }] of quantityByProductSize) {
        const product = productById.get(productId);
        const productHasVariants = hasSizeStock(product);
        if (!productHasVariants && productAlertIds.has(productId)) continue;

        syncLowStockAlertFlag(product);
        const stockAlertDetails = getInventoryStockAlert({
            product,
            previousStock: productHasVariants
                ? previousStockByInventoryKey.get(inventoryKey)
                : previousStockByProduct.get(productId),
            size,
            color,
            requireThresholdCross: false,
        });

        if (stockAlertDetails) {
            stockAlerts.push(
                createStockAlertPayload({
                    product,
                    ...stockAlertDetails,
                })
            );
        }

        if (!productHasVariants) {
            productAlertIds.add(productId);
        }
    }

    for (const productId of productIds) {
        await productById.get(productId).save({ session });
    }

    order.stockReduced = true;
    order.stockReserved = false;
    order.stockRestored = false;

    return { productIds, stockAlerts };
};

const sendAndRecordDeliveryReviewRequest = async (orderId, { force = false } = {}) => {
    const deliveredOrder = await Order.findById(orderId).populate("user", "name email");

    if (!deliveredOrder) {
        throw createHttpError(404, "Order not found");
    }

    if (deliveredOrder.orderStatus !== "Delivered") {
        throw createHttpError(400, "Review request email can only be sent after delivery");
    }

    const customerEmail = deliveredOrder.user?.email;

    if (!customerEmail) {
        throw createHttpError(400, "Customer email is missing");
    }

    if (!force && deliveredOrder.reviewRequestEmail?.sentAt) {
        return {
            sent: false,
            skipped: true,
            reason: "already-sent",
            order: deliveredOrder,
        };
    }

    let emailResult;

    try {
        emailResult = await sendDeliveryReviewRequestEmail({
            email: customerEmail,
            customerName:
                deliveredOrder.user?.name ||
                deliveredOrder.shippingAddress?.fullName,
            orderId: deliveredOrder._id,
            orderItems: deliveredOrder.orderItems,
        });
    } catch (error) {
        const errorMessage = error.message || "Failed to send review request email";
        await Order.updateOne(
            { _id: deliveredOrder._id },
            {
                $set: {
                    "reviewRequestEmail.failedAt": new Date(),
                    "reviewRequestEmail.lastError": errorMessage,
                },
            }
        );
        throw createHttpError(error.statusCode || 500, errorMessage);
    }

    const updatedOrder = await Order.findByIdAndUpdate(
        deliveredOrder._id,
        {
            $set: {
                "reviewRequestEmail.sentAt": new Date(),
                "reviewRequestEmail.messageId": emailResult?.id || "",
            },
            $unset: {
                "reviewRequestEmail.failedAt": "",
                "reviewRequestEmail.lastError": "",
            },
        },
        { new: true }
    ).populate("user", "name email");

    return {
        sent: true,
        skipped: false,
        messageId: emailResult?.id || "",
        order: updatedOrder,
    };
};

const dispatchOrderAlerts = ({
    createdOrder,
    shippingAddress,
    paymentMethod,
    totalPrice,
    orderItems,
    googleMapsLink,
}) => {
    setImmediate(async () => {
        if (paymentMethod !== "BAKONG_KHQR") {
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
                        shippingAddress.street,
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
        }
    });
};

const getOrderItemMergeKey = (item = {}) => [
    String(item.product || ""),
    String(item.size || "").trim().toUpperCase(),
    normalizeSelectedColor(item.color).toLowerCase(),
    Number(item.price || 0).toFixed(2),
    Number(item.costPrice || 0).toFixed(2),
].join("::");

const mergeOrderItems = (currentItems = [], incomingItems = []) => {
    const mergedItems = currentItems.map((item) =>
        typeof item.toObject === "function" ? item.toObject() : { ...item }
    );
    const itemIndexByKey = new Map(
        mergedItems.map((item, index) => [getOrderItemMergeKey(item), index])
    );

    for (const incomingItem of incomingItems) {
        const key = getOrderItemMergeKey(incomingItem);
        const existingIndex = itemIndexByKey.get(key);

        if (existingIndex !== undefined) {
            mergedItems[existingIndex].quantity =
                Number(mergedItems[existingIndex].quantity || 0) + Number(incomingItem.quantity || 0);
        } else {
            itemIndexByKey.set(key, mergedItems.length);
            mergedItems.push({ ...incomingItem });
        }
    }

    return mergedItems;
};

const PENDING_ORDER_MERGE_WINDOW_MS = 30 * 60 * 1000;

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
    } = req.body;
    const subtotal = (orderItems || []).reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
    );
    const financialSettings = await getFinancialSettings();
    const calculatedTotals = calculateFinancialTotals(subtotal, financialSettings);
    const taxPrice = Number(calculatedTotals.taxPrice.toFixed(2));
    const shippingPrice = Number(calculatedTotals.shippingPrice.toFixed(2));
    const calculatedTotalPrice = Number(calculatedTotals.totalPrice.toFixed(2));

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error("No order items");
    } else {
        const session = await mongoose.startSession();
        const shouldReduceStockImmediately = false;

        try {
            let createdOrder;
            let mergedIntoExistingOrder = false;

            await session.withTransaction(async () => {
                const productIds = orderItems.map((item) => item.product);
                const products = await Product.find({ _id: { $in: productIds } })
                    .select("+costPrice")
                    .session(session);
                const productMap = new Map(
                    products.map((product) => [product._id.toString(), product])
                );
                const requestedQuantityByProductSize = new Map();

                for (const item of orderItems) {
                    const productId = String(item.product);
                    const size = String(item.size || "").trim().toUpperCase();
                    const color = normalizeSelectedColor(item.color);
                    const inventoryKey = `${productId}::${size}`;
                    requestedQuantityByProductSize.set(
                        `${inventoryKey}::${color.toLowerCase()}`,
                        {
                            productId,
                            size,
                            color,
                            quantity:
                                Number(requestedQuantityByProductSize.get(`${inventoryKey}::${color.toLowerCase()}`)?.quantity || 0) +
                                Number(item.quantity || 0),
                        }
                    );
                }

                for (const item of orderItems) {
                    const product = productMap.get(String(item.product));

                    if (!product) {
                        throw createHttpError(404, `Product not found for item: ${item.name}`);
                    }

                    const sizeError = validateProductSize(product, item.size);
                    if (sizeError) {
                        throw createHttpError(400, `${product.title}: ${sizeError}`);
                    }
                    const colorError = validateProductColor(product, item.color);
                    if (colorError) {
                        throw createHttpError(400, `${product.title}: ${colorError}`);
                    }
                    item.color = normalizeSelectedColor(item.color);
                    item.image = getProductImageForColor(product, item.color);
                    item.costPrice = Math.max(0, Number(product.costPrice || 0));

                    const size = String(item.size || "").trim().toUpperCase();
                    const color = normalizeSelectedColor(item.color);
                    const requestedQuantity = requestedQuantityByProductSize.get(
                        `${String(item.product)}::${size}::${color.toLowerCase()}`
                    )?.quantity || 0;
                    const availableStock = getAvailableStock(product, size, color);
                    if (availableStock < requestedQuantity) {
                        throw createHttpError(
                            409,
                            `${product.title} only has ${availableStock} left, but ${requestedQuantity} were requested. Please update your cart and try again.`
                        );
                    }
                }

                if (shouldReduceStockImmediately) {
                    for (const { productId, size, color, quantity } of requestedQuantityByProductSize.values()) {
                        const product = productMap.get(productId);
                        const previousStock = getStockAlertTargetStock(product, {
                            size,
                            color,
                        });
                        adjustProductInventory(product, {
                            size,
                            color,
                            quantity,
                            action: "reduce",
                        });
                        product.totalSold = Math.max(
                            0,
                            Number(product.totalSold || 0) + quantity
                        );
                        syncLowStockAlertFlag(product);
                        const stockAlertDetails = getInventoryStockAlert({
                            product,
                            previousStock,
                            size,
                            color,
                        });

                        if (stockAlertDetails) {
                            lowStockAlerts.push(
                                createStockAlertPayload({
                                    product,
                                    ...stockAlertDetails,
                                })
                            );
                        }

                        await product.save({ session });
                    }
                } else {
                    for (const { productId, size, color, quantity } of requestedQuantityByProductSize.values()) {
                        const product = productMap.get(productId);
                        adjustProductInventory(product, {
                            size,
                            color,
                            quantity,
                            action: "reserve",
                        });
                        await product.save({ session });
                    }
                }

                const existingPendingOrder = paymentMethod === "Cash on Delivery"
                    ? await Order.findOne({
                        user: req.user._id,
                        orderStatus: "Pending",
                        paymentStatus: "Pending",
                        paymentMethod,
                        stockReduced: false,
                        stockReserved: true,
                        "receiptSent.sentAt": { $exists: false },
                        createdAt: {
                            $gte: new Date(Date.now() - PENDING_ORDER_MERGE_WINDOW_MS),
                        },
                    })
                        .sort({ createdAt: -1 })
                        .session(session)
                    : null;

                if (existingPendingOrder) {
                    const existingTotalWithoutShipping = Math.max(
                        0,
                        Number(existingPendingOrder.totalPrice || 0)
                            - Math.max(0, Number(existingPendingOrder.shippingPrice || 0))
                    );
                    existingPendingOrder.orderItems = mergeOrderItems(
                        existingPendingOrder.orderItems,
                        orderItems
                    );
                    existingPendingOrder.shippingAddress = shippingAddress;
                    existingPendingOrder.taxPrice =
                        Number(existingPendingOrder.taxPrice || 0) + Number(taxPrice || 0);
                    existingPendingOrder.shippingPrice =
                        shippingPrice;
                    existingPendingOrder.totalPrice =
                        existingTotalWithoutShipping + subtotal + taxPrice + shippingPrice;
                    existingPendingOrder.stockReduced = false;
                    existingPendingOrder.stockReserved = true;
                    existingPendingOrder.stockRestored = false;

                    createdOrder = await existingPendingOrder.save({ session });
                    mergedIntoExistingOrder = true;
                } else {
                    const order = new Order({
                        user: req.user._id,
                        orderItems,
                        shippingAddress,
                        paymentMethod,
                        taxPrice,
                        shippingPrice,
                        totalPrice: calculatedTotalPrice,
                        stockReduced: shouldReduceStockImmediately,
                        stockReserved: !shouldReduceStockImmediately,
                        stockRestored: false,
                    });

                    [createdOrder] = await Order.create([order], { session });
                }
            });

            await createdOrder.populate("user", "name email");

            let googleMapsLink = "";
            if (shippingAddress.latitude && shippingAddress.longitude) {
                googleMapsLink = `https://www.google.com/maps?q=${shippingAddress.latitude},${shippingAddress.longitude}`;
            }

            const customerName =
                createdOrder.user?.name ||
                req.user?.name ||
                shippingAddress.fullName ||
                "Customer";
            let notification = null;

            if (paymentMethod !== "BAKONG_KHQR") {
                try {
                    notification = await Notification.create({
                        type: "order",
                        title: mergedIntoExistingOrder ? "Pending Order Updated" : "New Order Received",
                        message: mergedIntoExistingOrder
                            ? `${customerName} added items to pending order #${createdOrder._id.toString().slice(-8).toUpperCase()}. New total is $${Number(createdOrder.totalPrice || 0).toFixed(2)}`
                            : `${customerName} placed a new order #${createdOrder._id.toString().slice(-8).toUpperCase()} for $${Number(createdOrder.totalPrice || 0).toFixed(2)}`,
                        orderId: createdOrder._id,
                        userId: req.user._id,
                        link: `/admin/orders/${createdOrder._id}`,
                        googleMapsLink: googleMapsLink,
                    });
                } catch (notificationError) {
                    console.error(
                        `Order notification creation failed for ${createdOrder._id}:`,
                        notificationError.message
                    );
                }
            }

            if (paymentMethod === "BAKONG_KHQR") {
                // Bakong orders remain private drafts until payment succeeds.
            } else if (mergedIntoExistingOrder) {
                emitOrderUpdated(createdOrder, {
                    orderStatus: createdOrder.orderStatus,
                    paymentStatus: createdOrder.paymentStatus,
                    orderItems: createdOrder.orderItems,
                    shippingAddress: createdOrder.shippingAddress,
                    taxPrice: createdOrder.taxPrice,
                    shippingPrice: createdOrder.shippingPrice,
                    totalPrice: createdOrder.totalPrice,
                });
            } else {
                emitOrderCreated(createdOrder);
            }
            if (createdOrder.stockReduced || createdOrder.stockReserved) {
                emitDomainChanged(
                    "products",
                    "inventory-updated",
                    {
                        productIds: createdOrder.orderItems.map((item) =>
                            resolveOrderItemProductId(item)
                        ).filter(Boolean),
                    },
                    { users: true }
                );
            }
            if (notification) {
                emitNotificationCreated(notification);
            }

            res.status(mergedIntoExistingOrder ? 200 : 201).json(
                stripOrderCostPrices(createdOrder)
            );

            dispatchOrderAlerts({
                createdOrder,
                shippingAddress,
                paymentMethod,
                totalPrice: createdOrder.totalPrice,
                orderItems: createdOrder.orderItems,
                googleMapsLink,
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
    const ordersQuery = Order.find({
        $or: [
            { paymentMethod: { $ne: "BAKONG_KHQR" } },
            { paymentStatus: "Paid" },
        ],
    })
        .populate("user", "name email")
        .sort({ createdAt: -1 });

    if (req.user?.role === "admin") {
        ordersQuery.select("+orderItems.costPrice");
    }

    const orders = await ordersQuery.lean();
    res.json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
    const orderQuery = Order.findById(req.params.id)
        .populate("user", "name email")
        .populate("orderItems.product", "title titleKm name reviews");

    if (req.user?.role === "admin") {
        orderQuery.select("+orderItems.costPrice");
    }

    const order = await orderQuery;

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

    res.json(req.user?.role === "admin" ? order : stripOrderCostPrices(order));
});

// @desc    Track an order by full ID or displayed short ID
// @route   GET /api/orders/track/:orderNumber
// @access  Private
export const trackOrder = asyncHandler(async (req, res) => {
    const rawOrderNumber = String(req.params.orderNumber || "").trim();
    const normalizedOrderNumber = rawOrderNumber.replace(/^#/, "");

    if (!normalizedOrderNumber) {
        res.status(400);
        throw new Error("Order number is required");
    }

    const query =
        mongoose.Types.ObjectId.isValid(normalizedOrderNumber) &&
        normalizedOrderNumber.length === 24
            ? { _id: normalizedOrderNumber }
            : { user: req.user._id };

    const orders = await Order.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .lean();

    const order = orders.find((candidate) => {
        const fullId = candidate._id.toString();
        return (
            fullId.toLowerCase() === normalizedOrderNumber.toLowerCase() ||
            fullId.slice(-8).toLowerCase() === normalizedOrderNumber.toLowerCase()
        );
    });

    if (!order) {
        res.status(404);
        throw new Error("Order not found");
    }

    const isPortalUser = ["admin", "seller", "delivery"].includes(req.user?.role);
    const isOwner = order.user?._id?.toString() === req.user?._id?.toString();

    if (!isPortalUser && !isOwner) {
        res.status(403);
        throw new Error("Not authorized to track this order");
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
        let previousStatus;
        let committedStockProductIds = [];
        let lowStockAlerts = [];

        await session.withTransaction(async () => {
            const order = await Order.findById(req.params.id).session(session);

            if (!order) {
                res.status(404);
                throw new Error("Order not found");
            }

            const nextStatus = req.body.orderStatus || order.orderStatus;

            if (nextStatus === "Shipped") {
                res.status(400);
                throw new Error("Shipped is no longer an available order status");
            }

            if (nextStatus === "Delivered" && !order.deliveryProof?.imageUrl) {
                res.status(400);
                throw new Error("Please take or upload a delivery proof photo before marking this order as delivered");
            }

            if (order.orderStatus === "Delivered" && nextStatus !== "Delivered") {
                res.status(400);
                throw new Error("Delivered orders are complete and cannot move to an earlier status");
            }

            if (order.orderStatus === "Cancelled" && nextStatus !== "Cancelled") {
                res.status(400);
                throw new Error("Cancelled orders cannot be reopened");
            }

            const currentStatusIndex = ORDER_STATUS_SEQUENCE.indexOf(order.orderStatus);
            const nextStatusIndex = ORDER_STATUS_SEQUENCE.indexOf(nextStatus);
            if (
                currentStatusIndex >= 0 &&
                nextStatusIndex >= 0 &&
                nextStatusIndex < currentStatusIndex
            ) {
                res.status(400);
                throw new Error("Order status cannot move backward");
            }

            if (req.user?.role === "seller") {
                if (
                    order.orderStatus !== "Pending" ||
                    nextStatus !== "Processing"
                ) {
                    res.status(403);
                    throw new Error("Cashier accounts can only confirm pending orders");
                }
            }

            if (
                ["admin", "seller"].includes(req.user?.role) &&
                order.orderStatus === "Pending" &&
                nextStatus === "Processing"
            ) {
                if (
                    order.paymentMethod === "BAKONG_KHQR" &&
                    order.paymentStatus !== "Paid"
                ) {
                    res.status(400);
                    throw new Error("BAKONG payment must be completed before confirming this order");
                }

                if (!order.receiptSent?.sentAt) {
                    res.status(400);
                    throw new Error("Please print/send the receipt before confirming this order");
                }
            }

            if (
                req.user?.role === "delivery" &&
                !DELIVERY_ORDER_STATUSES.includes(nextStatus)
            ) {
                res.status(403);
                throw new Error("Delivery accounts can only update active delivery statuses");
            }

            previousStatus = order.orderStatus;
            order.orderStatus = nextStatus;
            applyOrderStatusTimestamps(order, nextStatus);

            if (
                nextStatus === "Cancelled" &&
                (order.isPaid || order.paymentStatus === "Paid")
            ) {
                res.status(400);
                throw new Error("Paid orders cannot be cancelled");
            }

            if (
                nextStatus === "Cancelled" &&
                previousStatus !== "Cancelled" &&
                (order.stockReserved || (order.stockReduced && !order.stockRestored))
            ) {
                await restoreOrderStockIfNeeded(order, session);
            }

            if (
                previousStatus === "Pending" &&
                nextStatus === "Processing" &&
                order.stockReserved &&
                !order.stockReduced
            ) {
                const stockUpdate = await reduceReservedOrderStockIfNeeded(
                    order,
                    session
                );
                committedStockProductIds = stockUpdate.productIds;
                lowStockAlerts = stockUpdate.stockAlerts;
            }

            updatedOrder = await order.save({ session });
        });

        res.json(updatedOrder);
        emitOrderUpdated(updatedOrder, {
            orderStatus: updatedOrder.orderStatus,
            processedAt: updatedOrder.processedAt,
            shippedAt: updatedOrder.shippedAt,
            deliveredAt: updatedOrder.deliveredAt,
            isDelivered: updatedOrder.isDelivered,
        });
        if (updatedOrder.stockRestored) {
            emitDomainChanged(
                "products",
                "inventory-restored",
                {
                    productIds: updatedOrder.orderItems.map((item) =>
                        resolveOrderItemProductId(item)
                    ).filter(Boolean),
                },
                { users: true }
            );
        }
        if (committedStockProductIds.length > 0) {
            emitDomainChanged(
                "products",
                "inventory-updated",
                { productIds: committedStockProductIds },
                { users: true }
            );
        }
        dispatchInventoryStockAlerts(lowStockAlerts);

        if (
            req.user?.role === "seller" &&
            previousStatus === "Pending" &&
            updatedOrder?.orderStatus === "Processing"
        ) {
            try {
                const notification = await Notification.create({
                    type: "order",
                    title: "Order confirmed for delivery",
                    message: `${req.user.name || "Seller"} confirmed order #${updatedOrder._id.toString().slice(-8).toUpperCase()} for delivery.`,
                    orderId: updatedOrder._id,
                    userId: req.user._id,
                    link: `/delivery/orders/${updatedOrder._id}`,
                });

                emitNotificationCreated(notification);
            } catch (notificationError) {
                console.error("Delivery handoff notification failed:", notificationError.message);
            }
        }

        if (
            req.user?.role === "delivery" &&
            previousStatus !== "Delivered" &&
            updatedOrder?.orderStatus === "Delivered"
        ) {
            setImmediate(async () => {
                try {
                    const result = await sendAndRecordDeliveryReviewRequest(updatedOrder._id);
                    if (result.skipped) {
                        console.log(
                            `Skipped review request email for order ${updatedOrder._id}: ${result.reason}`
                        );
                    }
                } catch (emailError) {
                    console.error("Review request email failed:", emailError.message);
                }
            });
        }
    } finally {
        await session.endSession();
    }
});

// @desc    Cancel own order before seller confirmation
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelUserOrder = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();

    try {
        let updatedOrder;

        await session.withTransaction(async () => {
            const order = await Order.findById(req.params.id).session(session);

            if (!order) {
                res.status(404);
                throw new Error("Order not found");
            }

            if (order.user.toString() !== req.user._id.toString()) {
                res.status(403);
                throw new Error("Not authorized to cancel this order");
            }

            if (order.orderStatus !== "Pending") {
                res.status(400);
                throw new Error("Orders can only be cancelled before the seller confirms them");
            }

            if (
                order.paymentMethod === "BAKONG_KHQR"
                && (order.isPaid || order.paymentStatus === "Paid")
            ) {
                res.status(400);
                throw new Error("Paid Bakong KHQR orders cannot be cancelled");
            }

            order.orderStatus = "Cancelled";
            await restoreOrderStockIfNeeded(order, session);
            updatedOrder = await order.save({ session });
        });

        res.json(updatedOrder);
        emitOrderUpdated(updatedOrder, {
            orderStatus: updatedOrder.orderStatus,
            stockRestored: updatedOrder.stockRestored,
        });
        emitDomainChanged(
            "products",
            "inventory-restored",
            {
                productIds: updatedOrder.orderItems.map((item) =>
                    resolveOrderItemProductId(item)
                ).filter(Boolean),
            },
            { users: true }
        );
    } finally {
        await session.endSession();
    }
});

// @desc    Send or resend delivery review request email
// @route   POST /api/orders/:id/review-request-email
// @access  Private/Portal
export const sendOrderReviewRequestEmail = asyncHandler(async (req, res) => {
    const force = req.body?.force !== false;
    const result = await sendAndRecordDeliveryReviewRequest(req.params.id, { force });

    res.json({
        message: result.sent
            ? "Review request email sent"
            : "Review request email was already sent",
        sent: result.sent,
        skipped: result.skipped,
        reason: result.reason,
        messageId: result.messageId,
        order: result.order,
    });
});

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment-status
// @access  Private/Admin/Delivery
export const updatePaymentStatus = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        const { paymentStatus } = req.body;
        const wasPaid = order.isPaid || order.paymentStatus === "Paid";

        if (req.user?.role === "seller") {
            res.status(403);
            throw new Error("Seller accounts cannot update payment status");
        }

        // Validate payment status
        const validStatuses = ["Pending", "Paid", "Failed", "Refunded"];
        if (!validStatuses.includes(paymentStatus)) {
            res.status(400);
            throw new Error("Invalid payment status");
        }

        if (
            req.user?.role === "delivery" &&
            (paymentStatus !== "Paid" || order.paymentMethod !== "Cash on Delivery")
        ) {
            res.status(403);
            throw new Error("Delivery accounts can only mark cash on delivery orders as paid");
        }

        order.paymentStatus = paymentStatus;

        // Update isPaid and paidAt when marked as Paid
        if (paymentStatus === "Paid") {
            order.isPaid = true;
            order.paidAt = order.paidAt || Date.now();
        } else if (paymentStatus === "Pending" || paymentStatus === "Failed" || paymentStatus === "Refunded") {
            order.isPaid = false;
            order.paidAt = undefined;
        }

        const updatedOrder = await order.save();
        await updatedOrder.populate("user", "name email");

        if (
            !wasPaid &&
            updatedOrder.paymentStatus === "Paid" &&
            updatedOrder.paymentMethod === "Cash on Delivery"
        ) {
            try {
                await createPaymentSuccessNotification(updatedOrder);
            } catch (notificationError) {
                console.error(
                    `Cash on Delivery payment notification failed for ${updatedOrder._id}:`,
                    notificationError.message
                );
            }
        }

        res.json(updatedOrder);
        emitOrderUpdated(updatedOrder, {
            paymentStatus: updatedOrder.paymentStatus,
            isPaid: updatedOrder.isPaid,
            paidAt: updatedOrder.paidAt,
        });
    } else {
        res.status(404);
        throw new Error("Order not found");
    }
});

// @desc    Upload delivery proof photo
// @route   PUT /api/orders/:id/delivery-proof
// @access  Private/Portal
export const uploadDeliveryProof = asyncHandler(async (req, res) => {
    if (req.user?.role !== "delivery" && req.user?.role !== "admin") {
        res.status(403);
        throw new Error("Only delivery or admin accounts can upload delivery proof");
    }

    if (!req.file?.path) {
        res.status(400);
        throw new Error("Delivery proof photo is required");
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error("Order not found");
    }

    order.deliveryProof = {
        imageUrl: req.file.path,
        uploadedAt: Date.now(),
        uploadedBy: req.user._id,
        publicId: req.file.filename,
    };

    const updatedOrder = await order.save();

    const notification = await Notification.create({
        type: "order",
        title: "Delivery proof uploaded",
        message: `${req.user.name || "Delivery rider"} uploaded proof photo for order #${updatedOrder._id.toString().slice(-8).toUpperCase()}.`,
        orderId: updatedOrder._id,
        userId: req.user._id,
        link: `/admin/orders/${updatedOrder._id}`,
    });

    emitOrderUpdated(updatedOrder, {
        deliveryProof: updatedOrder.deliveryProof,
    });
    emitNotificationCreated(notification);

    res.json(updatedOrder);
});

// @desc    Send order receipt image to Telegram
// @route   POST /api/orders/:id/receipt-telegram
// @access  Private/Portal
export const sendOrderReceiptToTelegram = asyncHandler(async (req, res) => {
    if (!req.file?.buffer) {
        res.status(400);
        throw new Error("Receipt image is required");
    }

    if (!["admin", "seller"].includes(req.user?.role)) {
        res.status(403);
        throw new Error("Only admin or seller accounts can send order receipts to Telegram");
    }

    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
        res.status(404);
        throw new Error("Order not found");
    }

    const shouldResend =
        req.query?.resend === "true" ||
        req.body?.resend === "true" ||
        req.body?.resend === true;
    const previousReceiptSent = order.receiptSent?.sentAt
        ? order.receiptSent.toObject?.() || order.receiptSent
        : null;

    if (order.receiptSent?.sentAt && !shouldResend) {
        return res.json({
            message: "Receipt was already sent to Telegram",
            telegram: { sent: true, type: "photo", alreadySent: true },
            order,
        });
    }

    const receiptSent = {
        sentAt: new Date(),
        sentBy: req.user._id,
        channel: "telegram",
    };

    const updatedOrder = await Order.findByIdAndUpdate(
        order._id,
        { $set: { receiptSent } },
        { new: true }
    );

    if (!updatedOrder) {
        res.status(404);
        throw new Error("Order not found");
    }

    await updatedOrder.populate("user", "name email");

    let result;

    try {
        result = await sendOrderReceiptTelegramPhoto({
            imageBuffer: req.file.buffer,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            orderId: order._id.toString().slice(-8).toUpperCase(),
            customerName: order.shippingAddress?.fullName || order.user?.name,
            customerPhone: order.shippingAddress?.phone,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            orderItems: order.orderItems,
            totalPrice: order.totalPrice,
        });

        if (!result.sent) {
            res.status(503);
            throw new Error("Telegram receipt bot is not configured");
        }
    } catch (error) {
        try {
            if (previousReceiptSent) {
                await Order.findByIdAndUpdate(order._id, {
                    $set: { receiptSent: previousReceiptSent },
                });
            } else {
                await Order.findByIdAndUpdate(order._id, { $unset: { receiptSent: "" } });
            }
        } catch (rollbackError) {
            console.error(
                `Receipt Telegram send failed and receipt rollback failed for order ${order._id}:`,
                rollbackError.message
            );
        }
        throw error;
    }

    emitOrderUpdated(updatedOrder, {
        receiptSent: updatedOrder.receiptSent,
    });

    res.json({
        message: shouldResend ? "Receipt resent to Telegram" : "Receipt sent to Telegram",
        telegram: { ...result, resent: shouldResend },
        order: updatedOrder,
    });
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
        emitOrderUpdated(updatedOrder, {
            paymentStatus: updatedOrder.paymentStatus,
            isPaid: updatedOrder.isPaid,
            paidAt: updatedOrder.paidAt,
        });
    } else {
        res.status(404);
        throw new Error("Order not found");
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getUserOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id })
        .populate("orderItems.product", "title titleKm warrantyPeriodDays")
        .sort({ createdAt: -1 })
        .lean();
    res.json(orders);
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        if (order.isPaid || order.paymentStatus === "Paid") {
            res.status(400);
            throw new Error("Paid orders cannot be removed");
        }

        const userId = order.user;
        await order.deleteOne();
        emitDomainChanged(
            "orders",
            "deleted",
            { orderId: order._id, userId },
            { roles: ["admin", "seller", "delivery"], userId }
        );
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
