import mongoose from "mongoose";

const poItemSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    sku: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    size: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "",
    },
    orderedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const receivingLogSchema = mongoose.Schema(
  {
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receiverName: {
      type: String,
      default: "Admin",
    },
    notes: {
      type: String,
      default: "",
    },
    itemsReceived: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        itemId: { type: mongoose.Schema.Types.ObjectId },
        sku: String,
        title: String,
        size: String,
        color: String,
        quantity: Number,
        unitCost: Number,
        expiryDate: Date,
      },
    ],
  },
  { timestamps: true }
);

const paymentLogSchema = mongoose.Schema(
  {
    paidAt: {
      type: Date,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    method: {
      type: String,
      enum: ["Cash", "Bakong / QR", "Bank Transfer", "Cheque", "Other"],
      default: "Cash",
    },
    reference: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const purchaseOrderSchema = mongoose.Schema(
  {
    poNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "ordered", "partial_received", "received", "cancelled"],
      default: "draft",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    items: {
      type: [poItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "Purchase order must contain at least one item",
      },
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
    },
    expectedDeliveryDate: {
      type: Date,
      default: null,
    },
    actualDeliveryDate: {
      type: Date,
      default: null,
    },
    orderedAt: {
      type: Date,
      default: null,
    },
    receivingLogs: {
      type: [receivingLogSchema],
      default: [],
    },
    paymentLogs: {
      type: [paymentLogSchema],
      default: [],
    },
    notes: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Auto generate poNumber
purchaseOrderSchema.pre("save", async function () {
  if (!this.poNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const count = await mongoose.model("PurchaseOrder").countDocuments();
    this.poNumber = `PO-${dateStr}-${String(count + 1).padStart(4, "0")}`;
  }

  // Update balanceDue
  this.balanceDue = Math.max(0, Number((this.totalAmount - (this.paidAmount || 0)).toFixed(2)));

  // Auto update paymentStatus based on paidAmount
  if (this.paidAmount >= this.totalAmount && this.totalAmount > 0) {
    this.paymentStatus = "paid";
  } else if (this.paidAmount > 0) {
    this.paymentStatus = "partial";
  } else {
    this.paymentStatus = "unpaid";
  }
});

purchaseOrderSchema.index({ supplier: 1, status: 1 });
purchaseOrderSchema.index({ status: 1, createdAt: -1 });

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);

export default PurchaseOrder;
