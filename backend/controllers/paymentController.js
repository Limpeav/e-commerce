import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import Product from "../models/Product.js";
import QRCode from "qrcode";
import crypto from "crypto";
import khqrPackage from "bakong-khqr";
import {
    emitDomainChanged,
    emitOrderCreated,
} from "../realtime/socket.js";
import {
    getInventoryStockAlert,
    getStockAlertTargetStock,
    syncLowStockAlertFlag,
} from "../utils/stockAlerts.js";
import {
    createStockAlertPayload,
    dispatchInventoryStockAlerts,
} from "../utils/inventoryNotifications.js";
import { createPaymentSuccessNotification } from "../utils/paymentNotifications.js";
import {
    adjustProductInventory,
    getAvailableStock,
    hasSizeStock,
} from "../utils/productInventory.js";
import {
    sendOrderTelegramAlert,
    sendPaymentTelegramAlert,
} from "../utils/sendTelegramMessage.js";
import { normalizeSelectedColor } from "../utils/productOptions.js";
import axios from "axios";
import { getBakongConfig } from "../config/bakong.js";
import { getFinancialSettings } from "../utils/financialSettings.js";

const { BakongKHQR, IndividualInfo, MerchantInfo, khqrData } = khqrPackage;
const KHQR_EXPIRY_MS = 5 * 60 * 1000;
const BAKONG_DEEP_LINK_TIMEOUT_MS = 10000;
const BAKONG_AUTHORIZATION_COOLDOWN_MS = 60 * 1000;
const BAKONG_RETRY_DELAYS_MS = [
    60 * 1000,
    2 * 60 * 1000,
    5 * 60 * 1000,
    15 * 60 * 1000,
];
const reconciliationByPayment = new Map();
const reconciliationBackoffByPayment = new Map();
let bakongAuthorizationBlockedUntil = 0;
let bakongAuthorizationErrorLoggedAt = 0;

const getWebhookSignature = (headers = {}) =>
    headers["x-bakong-signature"]
    || headers["x-webhook-signature"]
    || headers["x-signature"]
    || "";

const verifyWebhookSignature = (req) => {
    const secret = process.env.BAKONG_WEBHOOK_SECRET;
    const signature = getWebhookSignature(req.headers);

    if (!secret || !signature || !req.rawBody) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(req.rawBody)
        .digest("hex");

    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature, "hex"),
            Buffer.from(expectedSignature, "hex")
        );
    } catch {
        return false;
    }
};

const getOrderId = (orderRef) => orderRef?._id || orderRef;

