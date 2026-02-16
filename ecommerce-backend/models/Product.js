import mongoose from "mongoose";

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: false },
    sentimentLabel: {
      type: String,
      enum: ["Positive", "Neutral", "Negative"],
      default: "Neutral",
    },
    sentimentScore: {
      type: Number,
      default: 0,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    moderationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    moderationNote: {
      type: String,
      default: "",
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    moderatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const productSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
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
    },
    brand: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    stock: {
      type: Number,
      default: 0,
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
    sentimentSummary: {
      positive: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
      negative: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      label: {
        type: String,
        enum: ["Positive", "Neutral", "Negative"],
        default: "Neutral",
      },
    },
  },
  { timestamps: true }
);

productSchema.index({
  title: "text",
  description: "text",
  category: "text",
  brand: "text",
  type: "text",
});

const Product = mongoose.model("Product", productSchema);

export default Product;
