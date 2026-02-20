import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    deleteAccountOtp: { type: String, required: false },       // Hashed OTP for Google user account deletion
    deleteAccountOtpExpire: { type: Date, required: false },   // OTP expiry
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
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
