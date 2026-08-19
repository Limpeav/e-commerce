import mongoose from "mongoose";
import { normalizeProductCategory } from "../utils/productCategories.js";
import { productSupportsExpiry } from "../utils/productExpiry.js";

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: false },
    commentKm: { type: String, default: "" },
    sentimentLabel: {
      type: String,
      enum: ["Positive", "Neutral", "Negative"],
      default: "Neutral",
    },
    sentimentScore: {
      type: Number,
      default: 0,
    },
    sentimentAnalyzedAt: {
      type: Date,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const sizeStockSchema = mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    color: {
      type: String,
      default: "",
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockAlertSent: {
      type: Boolean,
      default: false,
    },
    outOfStockAlertSent: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const colorImageSchema = mongoose.Schema(
  {
    color: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const productDetailImageSchema = mongoose.Schema(
  {
    color: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const productSchema = mongoose.Schema(
  {
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: true,
    },
    titleKm: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
      default: null,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },
    category: {
      type: String,
      required: true,
      set: normalizeProductCategory,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
    supplierSku: {
      type: String,
      default: "",
      trim: true,
    },
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    leadTimeDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    descriptionKm: {
      type: String,
      default: "",
    },
    stock: {
      type: Number,
      default: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    colorImages: {
      type: [colorImageSchema],
      default: [],
    },
    productDetailImages: {
      type: [productDetailImageSchema],
      default: [],
    },
    sizeStocks: {
      type: [sizeStockSchema],
      default: [],
    },
    totalSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    hasProductIssue: {
      type: Boolean,
      default: false,
    },
    warrantyPeriodDays: {
      type: Number,
      default: null,
      min: 0,
    },
    issueQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiryDate: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          return value === null || productSupportsExpiry(this.category);
        },
        message: "Expiry date is only supported for Milk and Bath & Skin products",
      },
    },
    expiryAlertSent: {
      type: Boolean,
      default: false,
    },
    expiryAlertSentAt: {
      type: Date,
      default: null,
    },
    lowStockAlertSent: {
      type: Boolean,
      default: false,
    },
    outOfStockAlertSent: {
      type: Boolean,
      default: false,
    },
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

productSchema.pre("validate", function () {
  if (!this.sku && this._id) {
    this.sku = `PRD-${this._id.toString().slice(-8).toUpperCase()}`;
  }
});

productSchema.index({ stock: 1, createdAt: -1, _id: -1 });
productSchema.index({ category: 1, stock: 1, createdAt: -1 });
productSchema.index({ isNewArrival: 1, stock: 1, createdAt: -1 });
productSchema.index({ hasProductIssue: 1, createdAt: -1 });
productSchema.index({ expiryDate: 1, expiryAlertSent: 1, stock: 1 });
productSchema.index({ totalSold: -1, rating: -1 });
productSchema.index({ "sizeStocks.size": 1 });
productSchema.index({ "sizeStocks.size": 1, "sizeStocks.color": 1 });
productSchema.index({ colors: 1 });
productSchema.index({ supplier: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
