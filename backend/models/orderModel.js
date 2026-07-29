import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        orderItems: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "Product",
                },
                name: { type: String, required: true },
                titleKm: { type: String, default: "" },
                quantity: { type: Number, required: true },
                size: { type: String, default: "", trim: true, uppercase: true },
                color: { type: String, default: "", trim: true },
                image: { type: String, required: true },
                price: { type: Number, required: true },
                costPrice: { type: Number, default: 0, min: 0, select: false },
            },
        ],
        shippingAddress: {
            fullName: { type: String, required: true },
            street: { type: String, required: false, default: "" },
            address: { type: String, required: false, default: "" },
            city: { type: String, required: false, default: "" },
            postalCode: { type: String, required: false },
            country: { type: String, required: false },
            phone: { type: String, required: true },
            latitude: { type: Number },
            longitude: { type: Number },
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ["BAKONG_KHQR", "Cash on Delivery"],
            default: "Cash on Delivery",
        },
        paymentResult: {
            id: { type: String },
            status: { type: String },
            update_time: { type: String },
            email_address: { type: String },
        },
        taxPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        shippingPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        totalPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        orderStatus: {
            type: String,
            required: true,
            enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
            default: "Pending",
        },
        paymentStatus: {
            type: String,
            required: true,
            enum: ["Pending", "Paid", "Failed", "Refunded"],
            default: "Pending",
        },
        isPaid: {
            type: Boolean,
            required: true,
            default: false,
        },
        paidAt: {
            type: Date,
        },
        processedAt: {
            type: Date,
        },
        shippedAt: {
            type: Date,
        },
        isDelivered: {
            type: Boolean,
            required: true,
            default: false,
        },
        deliveredAt: {
            type: Date,
        },
        deliveryProof: {
            imageUrl: { type: String },
            uploadedAt: { type: Date },
            uploadedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            publicId: { type: String },
        },
        receiptSent: {
            sentAt: { type: Date },
            sentBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            channel: { type: String },
        },
        sellerTelegramAlert: {
            sentAt: { type: Date },
        },
        reviewRequestEmail: {
            sentAt: { type: Date },
            messageId: { type: String },
            failedAt: { type: Date },
            lastError: { type: String },
        },
        stockReduced: {
            type: Boolean,
            required: true,
            default: false,
        },
        stockReserved: {
            type: Boolean,
            required: true,
            default: false,
        },
        stockRestored: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, paymentStatus: 1, createdAt: -1 });
orderSchema.index({ paymentMethod: 1, paymentStatus: 1, orderStatus: 1, createdAt: -1 });
orderSchema.index({
    user: 1,
    paymentMethod: 1,
    orderStatus: 1,
    paymentStatus: 1,
    createdAt: 1,
});
orderSchema.index({ "orderItems.product": 1, orderStatus: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
