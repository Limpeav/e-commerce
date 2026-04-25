import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendPasswordResetCode, sendDeleteAccountOtp } from "../utils/sendEmail.js";

// 🔐 generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// 🟢 REGISTER (admin or user)
export const registerUser = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
    }

    const user = await User.create({
      name,
      phone,
      email,
      password,
      role: "user",
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

    if (user.password && !user.password.startsWith("$2")) {
      user.password = password;
      await user.save();
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
    if (req.body.phone) {
      if (req.body.phone !== user.phone) {
        const phoneExists = await User.findOne({
          phone: req.body.phone,
          _id: { $ne: req.user._id }
        });
        if (phoneExists) {
          return res.status(400).json({ message: "Phone number already in use" });
        }
      }
      user.phone = req.body.phone;
    }

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

// 🔑 FORGOT PASSWORD - Step 1: Send 6-digit code to email (Facebook-style)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: "If an account exists for that email, a reset code has been sent.",
      });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the code for storage
    const hashedCode = crypto
      .createHash("sha256")
      .update(resetCode)
      .digest("hex");

    // Set code expiration (10 minutes)
    const resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    // Update user directly to avoid pre-save hooks
    await User.updateOne(
      { _id: user._id },
      {
        resetPasswordToken: hashedCode,
        resetPasswordExpire: resetPasswordExpire,
      }
    );

    // Send password reset code email
    try {
      await sendPasswordResetCode(user.email, user.name, resetCode);
      console.log(`✅ Password reset code sent to: ${user.email}`);
    } catch (emailError) {
      console.error(`⚠️ Could not send email: ${emailError.message}. Please check your EMAIL_PASSWORD or email provider settings.`);
      return res.status(500).json({
        message: "Unable to send reset code at the moment. Please try again later.",
      });
    }

    // Mask the email for display (like Facebook)
    const maskedEmail = email.replace(
      /^(.{2})(.*)(@.*)$/,
      (_, start, middle, domain) => start + "*".repeat(middle.length) + domain
    );

    res.json({
      message: "We sent a code to your email",
      maskedEmail,
      email: user.email,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      message: "Failed to process password reset request",
    });
  }
};

// 🔐 VERIFY RESET CODE - Step 2: Verify the 6-digit code (Facebook-style)
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    // Hash the provided code to compare with stored hash
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    // Find user with matching email, code, and non-expired code
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedCode,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired code. Please try again.",
      });
    }

    // Generate a temporary reset token for the password change step
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Update the token (reuse the same field) with 15 min expiry
    await User.updateOne(
      { _id: user._id },
      {
        resetPasswordToken: hashedResetToken,
        resetPasswordExpire: Date.now() + 15 * 60 * 1000,
      }
    );

    res.json({
      message: "Code verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error("Verify reset code error:", error);
    res.status(500).json({ message: "Failed to verify code" });
  }
};

// 🔑 RESEND RESET CODE - Resend the 6-digit code
export const resendResetCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: "If an account exists for that email, a new reset code has been sent.",
      });
    }

    // Generate new 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the code for storage
    const hashedCode = crypto
      .createHash("sha256")
      .update(resetCode)
      .digest("hex");

    // Set code expiration (10 minutes)
    const resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    // Update user
    await User.updateOne(
      { _id: user._id },
      {
        resetPasswordToken: hashedCode,
        resetPasswordExpire: resetPasswordExpire,
      }
    );

    // Send password reset code email
    try {
      await sendPasswordResetCode(user.email, user.name, resetCode);
      console.log(`✅ Password reset code resent to: ${user.email}`);
    } catch (emailError) {
      console.error(`⚠️ Could not send email: ${emailError.message}. Please check your EMAIL_PASSWORD or email provider settings.`);
      return res.status(500).json({ message: "Unable to resend code right now." });
    }

    res.json({
      message: "A new code has been sent to your email.",
    });
  } catch (error) {
    console.error("Resend reset code error:", error);
    res.status(500).json({ message: "Failed to resend code" });
  }
};

