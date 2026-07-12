import mongoose from "mongoose";

const financialSettingsSchema = mongoose.Schema(
  {
    key: {
      type: String,
      default: "default",
      unique: true,
      immutable: true,
    },
    usdToKhrRate: {
      type: Number,
      required: true,
      min: 1,
      default: 4100,
    },
    khrToUsdRate: {
      type: Number,
      required: true,
      min: 0.000001,
      default: 1 / 4100,
    },
    taxPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 8,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const FinancialSettings = mongoose.model(
  "FinancialSettings",
  financialSettingsSchema
);

export default FinancialSettings;
