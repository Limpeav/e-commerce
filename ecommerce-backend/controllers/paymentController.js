import asyncHandler from "express-async-handler";
import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import QRCode from "qrcode";
import crypto from "crypto";
import { emitDomainChanged, emitOrderUpdated } from "../realtime/socket.js";

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

// @desc    Generate BAKONG KHQR code for payment
// @route   POST /api/payments/bakong/generate
// @access  Private
export const generateBakongQR = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

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
        if (payment.khqrData.expiresAt > new Date()) {
            return res.json(payment);
        }
    }

    // Generate unique transaction ID
    const transactionId = `TXN${Date.now()}${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // BAKONG KHQR Configuration (from environment variables)
    const merchantId = process.env.BAKONG_MERCHANT_ID || "MERCHANT001";
    const merchantName = process.env.BAKONG_MERCHANT_NAME || "E-Commerce Store";
    const acquiringBank = process.env.BAKONG_ACQUIRING_BANK || "bakong";

    // Convert USD to KHR if needed (1 USD = ~4100 KHR, adjust based on current rate)
    const exchangeRate = parseFloat(process.env.USD_TO_KHR_RATE) || 4100;
    const amountInKHR = Math.round(order.totalPrice * exchangeRate);

    // Generate KHQR String (simplified format)
    // In production, you would use the official BAKONG KHQR SDK
    const khqrString = generateKHQRString({
        merchantId,
        merchantName,
        acquiringBank,
        amount: amountInKHR,
        currency: "KHR",
        transactionId,
    });

    // Generate QR Code as base64 image
    const qrCodeBase64 = await QRCode.toDataURL(khqrString, {
        errorCorrectionLevel: "H",
        type: "image/png",
        width: 300,
        margin: 2,
    });

    // Set expiration (30 minutes from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

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
        payment.amount = order.totalPrice;
        await payment.save();
    } else {
        payment = new Payment({
            order: orderId,
            user: req.user._id,
            paymentMethod: "BAKONG_KHQR",
            amount: order.totalPrice,
            currency: "USD",
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
            },
        });
        await payment.save();
    }

    res.status(201).json(payment);
});

// Helper function to generate KHQR string
// This is a simplified version. In production, use the official BAKONG KHQR library
function generateKHQRString(data) {
    const { merchantId, merchantName, acquiringBank, amount, currency, transactionId } = data;

    // KHQR format follows EMVCo specification
    // This is a simplified example - use official BAKONG SDK in production
    const khqr = {
        payloadFormatIndicator: "01",
        pointOfInitiationMethod: "12", // Dynamic QR
        merchantAccountInformation: {
            globallyUniqueIdentifier: acquiringBank,
            merchantId: merchantId,
        },
        merchantCategoryCode: "0000",
        transactionCurrency: currency === "KHR" ? "116" : "840", // 116=KHR, 840=USD
        transactionAmount: amount.toString(),
        countryCode: "KH",
        merchantName: merchantName,
        merchantCity: "Phnom Penh",
        additionalData: {
            referenceNumber: transactionId,
        },
    };

    // Construct KHQR string (simplified)
    const khqrString = `00020101021230${merchantId}0${acquiringBank}52040000${currency === "KHR" ? "5303116" : "5303840"}54${amount.toString().length.toString().padStart(2, "0")}${amount}5802KH59${merchantName.length.toString().padStart(2, "0")}${merchantName}6011Phnom Penh62${transactionId.length.toString().padStart(2, "0")}${transactionId}6304`;

    return khqrString;
}

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

        // Update order payment status
        const order = await Order.findById(payment.order);
        if (order) {
            order.isPaid = true;
            order.paidAt = new Date();
            order.paymentStatus = "Paid";
            order.paymentResult = {
                id: transactionId,
                status: "Completed",
                update_time: new Date().toISOString(),
            };
            await order.save();
            emitOrderUpdated(order, {
                paymentStatus: order.paymentStatus,
                isPaid: order.isPaid,
                paidAt: order.paidAt,
            });
        }
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
        { paymentId: payment._id, orderId: payment.order },
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

    // Check if payment has expired
    if (payment.status === "Pending" && payment.khqrData.expiresAt < new Date()) {
        payment.status = "Expired";
        await payment.save();
    }

    res.json(payment);
});

// @desc    Get payment by order ID
// @route   GET /api/payments/order/:orderId
// @access  Private
export const getPaymentByOrderId = asyncHandler(async (req, res) => {
    const payment = await Payment.findOne({ order: req.params.orderId }).populate("order");

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
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
        res.status(404);
        throw new Error("Payment not found");
    }

    // Verify payment belongs to user
    if (payment.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error("Not authorized to cancel this payment");
    }

    // Can only cancel pending payments
    if (payment.status !== "Pending") {
        res.status(400);
        throw new Error("Can only cancel pending payments");
    }

    payment.status = "Cancelled";
    await payment.save();
    emitDomainChanged(
        "payments",
        "cancelled",
        { paymentId: payment._id, orderId: payment.order },
        { roles: ["admin", "seller"], userId: payment.user }
    );

    res.json({ message: "Payment cancelled successfully", payment });
});

// @desc    Get all payments (Admin)
// @route   GET /api/payments
// @access  Private/Admin
export const getAllPayments = asyncHandler(async (req, res) => {
    const payments = await Payment.find({})
        .populate("user", "name email")
        .populate("order")
        .sort({ createdAt: -1 });

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

    // Update order
    const order = await Order.findById(payment.order);
    if (order) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentStatus = "Paid";
        await order.save();
        emitOrderUpdated(order, {
            paymentStatus: order.paymentStatus,
            isPaid: order.isPaid,
            paidAt: order.paidAt,
        });
    }

    await payment.save();
    emitDomainChanged(
        "payments",
        "confirmed",
        { paymentId: payment._id, orderId: payment.order },
        { roles: ["admin", "seller"], userId: payment.user }
    );

    res.json({ message: "Payment confirmed successfully", payment });
});
