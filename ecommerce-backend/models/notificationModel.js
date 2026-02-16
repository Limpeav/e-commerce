import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ["order", "user", "product", "system", "promotion", "support", "payment"],
            default: "order",
        },
        audience: {
            type: String,
            enum: ["admin", "user", "all"],
            default: "admin",
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        link: {
            type: String,
        },
        googleMapsLink: {
            type: String,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ audience: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
