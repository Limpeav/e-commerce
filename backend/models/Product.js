import mongoose from "mongoose";
import { normalizeProductCategory } from "../utils/productCategories.js";
import { productSupportsExpiry } from "../utils/productExpiry.js";

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: false },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
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

const productSchema = mongoose.Schema(
  {
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
    category: {
      type: String,
      required: true,
      set: normalizeProductCategory,
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
    lowStockAlertSent: {
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

productSchema.index({ stock: 1, createdAt: -1, _id: -1 });
productSchema.index({ category: 1, stock: 1, createdAt: -1 });
productSchema.index({ isNewArrival: 1, stock: 1, createdAt: -1 });
productSchema.index({ hasProductIssue: 1, createdAt: -1 });
productSchema.index({ totalSold: -1, rating: -1 });
productSchema.index({ "sizeStocks.size": 1 });
productSchema.index({ "sizeStocks.size": 1, "sizeStocks.color": 1 });
productSchema.index({ colors: 1 });
productSchema.index({ title: "text", titleKm: "text" });
productSchema.index({ price: 1 });
productSchema.index({ discountPrice: 1 });
productSchema.index({ createdAt: -1, _id: -1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
