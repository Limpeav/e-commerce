import mongoose from "mongoose";

const csvBuilderDraftRowSchema = mongoose.Schema(
  {
    title: { type: String, default: "", trim: true },
    price: { type: String, default: "", trim: true },
    discountPrice: { type: String, default: "", trim: true },
    category: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    stock: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },
    imageName: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const csvBuilderDraftSchema = mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    rows: {
      type: [csvBuilderDraftRowSchema],
      default: [],
    },
    fileName: {
      type: String,
      default: "products-import-ready.csv",
      trim: true,
    },
  },
  { timestamps: true }
);

const CsvBuilderDraft = mongoose.model("CsvBuilderDraft", csvBuilderDraftSchema);

export default CsvBuilderDraft;
