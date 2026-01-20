import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: false },
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
  },
  { timestamps: true }
);

// Hash password (only if password is provided and modified)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