const dispatchPaidOrderTelegramAlert = (orderId) => {
    setImmediate(async () => {
        let claimedOrderId;
        let claimedSentAt;

        try {
            const sentAt = new Date();
            const order = await Order.findOneAndUpdate(
                {
                    _id: orderId,
                    paymentMethod: "BAKONG_KHQR",
                    paymentStatus: "Paid",
                    "sellerTelegramAlert.sentAt": { $exists: false },
                },
                { $set: { "sellerTelegramAlert.sentAt": sentAt } },
                { new: true }
            ).populate("user", "name");

            if (!order) {
                return;
            }

            claimedOrderId = order._id;
            claimedSentAt = sentAt;
            const shippingAddress = order.shippingAddress || {};
            const googleMapsLink =
                shippingAddress.latitude && shippingAddress.longitude
                    ? `https://www.google.com/maps?q=${shippingAddress.latitude},${shippingAddress.longitude}`
                    : "";
            const result = await sendOrderTelegramAlert({
                orderId: order._id.toString().slice(-8).toUpperCase(),
                customerName: order.user?.name || shippingAddress.fullName,
                customerPhone: shippingAddress.phone,
                totalPrice: order.totalPrice,
                paymentMethod: order.paymentMethod,
                paymentStatus: "Paid",
                itemCount: order.orderItems.reduce(
                    (total, item) => total + Number(item.quantity || 0),
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

            if (!result.sent) {
                await Order.updateOne(
                    { _id: order._id, "sellerTelegramAlert.sentAt": sentAt },
                    { $unset: { sellerTelegramAlert: "" } }
                );
            }
        } catch (error) {
            if (claimedOrderId && claimedSentAt) {
                await Order.updateOne(
                    {
                        _id: claimedOrderId,
                        "sellerTelegramAlert.sentAt": claimedSentAt,
                    },
                    { $unset: { sellerTelegramAlert: "" } }
                ).catch((rollbackError) => {
                    console.error(
                        "Paid order Telegram alert rollback failed:",
                        rollbackError.message
                    );
                });
            }
            console.error("Paid order Telegram alert failed:", error.message);
        }
    });
};

const dispatchPaidPaymentTelegramAlert = (paymentId) => {
    setImmediate(async () => {
        let claimedPaymentId;
        let claimedSentAt;

        try {
            const sentAt = new Date();
            const payment = await Payment.findOneAndUpdate(
                {
                    _id: paymentId,
                    paymentMethod: "BAKONG_KHQR",
                    status: "Completed",
                    "telegramAlert.sentAt": { $exists: false },
                },
                { $set: { "telegramAlert.sentAt": sentAt } },
                { new: true }
            ).populate({
                path: "order",
                populate: { path: "user", select: "name" },
            });

            if (!payment) {
                return;
            }

            claimedPaymentId = payment._id;
            claimedSentAt = sentAt;
            const order = payment.order;
            const result = await sendPaymentTelegramAlert({
                orderId: order?._id?.toString().slice(-8).toUpperCase(),
                customerName:
                    order?.user?.name || order?.shippingAddress?.fullName,
                amount: payment.amount,
                currency: payment.currency,
                transactionId:
                    payment.paymentResult?.transactionId
                    || payment.khqrData?.transactionId,
                paymentTime:
                    payment.paymentResult?.paymentTime || payment.completedAt,
            });

            if (!result.sent) {
                await Payment.updateOne(
                    { _id: payment._id, "telegramAlert.sentAt": sentAt },
                    { $unset: { telegramAlert: "" } }
                );
            }
        } catch (error) {
            if (claimedPaymentId && claimedSentAt) {
                await Payment.updateOne(
                    {
                        _id: claimedPaymentId,
                        "telegramAlert.sentAt": claimedSentAt,
                    },
                    { $unset: { telegramAlert: "" } }
                ).catch((rollbackError) => {
                    console.error(
                        "Paid payment Telegram alert rollback failed:",
                        rollbackError.message
                    );
                });
            }
            console.error("Paid payment Telegram alert failed:", error.message);
        }
    });
};

const restoreCancelledOrder = async (order, session) => {
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

    if (order.stockRestored) {
        return;
    }

    if (order.stockReduced && !order.stockRestored) {
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
    }

    let cart = await Cart.findOne({ user: order.user }).session(session);

    if (!cart) {
        cart = new Cart({ user: order.user, items: [] });
    }

    for (const item of order.orderItems) {
        const productId = item.product?._id || item.product;
        const size = String(item.size || "").trim().toUpperCase();
        const existingItem = cart.items.find(
            (cartItem) =>
                cartItem.product.toString() === productId.toString()
                && String(cartItem.size || "").trim().toUpperCase() === size
        );

        if (existingItem) {
            // KHQR checkout keeps the customer's cart until payment succeeds.
            // Ensure the cancelled order quantity is present without adding the
            // same items a second time when the customer returns to checkout.
            existingItem.quantity = Math.max(
                Number(existingItem.quantity || 0),
                Number(item.quantity || 0)
            );
        } else {
            cart.items.push({
                product: productId,
                quantity: Number(item.quantity || 0),
                size,
            });
        }
    }

    await cart.save({ session });
};

const checkBakongTransaction = async (payment) => {
    const config = getBakongConfig();

    if (!config.token || !payment.khqrData?.qrString) {
        return { checked: false, paid: false, data: null };
    }

    if (Date.now() < bakongAuthorizationBlockedUntil) {
        return {
            checked: false,
            paid: false,
            data: null,
            authorizationBlocked: true,
        };
    }

    const md5 = crypto
        .createHash("md5")
        .update(payment.khqrData.qrString)
        .digest("hex");

    let response;
    try {
        response = await axios.post(
            `${config.apiBaseUrl}/v1/check_transaction_by_md5`,
            { md5 },
            {
                headers: {
                    Authorization: `Bearer ${config.token}`,
                    "Content-Type": "application/json",
                },
                timeout: 8000,
            }
        );
    } catch (error) {
        const status = error.response?.status;

        if (status === 401 || status === 403) {
            const now = Date.now();
            bakongAuthorizationBlockedUntil =
                now + BAKONG_AUTHORIZATION_COOLDOWN_MS;

            if (
                now - bakongAuthorizationErrorLoggedAt
                >= BAKONG_AUTHORIZATION_COOLDOWN_MS
            ) {
                bakongAuthorizationErrorLoggedAt = now;
                const responseData = error.response?.data;
                const responseMessage =
                    responseData?.responseMessage
                    || responseData?.message
                    || responseData?.error
                    || (typeof responseData === "string" ? responseData : "")
                    || "No response message";

                console.error(
                    `Bakong authorization rejected with HTTP ${status}: ${responseMessage}. `
                    + "Verify the Render BAKONG_TOKEN diagnostic; if it matches local, "
                    + "Bakong must allow Render's outbound IP ranges."
                );
            }

            return {
                checked: false,
                paid: false,
                data: null,
                authorizationBlocked: true,
            };
        }

        throw error;
    }

    return {
        checked: true,
        paid: Number(response.data?.responseCode) === 0,
        data: response.data?.data || null,
    };
};

const generateBakongDeepLink = async (qrString, config = getBakongConfig()) => {
    if (!config.deepLinkUrl || !qrString) {
        return "";
    }

    try {
        const response = await axios.post(
            config.deepLinkUrl,
            { qr: qrString },
            {
                headers: { "Content-Type": "application/json" },
                timeout: BAKONG_DEEP_LINK_TIMEOUT_MS,
            }
        );
        const shortLink = String(response.data?.data?.shortLink || "").trim();

        if (!shortLink) {
            console.warn(
                "Bakong deep-link API did not return a shortLink:",
                response.data?.errorCode ?? response.data?.responseCode ?? "unknown"
            );
            return "";
        }

        const parsedShortLink = new URL(shortLink);
        if (!["https:", "http:"].includes(parsedShortLink.protocol)) {
            console.warn("Bakong deep-link API returned an unsupported URL");
            return "";
        }

        return parsedShortLink.toString();
    } catch (error) {
        console.warn(
            "Bakong deep-link generation unavailable; QR scanning remains enabled:",
            error.response?.data?.message
            || error.response?.data?.errorCode
            || error.code
            || error.message
        );
        return "";
    }
};

const reducePaidOrderStockIfNeeded = async (order, session) => {
    if (order.stockReduced) {
        return { productIds: [], stockAlerts: [] };
    }

    const quantityByProductSize = new Map();
    const quantityByProduct = new Map();
    for (const item of order.orderItems) {
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

    const productIds = [...new Set([...quantityByProductSize.values()].map((item) => item.productId))];
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
                    + (order.stockReserved ? Number(quantityByProduct.get(productId) || 0) : 0),
            ];
        })
    );
    const previousStockByInventoryKey = new Map();

    for (const [inventoryKey, { productId, size, color, quantity }] of quantityByProductSize) {
        const product = productById.get(productId);
        if (!product) continue;

        previousStockByInventoryKey.set(
            inventoryKey,
            getStockAlertTargetStock(product, { size, color })
                + (order.stockReserved ? quantity : 0)
        );
    }

    for (const { productId, size, color, quantity } of quantityByProductSize.values()) {
        const product = productById.get(productId);
        if (!product) {
            throw Object.assign(
                new Error("A product in this paid order no longer exists"),
                { statusCode: 409 }
            );
        }

        const availableStock = order.stockReserved
            ? getAvailableStock(
                {
                    ...product.toObject(),
                    reservedStock: 0,
                    sizeStocks: product.sizeStocks?.map((entry) => ({
                        ...(typeof entry.toObject === "function" ? entry.toObject() : entry),
                        reservedStock: 0,
                    })),
                },
                size,
                color
            )
            : getAvailableStock(product, size, color);
        if (availableStock < quantity) {
            throw Object.assign(
                new Error(
                    `${product.title} only has ${availableStock} left, but the paid order requires ${quantity}`
                ),
                { statusCode: 409 }
            );
        }
    }

    for (const { productId, size, color, quantity } of quantityByProductSize.values()) {
        const product = productById.get(productId);
        if (order.stockReserved) {
            adjustProductInventory(product, {
                size,
                color,
                quantity,
                action: "release",
            });
        }
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
        const product = productById.get(productId);
        await product.save({ session });
    }

    order.stockReduced = true;
    order.stockReserved = false;
    order.stockRestored = false;
    return { productIds, stockAlerts };
};

