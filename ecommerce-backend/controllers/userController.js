import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../utils/sendEmail.js";

// 🔐 generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// 🟢 REGISTER (admin or user)
export const registerUser = async (req, res) => {
  try {
    const { name,phone ,email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      phone,
      email,
      password,
      role, // send "admin" from Postman
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔵 LOGIN (ADMIN + USER)
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔄 UPDATE USER PROFILE
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update basic info
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) {
      // Check if email is already taken by another user
      const emailExists = await User.findOne({ 
        email: req.body.email,
        _id: { $ne: req.user._id }
      });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = req.body.email;
    }
    if (req.body.phone) user.phone = req.body.phone;

    // Update password if provided
    if (req.body.newPassword) {
      if (!req.body.currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }

      const isMatch = await user.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      user.password = req.body.newPassword;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔑 FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        message: "If that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token expiration (1 hour)
    const resetPasswordExpire = Date.now() + 60 * 60 * 1000;

    // Update user directly to avoid pre-save hooks
    await User.updateOne(
      { _id: user._id },
      {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: resetPasswordExpire,
      }
    );

    // Generate reset URL
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
    
    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      console.log(`✅ Password reset email sent to: ${user.email}`);
    } catch (emailError) {
      console.error("❌ Failed to send email:", emailError.message);
      console.error("   Full error:", emailError);
      // Log the reset URL for manual use if email fails
      console.log("\n📋 MANUAL RESET URL (use this if email failed):");
      console.log("   " + resetUrl);
      console.log("\n");
    }

    res.json({
      message: "If that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: error.message || "Failed to process password reset request",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

// 🔄 RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and password are required" });
    }

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with matching token and non-expired token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      message: "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: error.message });
  }
};
