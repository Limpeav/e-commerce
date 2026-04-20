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
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;