// 🔄 RESET PASSWORD - Step 3: Set new password
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
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
        .json({ message: "Invalid or expired reset token. Please start over." });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      message: "Password reset successfully! You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: error.message });
  }
};
// 📱 PHONE VERIFICATION
// 1. Start Verification (Send OTP)
export const startPhoneVerification = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Check if phone is already taken by ANOTHER user
    const existingUser = await User.findOne({ phone: phone, _id: { $ne: req.user._id } });
    if (existingUser) {
      return res.status(400).json({ message: "Phone number already in use by another account" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit code for phone
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash it
    const hashedCode = crypto
      .createHash("sha256")
      .update(verificationCode)
      .digest("hex");

    // Update user with temp phone and code
    user.tempPhone = phone;
    user.phoneVerificationCode = hashedCode;
    user.phoneVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();

    res.json({
      message: "Verification code sent to phone.",
    });

  } catch (error) {
    console.error("Phone verification error:", error.message);
    console.error("Phone verification error stack:", error.stack);
    console.error("Phone verification error full:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    res.status(500).json({ message: error.message || "Failed to send verification code" });
  }
};

// 2. Verify Code & Update Phone
export const verifyPhone = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Verification code is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.tempPhone || !user.phoneVerificationCode) {
      return res.status(400).json({ message: "No verification in progress" });
    }

    if (user.phoneVerificationExpire < Date.now()) {
      return res.status(400).json({ message: "Verification code expired" });
    }

    // Verify hash
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    if (hashedCode !== user.phoneVerificationCode) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Success! Update real phone
    user.phone = user.tempPhone;
    user.tempPhone = undefined;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpire = undefined;

    await user.save();

    res.json({
      message: "Phone number verified and updated successfully",
      phone: user.phone
    });

  } catch (error) {
    console.error("Verify phone error:", error);
    res.status(500).json({ message: "Failed to verify phone" });
  }
};

// 📧 REQUEST DELETE ACCOUNT OTP (Google users only)
export const requestDeleteOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.googleId) {
      return res.status(400).json({ message: "This endpoint is only for Google-authenticated accounts" });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP for secure storage
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Store hashed OTP and expiry (10 minutes)
    await User.updateOne(
      { _id: user._id },
      {
        deleteAccountOtp: hashedOtp,
        deleteAccountOtpExpire: Date.now() + 10 * 60 * 1000,
      }
    );

    // Send the OTP email
    try {
      await sendDeleteAccountOtp(user.email, user.name, otp);
      console.log(`✅ Delete account OTP sent to: ${user.email}`);
    } catch (emailError) {
      console.error(`⚠️ Could not send email: ${emailError.message}. Please check your EMAIL_PASSWORD or email provider settings.`);
      return res.status(500).json({ message: "Unable to send confirmation code right now." });
    }

    res.json({
      message: "A confirmation code has been sent to your email address.",
      email: user.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + "*".repeat(b.length) + c),
    });

  } catch (error) {
    console.error("Request delete OTP error:", error);
    res.status(500).json({ message: "Failed to send confirmation email. Please try again." });
  }
};

// 🗑️ DELETE ACCOUNT
export const deleteAccount = async (req, res) => {
  try {
    const { password, otpCode } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isGoogleUser = !!user.googleId;

    if (isGoogleUser) {
      // ── Google users must verify via OTP sent to their email ──
      if (!otpCode) {
        return res.status(400).json({ message: "Confirmation code is required" });
      }

      if (!user.deleteAccountOtp || !user.deleteAccountOtpExpire) {
        return res.status(400).json({ message: "No confirmation code found. Please request a new one." });
      }

      if (user.deleteAccountOtpExpire < Date.now()) {
        return res.status(400).json({ message: "Confirmation code has expired. Please request a new one." });
      }

      const hashedOtp = crypto.createHash("sha256").update(otpCode.toString()).digest("hex");
      if (hashedOtp !== user.deleteAccountOtp) {
        return res.status(401).json({ message: "Invalid confirmation code. Please check and try again." });
      }

    } else {
      // ── Regular users must verify via their password ──
      if (!password) {
        return res.status(400).json({ message: "Password is required to delete your account" });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password. Cannot delete account." });
      }
    }

    // Hard delete the account
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: "Your account has been successfully deleted." });

  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Failed to delete account", error: error.message });
  }
};
