import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: { type: String },
    isAdmin: { type: Boolean, default: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    googleId: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    tempPhone: { type: String },
    phoneVerificationCode: { type: String },
    phoneVerificationExpire: { type: Date },
    deleteAccountOtp: { type: String },
    deleteAccountOtpExpire: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false;
  }

  if (this.password.startsWith("$2")) {
    return bcrypt.compare(enteredPassword, this.password);
  }

  return enteredPassword === this.password;
};

const User = mongoose.model("User", userSchema);

export default User;
