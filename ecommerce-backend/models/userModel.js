import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = mongoose.Schema(
  {
    label: { type: String, default: "Address" },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    city: { type: String, required: true },
    postalCode: { type: String, default: "" },
    country: { type: String, required: true, default: "Cambodia" },
    latitude: { type: Number },
    longitude: { type: Number },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      set: (v) => (v === "" ? undefined : v), // Convert empty string to undefined for sparse index
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // Optional for Google OAuth users
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    googleId: { type: String, required: false }, // Store Google ID for OAuth users
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpire: { type: Date, required: false },
    phoneVerificationCode: { type: String, required: false },
    phoneVerificationExpire: { type: Date, required: false },
    tempPhone: { type: String, required: false },
    addresses: {
      type: [addressSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Hash password (only if password is provided and modified)
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password || typeof enteredPassword !== "string") {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
