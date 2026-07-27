import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ["order", "user", "product", "system"],
            default: "order",
        },
        audience: {
            type: String,
            enum: ["admin", "user", "broadcast"],
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

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