const completeBakongPayment = async (payment, transactionData = {}) => {
    const orderId = getOrderId(payment.order);
    const completedAt = new Date();
    const transactionId = payment.khqrData?.transactionId;
    const session = await mongoose.startSession();
    let completedPayment;
    let paidOrder;
    let updatedProductIds = [];
    let stockAlerts = [];

    try {
        await session.withTransaction(async () => {
            completedPayment = await Payment.findOne({
                _id: payment._id,
                status: "Pending",
            }).session(session);

            if (!completedPayment) {
                return;
            }

            paidOrder = await Order.findById(orderId).session(session);

            if (!paidOrder) {
                throw new Error("Order not found for Bakong payment");
            }

            const stockUpdate = await reducePaidOrderStockIfNeeded(
                paidOrder,
                session
            );
            updatedProductIds = stockUpdate.productIds;
            stockAlerts = stockUpdate.stockAlerts;

            completedPayment.status = "Completed";
            completedPayment.completedAt = completedAt;
            completedPayment.paymentResult = {
                transactionId,
                ackId: transactionData.hash || transactionData.ackId || "",
                payerName:
                    transactionData.fromAccountId
                    || transactionData.payerName
                    || "Bakong User",
                payerAccount:
                    transactionData.fromAccountId
                    || transactionData.payerAccount
                    || "",
                paymentTime: transactionData.acknowledgedDateMs
                    ? new Date(transactionData.acknowledgedDateMs)
                    : completedAt,
                responseCode: "00",
                responseMessage: "Payment successful (verified via Bakong API)",
            };

            paidOrder.isPaid = true;
            paidOrder.paidAt = paidOrder.paidAt || completedAt;
            paidOrder.paymentStatus = "Paid";
            paidOrder.paymentResult = {
                ...paidOrder.paymentResult,
                id: transactionId,
                status: "Completed",
                update_time: completedAt.toISOString(),
            };

            await paidOrder.save({ session });
            await completedPayment.save({ session });
        });
    } finally {
        await session.endSession();
    }

    if (completedPayment?.status === "Completed" && paidOrder) {
        await paidOrder.populate("user", "name email");

        try {
            await createPaymentSuccessNotification(paidOrder);
        } catch (notificationError) {
            console.error(
                `KHQR payment notification creation failed for ${paidOrder._id}:`,
                notificationError.message
            );
        }

        if (updatedProductIds.length > 0) {
            emitDomainChanged(
                "products",
                "inventory-updated",
                { productIds: updatedProductIds },
                { users: true }
            );
        }
        emitOrderCreated(paidOrder);
        dispatchInventoryStockAlerts(stockAlerts);
        dispatchPaidOrderTelegramAlert(paidOrder._id);
        dispatchPaidPaymentTelegramAlert(completedPayment._id);
        emitDomainChanged(
            "payments",
            "completed",
            { paymentId: completedPayment._id, orderId },
            { roles: ["admin", "seller"], userId: completedPayment.user }
        );
    }

    return completedPayment || Payment.findById(payment._id);
};

