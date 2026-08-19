import mongoose from "mongoose";

const supplierSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    contactPerson: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    altPhone: {
      type: String,
      default: "",
      trim: true,
    },
    telegram: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "Phnom Penh" },
      province: { type: String, default: "" },
      country: { type: String, default: "Cambodia" },
    },
    categories: {
      type: [String],
      default: [],
    },
    paymentTerms: {
      type: String,
      enum: ["Cash on Delivery", "Net 15", "Net 30", "Net 60", "Advance", "Other"],
      default: "Cash on Delivery",
    },
    bankInfo: {
      bankName: { type: String, default: "" },
      accountName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      bakongId: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    notes: {
      type: String,
      default: "",
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpend: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-generate code before save if not provided
supplierSchema.pre("save", async function () {
  if (!this.code) {
    const count = await mongoose.model("Supplier").countDocuments();
    this.code = `SUP-${String(count + 1).padStart(4, "0")}`;
  }
});

supplierSchema.index({ name: 1, status: 1 });
supplierSchema.index({ phone: 1 });

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier;
