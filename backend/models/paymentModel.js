import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Order",
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ["BAKONG_KHQR", "Cash on Delivery"],
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "USD",
            enum: ["USD", "KHR"],
        },
        // BAKONG KHQR specific fields
        khqrData: {
            merchantId: { type: String },
            merchantName: { type: String },
            qrCode: { type: String }, // Base64 encoded QR code
            qrString: { type: String }, // QR code string
            deepLink: { type: String, default: "" },
            deepLinkAttemptedAt: { type: Date },
            transactionId: { type: String }, // Unique transaction ID
            expiresAt: { type: Date },
        },
        // Payment status tracking
        status: {
            type: String,
            required: true,
            enum: ["Pending", "Completed", "Failed", "Expired", "Cancelled"],
            default: "Pending",
        },
        // Payment result from BAKONG
        paymentResult: {
            transactionId: { type: String },
            ackId: { type: String }, // Acknowledgment ID from BAKONG
            payerName: { type: String },
            payerAccount: { type: String },
            paymentTime: { type: Date },
            responseCode: { type: String },
            responseMessage: { type: String },
        },
        // Metadata
        metadata: {
            ipAddress: { type: String },
            userAgent: { type: String },
            notes: { type: String },
        },
        completedAt: {
            type: Date,
        },
        failedAt: {
            type: Date,
        },
        telegramAlert: {
            sentAt: { type: Date },
        },
    },
    {
        timestamps: true,
    }
);

// Indexes match the payment controller's most common lookup patterns.
paymentSchema.index({ order: 1, status: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ "khqrData.transactionId": 1 }, { unique: true, sparse: true });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