const expireBakongPayment = async (payment) => {
    // Expiry is a client-side state. Keep the draft pending so the customer
    // can generate a fresh QR for the same order without notifying admin.
    return payment;
};

const performBakongReconciliation = async (paymentRef) => {
    const payment = typeof paymentRef?.save === "function"
        ? paymentRef
        : await Payment.findById(paymentRef);

    if (!payment || payment.status !== "Pending") {
        return payment;
    }

    const verification = await checkBakongTransaction(payment);

    if (verification.paid) {
        return completeBakongPayment(payment, verification.data);
    }

    const isExpired =
        payment.khqrData?.expiresAt
        && new Date(payment.khqrData.expiresAt).getTime() <= Date.now();

    if (verification.checked && isExpired) {
        return expireBakongPayment(payment);
    }

    return payment;
};

export const reconcileBakongPayment = async (paymentRef) => {
    const paymentId = String(paymentRef?._id || paymentRef || "");

    if (!paymentId) {
        return null;
    }

    const activeReconciliation = reconciliationByPayment.get(paymentId);
    if (activeReconciliation) {
        return activeReconciliation;
    }

    const reconciliation = performBakongReconciliation(paymentRef)
        .finally(() => {
            if (reconciliationByPayment.get(paymentId) === reconciliation) {
                reconciliationByPayment.delete(paymentId);
            }
        });

    reconciliationByPayment.set(paymentId, reconciliation);
    return reconciliation;
};

