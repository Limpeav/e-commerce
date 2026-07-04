import mongoose from "mongoose";

const deletedAccountLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    role: {
      type: String,
      default: "user",
      index: true,
    },
    deletedBy: {
      type: String,
      enum: ["self", "admin"],
      required: true,
      index: true,
    },
    deletedByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

deletedAccountLogSchema.index({ role: 1, deletedBy: 1, deletedAt: -1 });

const DeletedAccountLog = mongoose.model("DeletedAccountLog", deletedAccountLogSchema);

export default DeletedAccountLog;
