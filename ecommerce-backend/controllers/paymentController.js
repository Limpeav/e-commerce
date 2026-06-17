import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import Product from "../models/Product.js";
import QRCode from "qrcode";
import crypto from "crypto";
import khqrPackage from "bakong-khqr";
import { emitDomainChanged, emitOrderUpdated } from "../realtime/socket.js";
import { syncLowStockAlertFlag } from "../utils/stockAlerts.js";
import { sendOrderTelegramAlert } from "../utils/sendTelegramMessage.js";
import axios from "axios";

const { BakongKHQR, IndividualInfo, MerchantInfo, khqrData } = khqrPackage;
const KHQR_EXPIRY_MS = 5 * 60 * 1000;

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

const restoreCancelledOrder = async (order, session) => {
    if (order.stockReduced && !order.stockRestored) {
        for (const item of order.orderItems) {
            const product = await Product.findById(item.product).session(session);

            if (product) {
                product.stock += Number(item.quantity || 0);
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
            existingItem.quantity += Number(item.quantity || 0);
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

const markOrderAsPaid = async (orderRef, paymentResult = {}) => {
    const order = typeof orderRef?.save === "function"
        ? orderRef
        : await Order.findById(orderRef);

    if (!order) {
        return null;
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentStatus = "Paid";

    if (Object.keys(paymentResult).length > 0) {
        order.paymentResult = {
            ...order.paymentResult,
            ...paymentResult,
        };
    }

    await order.save();
    emitOrderUpdated(order, {
        paymentStatus: order.paymentStatus,
        isPaid: order.isPaid,
        paidAt: order.paidAt,
    });
    dispatchPaidOrderTelegramAlert(order._id);

    return order;
};

// @desc    Generate BAKONG KHQR code for payment
// @route   POST /api/payments/bakong/generate
// @access  Private
export const generateBakongQR = asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    const requestedCurrency = String(req.body.currency || "USD").toUpperCase();

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

    // Check if payment already exists for this order
    let payment = await Payment.findOne({ order: orderId, status: "Pending" });

    if (payment) {
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
            return res.json(payment);
        }
    }

    // Generate unique transaction ID
    const transactionId = `TXN${Date.now()}${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const accountId = process.env.BAKONG_ACCOUNT_ID?.trim();
    const merchantName = (
        process.env.BAKONG_ACCOUNT_USERNAME
        || process.env.BAKONG_MERCHANT_NAME
        || "Cherish Baby Store"
    ).trim();
    const merchantCity = (process.env.BAKONG_MERCHANT_CITY || "Phnom Penh").trim();
    const mobileNumber = (process.env.BAKONG_PHONE_NUMBER || "").replace(/\D/g, "");

    if (!accountId || !accountId.includes("@")) {
        res.status(500);
        throw new Error("BAKONG_ACCOUNT_ID is missing or invalid");
    }

    const exchangeRate = parseFloat(process.env.USD_TO_KHR_RATE) || 4100;
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
    const merchantId = (process.env.BAKONG_MERCHANT_ID || "MERCHANT001").trim();
    const acquiringBank = (process.env.BAKONG_ACQUIRING_BANK || "bakong").trim();

    const merchantInfo = new MerchantInfo(
        accountId,
        merchantName,
        merchantCity,
        merchantId,
        acquiringBank,
        {
            currency: khqrCurrency,
            amount: paymentAmount,
            billNumber: order._id.toString(),
            mobileNumber: mobileNumber || undefined,
            storeLabel: "Cherish Baby Store",
            terminalLabel: "WEB",
            expirationTimestamp: expiresAt.getTime(),
        }
    );
    const khqrResponse = new BakongKHQR().generateMerchant(merchantInfo);
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

    // Create or update payment record
    if (payment) {
        payment.khqrData = {
            merchantId,
            merchantName,
            qrCode: qrCodeBase64,
            qrString: khqrString,
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
                merchantId,
                merchantName,
                qrCode: qrCodeBase64,
                qrString: khqrString,
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

    // Update payment status
    if (status === "SUCCESS" || responseCode === "00") {
        payment.status = "Completed";
        payment.completedAt = new Date();
        payment.paymentResult = {
            transactionId,
            ackId,
            payerName,
            payerAccount,
            paymentTime: new Date(),
            responseCode,
            responseMessage: "Payment successful",
        };

        await markOrderAsPaid(payment.order, {
            id: transactionId,
            status: "Completed",
            update_time: new Date().toISOString(),
        });
    } else {
        payment.status = "Failed";
        payment.failedAt = new Date();
        payment.paymentResult = {
            transactionId,
            responseCode,
            responseMessage: "Payment failed",
        };
    }

    await payment.save();
    emitDomainChanged(
        "payments",
        payment.status === "Completed" ? "completed" : "failed",
        { paymentId: payment._id, orderId: getOrderId(payment.order) },
        { roles: ["admin", "seller"], userId: payment.user }
    );

    res.json({ success: true, payment });
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

    const isExpired = payment.khqrData?.expiresAt < new Date();

    // Active verification against official Bakong Open API if still Pending
    if (payment.status === "Pending") {
        const bakongToken = process.env.BAKONG_TOKEN;
        const apiBaseUrl = process.env.BAKONG_API_URL || "https://api-bakong.nbc.gov.kh";

        if (bakongToken && payment.khqrData?.qrString) {
            try {
                // Generate MD5 from the QR code string
                const md5 = crypto.createHash("md5").update(payment.khqrData.qrString).digest("hex");

                const response = await axios.post(
                    `${apiBaseUrl}/v1/check_transaction_by_md5`,
                    { md5 },
                    {
                        headers: {
                            Authorization: `Bearer ${bakongToken}`,
                            "Content-Type": "application/json",
                        },
                        timeout: 5000,
                    }
                );

                if (response.data && response.data.responseCode === 0) {
                    const txData = response.data.data;

                    payment.status = "Completed";
                    payment.completedAt = new Date();
                    payment.paymentResult = {
                        transactionId: payment.khqrData.transactionId,
                        ackId: txData.hash || "",
                        payerName: txData.fromAccountId || "Bakong User",
                        payerAccount: txData.fromAccountId || "",
                        paymentTime: txData.acknowledgedDateMs ? new Date(txData.acknowledgedDateMs) : new Date(),
                        responseCode: "00",
                        responseMessage: "Payment successful (verified via Bakong API)",
                    };
                    await payment.save();

                    await markOrderAsPaid(payment.order, {
                        id: payment.khqrData.transactionId,
                        status: "Completed",
                        update_time: new Date().toISOString(),
                    });

                    emitDomainChanged(
                        "payments",
                        "completed",
                        { paymentId: payment._id, orderId: getOrderId(payment.order) },
                        { roles: ["admin", "seller"], userId: payment.user }
                    );
                } else if (isExpired) {
                    payment.status = "Expired";
                    await payment.save();
                }
            } catch (err) {
                console.error("Error checking status with Bakong API:", err.message);
                if (isExpired) {
                    payment.status = "Expired";
                    await payment.save();
                }
            }
        } else {
            // Fallback for development if no token is configured
            if (isExpired) {
                payment.status = "Expired";
                await payment.save();
            }
        }
    }

    res.json(payment);
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

            if (order.orderStatus !== "Pending" || order.isPaid) {
                res.status(400);
                throw new Error("This order can no longer be cancelled");
            }

            payment.status = "Cancelled";
            order.orderStatus = "Cancelled";
            order.paymentStatus = "Failed";
            order.paymentResult.status = "Cancelled";
            order.paymentResult.update_time = new Date().toISOString();

            await restoreCancelledOrder(order, session);
            await order.save({ session });
            await payment.save({ session });
        });
    } finally {
        await session.endSession();
    }

    emitOrderUpdated(order, {
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        stockRestored: order.stockRestored,
    });
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
    emitDomainChanged(
        "payments",
        "cancelled",
        { paymentId: payment._id, orderId: payment.order },
        { roles: ["admin", "seller"], userId: payment.user }
    );

    res.json({ message: "Payment cancelled successfully", payment, order });
});

// @desc    Get all payments (Admin)
// @route   GET /api/payments
// @access  Private/Admin
export const getAllPayments = asyncHandler(async (req, res) => {
    const payments = await Payment.find({})
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

    payment.status = "Completed";
    payment.completedAt = new Date();
    payment.paymentResult = {
        ...payment.paymentResult,
        responseMessage: "Payment confirmed by admin",
    };

    await markOrderAsPaid(payment.order);

    await payment.save();
    emitDomainChanged(
        "payments",
        "confirmed",
        { paymentId: payment._id, orderId: getOrderId(payment.order) },
        { roles: ["admin", "seller"], userId: payment.user }
    );

    res.json({ message: "Payment confirmed successfully", payment });
});