export const reconcilePendingBakongPayments = async ({
    batchSize,
    lookbackMs,
} = {}) => {
    const config = getBakongConfig();
    const effectiveBatchSize = batchSize || config.reconciliationBatchSize;
    const effectiveLookbackMs = lookbackMs || config.reconciliationLookbackMs;
    const reconciliationCutoff = new Date(Date.now() - effectiveLookbackMs);
    const payments = await Payment.find({
        paymentMethod: "BAKONG_KHQR",
        status: "Pending",
        "khqrData.qrString": { $exists: true, $ne: "" },
        // Continue checking recently expired QR attempts. A production host can
        // sleep or restart while the customer pays, and Bakong confirmation may
        // therefore be observed after the QR's display timer has elapsed.
        "khqrData.expiresAt": { $gt: reconciliationCutoff },
    })
        .sort({ createdAt: 1 })
        // Fetch extra candidates because some may currently be deferred by
        // temporary per-payment API backoff.
        .limit(Math.min(100, effectiveBatchSize * 4));
    const summary = {
        checked: 0,
        completed: 0,
        expired: 0,
        failed: 0,
        deferred: 0,
    };
    let attempted = 0;

    for (const payment of payments) {
        const paymentId = payment._id.toString();
        const backoff = reconciliationBackoffByPayment.get(paymentId);

        if (backoff?.nextRetryAt > Date.now()) {
            summary.deferred += 1;
            continue;
        }

        if (attempted >= effectiveBatchSize) {
            break;
        }

        attempted += 1;

        try {
            const updatedPayment = await reconcileBakongPayment(payment);
            reconciliationBackoffByPayment.delete(paymentId);
            summary.checked += 1;

            if (updatedPayment?.status === "Completed") {
                summary.completed += 1;
            } else if (updatedPayment?.status === "Cancelled") {
                summary.expired += 1;
            }
        } catch (error) {
            summary.failed += 1;
            const previousFailures = backoff?.failures || 0;
            const failures = previousFailures + 1;
            const retryDelayMs = BAKONG_RETRY_DELAYS_MS[
                Math.min(failures - 1, BAKONG_RETRY_DELAYS_MS.length - 1)
            ];
            const nextRetryAt = Date.now() + retryDelayMs;

            reconciliationBackoffByPayment.set(paymentId, {
                failures,
                nextRetryAt,
            });

            console.error(
                `Bakong reconciliation failed for payment ${payment._id}; `
                + `retrying in ${Math.round(retryDelayMs / 60000)} minute(s):`,
                error.response?.status
                    ? `HTTP ${error.response.status}`
                    : error.message
            );
        }
    }

    return summary;
};

// @desc    Generate BAKONG KHQR code for payment
// @route   POST /api/payments/bakong/generate
// @access  Private
export const generateBakongQR = asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    const requestedCurrency = String(req.body.currency || "USD").toUpperCase();
    const bakongConfig = getBakongConfig();

    if (!bakongConfig.enabled) {
        res.status(503);
        throw new Error("Bakong payments are temporarily unavailable");
    }

    if (!["USD", "KHR"].includes(requestedCurrency)) {
        res.status(400);
        throw new Error("Payment currency must be USD or KHR");
    }

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error("Order not found");
    }

    // Verify order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error("Not authorized to access this order");
    }

    if (order.isPaid || order.paymentStatus === "Paid") {
        const completedPayment = await Payment.findOne({
            order: orderId,
            status: "Completed",
        }).sort({ completedAt: -1, createdAt: -1 });

        if (completedPayment) {
            return res.json(completedPayment);
        }

        res.status(409);
        throw new Error("This order has already been paid");
    }

    // Check if payment already exists for this order
    let payment = await Payment.findOne({ order: orderId, status: "Pending" });

    if (payment) {
        // Check the previous QR before replacing it. This prevents a delayed
        // bank confirmation from being lost when the customer requests a new
        // QR immediately after the display timer expires.
        try {
            payment = await reconcileBakongPayment(payment);
        } catch (error) {
            console.error(
                `Bakong pre-regeneration check failed for payment ${payment._id}:`,
                error.message
            );
        }

        if (payment?.status === "Completed") {
            return res.json(payment);
        }

        // Return existing payment if still valid
        const existingQr = payment.khqrData?.qrString;
        const expectedNotePrefix = `KHQR amount: ${payment.amount} ${requestedCurrency}`;
        const remainingTime = payment.khqrData?.expiresAt
            ? new Date(payment.khqrData.expiresAt).getTime() - Date.now()
            : 0;
        if (
            payment.currency === requestedCurrency
            && payment.metadata?.notes?.startsWith(expectedNotePrefix)
            && remainingTime > 0
            && remainingTime <= KHQR_EXPIRY_MS
            && existingQr
            && BakongKHQR.verify(existingQr).isValid
        ) {
            if (
                !payment.khqrData?.deepLink
                && !payment.khqrData?.deepLinkAttemptedAt
                && bakongConfig.deepLinkUrl
            ) {
                payment.khqrData.deepLinkAttemptedAt = new Date();
                payment.khqrData.deepLink = await generateBakongDeepLink(
                    existingQr,
                    bakongConfig
                );
                await payment.save();
            }
            return res.json(payment);
        }
    }

    // Generate unique transaction ID
    const transactionId = `TXN${Date.now()}${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const accountId = bakongConfig.accountId;
    const merchantName = bakongConfig.accountUsername;
    const merchantCity = bakongConfig.merchantCity;
    const mobileNumber = bakongConfig.phoneNumber;

    if (!accountId || !accountId.includes("@")) {
        res.status(500);
        throw new Error("BAKONG_ACCOUNT_ID is missing or invalid");
    }

    const financialSettings = await getFinancialSettings();
    const exchangeRate = financialSettings.usdToKhrRate || bakongConfig.exchangeRate;
    const amountInKHR = Math.round(order.totalPrice * exchangeRate);
    const paymentAmount =
        requestedCurrency === "KHR"
            ? amountInKHR
            : Number(Number(order.totalPrice).toFixed(2));
    const khqrCurrency =
        requestedCurrency === "KHR"
            ? khqrData.currency.khr
            : khqrData.currency.usd;
    const expiresAt = new Date(Date.now() + KHQR_EXPIRY_MS);
    const accountType = bakongConfig.accountType;
    const merchantId = bakongConfig.merchantId;
    const acquiringBank = bakongConfig.acquiringBank;
    const optionalData = {
        currency: khqrCurrency,
        amount: paymentAmount,
        billNumber: order._id.toString(),
        mobileNumber: mobileNumber || undefined,
        storeLabel: merchantName,
        terminalLabel: "WEB",
        expirationTimestamp: expiresAt.getTime(),
    };

    if (!["INDIVIDUAL", "MERCHANT"].includes(accountType)) {
        res.status(500);
        throw new Error("BAKONG_ACCOUNT_TYPE must be INDIVIDUAL or MERCHANT");
    }

    if (
        accountType === "MERCHANT"
        && (!merchantId || !acquiringBank || merchantId === "MERCHANT001")
    ) {
        res.status(500);
        throw new Error(
            "Real BAKONG_MERCHANT_ID and BAKONG_ACQUIRING_BANK values are required for merchant KHQR"
        );
    }

    const khqr = new BakongKHQR();
    const khqrResponse = accountType === "MERCHANT"
        ? khqr.generateMerchant(
            new MerchantInfo(
                accountId,
                merchantName,
                merchantCity,
                merchantId,
                acquiringBank,
                optionalData
            )
        )
        : khqr.generateIndividual(
            new IndividualInfo(
                accountId,
                merchantName,
                merchantCity,
                optionalData
            )
        );
    const khqrString = khqrResponse?.data?.qr;

    if (
        khqrResponse?.status?.code !== 0
        || !khqrString
        || !BakongKHQR.verify(khqrString).isValid
    ) {
        res.status(500);
        throw new Error(
            khqrResponse?.status?.message || "Failed to generate a valid Bakong KHQR code"
        );
    }

    const qrCodeBase64 = await QRCode.toDataURL(khqrString, {
        errorCorrectionLevel: "M",
        type: "image/png",
        width: 360,
        margin: 2,
        color: {
            dark: "#000000",
            light: "#ffffff",
        },
    });
    const deepLink = await generateBakongDeepLink(khqrString, bakongConfig);

    // Create or update payment record
    if (payment) {
        payment.khqrData = {
            merchantId: accountType === "MERCHANT" ? merchantId : accountId,
            merchantName,
            qrCode: qrCodeBase64,
            qrString: khqrString,
            deepLink,
            deepLinkAttemptedAt: bakongConfig.deepLinkUrl ? new Date() : undefined,
            transactionId,
            expiresAt,
        };
        payment.amount = paymentAmount;
        payment.currency = requestedCurrency;
        payment.metadata.ipAddress = req.ip;
        payment.metadata.userAgent = req.get("user-agent");
        payment.metadata.notes =
            `KHQR amount: ${paymentAmount} ${requestedCurrency}; rate: ${exchangeRate}`;
        await payment.save();
    } else {
        payment = new Payment({
            order: orderId,
            user: req.user._id,
            paymentMethod: "BAKONG_KHQR",
            amount: paymentAmount,
            currency: requestedCurrency,
            khqrData: {
                merchantId: accountType === "MERCHANT" ? merchantId : accountId,
                merchantName,
                qrCode: qrCodeBase64,
                qrString: khqrString,
                deepLink,
                deepLinkAttemptedAt: bakongConfig.deepLinkUrl ? new Date() : undefined,
                transactionId,
                expiresAt,
            },
            status: "Pending",
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get("user-agent"),
                notes: `KHQR amount: ${paymentAmount} ${requestedCurrency}; rate: ${exchangeRate}`,
            },
        });
        await payment.save();
    }

    res.status(201).json(payment);
});

// @desc    Verify BAKONG payment (webhook/callback)
// @route   POST /api/payments/bakong/verify
// @access  Public (but should be validated with signature)
export const verifyBakongPayment = asyncHandler(async (req, res) => {
    const { transactionId, ackId, status, payerName, payerAccount, responseCode } = req.body;

    if (!verifyWebhookSignature(req)) {
        res.status(401);
        throw new Error("Invalid webhook signature");
    }

    // Find payment by transaction ID
    const payment = await Payment.findOne({
        "khqrData.transactionId": transactionId,
    }).populate("order");

    if (!payment) {
        res.status(404);
        throw new Error("Payment not found");
    }

    if (status === "SUCCESS" || responseCode === "00") {
        const completedPayment = await completeBakongPayment(payment, {
            ackId,
            payerName,
            payerAccount,
            acknowledgedDateMs: Date.now(),
        });

        return res.json({ success: true, payment: completedPayment });
    }

    res.json({
        success: true,
        payment: await Payment.findById(payment._id),
    });
});

// @desc    Check payment status
// @route   GET /api/payments/:paymentId/status
// @access  Private
export const getPaymentStatus = asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.paymentId).populate("order");

    if (!payment) {
        res.status(404);
        throw new Error("Payment not found");
    }

    // Verify payment belongs to user
    if (payment.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error("Not authorized to access this payment");
    }

    if (payment.status === "Pending") {
        try {
            await reconcileBakongPayment(payment);
        } catch (error) {
            console.error(
                `Bakong status check failed for payment ${payment._id}:`,
                error.message
            );
        }
    }

    res.json(await Payment.findById(payment._id).populate("order"));
});

// @desc    Get payment by order ID
// @route   GET /api/payments/order/:orderId
// @access  Private
export const getPaymentByOrderId = asyncHandler(async (req, res) => {
    const payment = await Payment.findOne({ order: req.params.orderId })
        .populate("order")
        .sort({ createdAt: -1 })
        .lean();

    if (!payment) {
        res.status(404);
        throw new Error("Payment not found for this order");
    }

    // Verify payment belongs to user
    if (payment.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error("Not authorized to access this payment");
    }

    res.json(payment);
});

// @desc    Cancel payment
// @route   PUT /api/payments/:paymentId/cancel
// @access  Private
export const cancelPayment = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    let payment;
    let order;

    try {
        await session.withTransaction(async () => {
            payment = await Payment.findById(req.params.paymentId).session(session);

            if (!payment) {
                res.status(404);
                throw new Error("Payment not found");
            }

            if (payment.user.toString() !== req.user._id.toString()) {
                res.status(401);
                throw new Error("Not authorized to cancel this payment");
            }

            if (payment.status !== "Pending") {
                res.status(400);
                throw new Error("Can only cancel pending payments");
            }

            order = await Order.findById(payment.order).session(session);

            if (!order) {
                res.status(404);
                throw new Error("Order not found");
            }

            if (
                !["Pending", "Cancelled"].includes(order.orderStatus)
                || order.isPaid
            ) {
                res.status(400);
                throw new Error("This order can no longer be cancelled");
            }

            await restoreCancelledOrder(order, session);
            await Payment.deleteOne({ _id: payment._id }).session(session);
            await Order.deleteOne({ _id: order._id }).session(session);
        });
    } finally {
        await session.endSession();
    }

    emitDomainChanged(
        "products",
        "inventory-restored",
        {
            productIds: order.orderItems
                .map((item) => item.product?._id || item.product)
                .filter(Boolean),
        },
        { users: true }
    );
    res.json({ message: "Payment draft removed successfully" });
});

// @desc    Get all payments (Admin)
// @route   GET /api/payments
// @access  Private/Admin
export const getAllPayments = asyncHandler(async (req, res) => {
    const payments = await Payment.find({ status: "Completed" })
        .populate("user", "name email")
        .populate("order")
        .sort({ createdAt: -1 })
        .lean();

    res.json(payments);
});

// @desc    Manual payment confirmation (Admin)
// @route   PUT /api/payments/:paymentId/confirm
// @access  Private/Admin
export const confirmPayment = asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.paymentId).populate("order");

    if (!payment) {
        res.status(404);
        throw new Error("Payment not found");
    }

    const completedPayment = await completeBakongPayment(payment, {
        payerName: "Admin confirmation",
        acknowledgedDateMs: Date.now(),
    });
    emitDomainChanged(
        "payments",
        "confirmed",
        { paymentId: payment._id, orderId: getOrderId(payment.order) },
        { roles: ["admin", "seller"], userId: payment.user }
    );

    res.json({
        message: "Payment confirmed successfully",
        payment: completedPayment,
    });
});
