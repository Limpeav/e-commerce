import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  sendAccountVerificationCode,
  sendPasswordResetCode,
  sendDeleteAccountOtp,
} from "../utils/sendEmail.js";
import { emitDomainChanged } from "../realtime/socket.js";
import { normalizeCambodiaMobilePhone } from "../utils/cambodiaPhone.js";
import { PORTAL_ROLES } from "../constants/roles.js";
import { validatePortalPassword } from "../utils/authSecurity.js";

// Customer sessions should remain valid until the user logs out or deletes the account.
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const generateSixDigitCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const hashCode = (code) => crypto.createHash("sha256").update(code).digest("hex");

const parsePreferenceBoolean = (value, defaultValue = true) => {
  if (value === true || value === "true" || value === "1" || value === 1) return true;
  if (value === false || value === "false" || value === "0" || value === 0) return false;
  return defaultValue;
};

// 🟢 REGISTER (admin or user)
export const registerUser = async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);
    const normalizedPhone = normalizeCambodiaMobilePhone(req.body.phone);

    if (!name || !email || !req.body.phone || !password) {
      return res.status(400).json({ message: "Name, email, phone number, and password are required" });
    }

    if (!normalizedPhone) {
      return res.status(400).json({ message: "Please enter a valid Cambodia phone number" });
    }

    const userExists = await User.findOne({ email }).collation({ locale: "en", strength: 2 });
    if (userExists) {
      if (!userExists.isVerified && userExists.verificationCode) {
        const verificationCode = generateSixDigitCode();
        userExists.verificationCode = hashCode(verificationCode);
        userExists.verificationCodeExpires = Date.now() + 10 * 60 * 1000;
        await userExists.save();

        try {
          await sendAccountVerificationCode(userExists.email, userExists.name, verificationCode);
          console.log(`✅ Account verification code resent to: ${userExists.email}`);
        } catch (emailError) {
          console.error(`⚠️ Could not resend verification email: ${emailError.message}`);
          return res.status(500).json({
            message: "Unable to send verification code right now. Please try again later.",
          });
        }

        return res.status(200).json({
          _id: userExists._id,
          name: userExists.name,
          phone: userExists.phone,
          email: userExists.email,
          role: userExists.role,
          isVerified: userExists.isVerified,
          requiresEmailVerification: true,
          message: "This account is waiting for email verification. We sent a new code.",
        });
      }

      return res.status(409).json({
        message: "This email is already registered. Please use a different email or login.",
      });
    }

    const phoneExists = await User.findOne({ phone: normalizedPhone });
    if (phoneExists) {
      return res.status(409).json({ message: "Phone number already in use" });
    }

    const verificationCode = generateSixDigitCode();
    const hashedVerificationCode = hashCode(verificationCode);
    const verificationCodeExpires = Date.now() + 10 * 60 * 1000;

    const user = await User.create({
      name,
      phone: normalizedPhone,
      email,
      password,
      role: "user",
      isVerified: false,
      verificationCode: hashedVerificationCode,
      verificationCodeExpires,
    });

    try {
      await sendAccountVerificationCode(user.email, user.name, verificationCode);
      console.log(`✅ Account verification code sent to: ${user.email}`);
    } catch (emailError) {
      await User.findByIdAndDelete(user._id);
      console.error(`⚠️ Could not send verification email: ${emailError.message}`);
      return res.status(500).json({
        message: "Unable to send verification code right now. Please try again later.",
      });
    }

    emitDomainChanged("users", "created", { userId: user._id, role: user.role });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      requiresEmailVerification: true,
      message: "Account created. We sent a verification code to your email.",
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({
        message: "This email is already registered. Please use a different email or login.",
      });
    }

    res.status(500).json({ message: error.message });
  }
};

// 📧 VERIFY REGISTRATION EMAIL
export const verifyRegistrationEmail = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = req.body.code?.toString().trim();

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid verification code. Please check the code and try again." });
    }

    if (!user.verificationCode || user.verificationCode !== hashCode(code)) {
      return res.status(400).json({ message: "Invalid verification code. Please check the code and try again." });
    }

    if (!user.verificationCodeExpires || user.verificationCodeExpires <= Date.now()) {
      return res.status(400).json({ message: "Verification code has expired. Please request a new code." });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.json({
      message: "Email verified successfully. You can now log in.",
      email: user.email,
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error("Verify registration email error:", error);
    res.status(500).json({ message: "Failed to verify email" });
  }
};

// 📧 RESEND REGISTRATION VERIFICATION CODE
export const resendRegistrationVerificationCode = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found for this email." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "This email is already verified." });
    }

    const verificationCode = generateSixDigitCode();
    user.verificationCode = hashCode(verificationCode);
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    try {
      await sendAccountVerificationCode(user.email, user.name, verificationCode);
      console.log(`✅ Account verification code resent to: ${user.email}`);
    } catch (emailError) {
      console.error(`⚠️ Could not resend verification email: ${emailError.message}`);
      return res.status(500).json({ message: "Unable to resend verification code right now." });
    }

    res.json({ message: "A new verification code has been sent to your email." });
  } catch (error) {
    console.error("Resend registration verification code error:", error);
    res.status(500).json({ message: "Failed to resend verification code" });
  }
};

// 🔵 LOGIN (ADMIN + USER)
export const loginUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified && user.verificationCode) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        requiresEmailVerification: true,
        email: user.email,
      });
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
      isVerified: user.isVerified,
      notificationPreferences: user.notificationPreferences || { promotionalEmails: true },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔄 UPDATE USER PROFILE
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+tokenVersion");

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
      const normalizedPhone = normalizeCambodiaMobilePhone(req.body.phone);

      if (!normalizedPhone) {
        return res.status(400).json({ message: "Please enter a valid Cambodia phone number" });
      }

      if (normalizedPhone !== user.phone) {
        const phoneExists = await User.findOne({
          phone: normalizedPhone,
          _id: { $ne: req.user._id }
        });
        if (phoneExists) {
          return res.status(400).json({ message: "Phone number already in use" });
        }
      }
      user.phone = normalizedPhone;
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

      if (PORTAL_ROLES.includes(user.role)) {
        const passwordCheck = validatePortalPassword(req.body.newPassword);
        if (!passwordCheck.valid) {
          return res.status(400).json({ message: passwordCheck.message });
        }
        user.tokenVersion = (user.tokenVersion || 0) + 1;
      }

      user.password = req.body.newPassword;
    }

    const updatedUser = await user.save();
    emitDomainChanged("users", "updated", {
      userId: updatedUser._id,
      role: updatedUser.role,
    });

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      role: updatedUser.role,
      notificationPreferences: updatedUser.notificationPreferences || { promotionalEmails: true },
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("notificationPreferences");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      promotionalEmails: user.notificationPreferences?.promotionalEmails !== false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.notificationPreferences = {
      ...(user.notificationPreferences?.toObject?.() || user.notificationPreferences || {}),
      promotionalEmails: parsePreferenceBoolean(req.body.promotionalEmails, true),
    };

    await user.save();

    res.json({
      promotionalEmails: user.notificationPreferences.promotionalEmails,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔑 FORGOT PASSWORD - Step 1: Send 6-digit code to email (Facebook-style)
export const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim();

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
    const resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    // Update user directly to avoid pre-save hooks
    await User.updateOne(
      { _id: user._id },
      {
        resetPasswordToken: hashedCode,
        resetPasswordExpires,
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
    const email = req.body.email?.trim();
    const code = req.body.code?.toString().trim();

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    // Hash the provided code to compare with stored hash
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    // Find user with matching email, code, and non-expired code
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: Date.now() },
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
        resetPasswordExpires: Date.now() + 15 * 60 * 1000,
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
    const email = req.body.email?.trim();

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
    const resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    // Update user
    await User.updateOne(
      { _id: user._id },
      {
        resetPasswordToken: hashedCode,
        resetPasswordExpires,
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
    const token = req.body.token?.toString().trim();
    const { password } = req.body;

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
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+tokenVersion");

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token. Please start over." });
    }

    if (PORTAL_ROLES.includes(user.role)) {
      const passwordCheck = validatePortalPassword(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ message: passwordCheck.message });
      }
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

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
    const normalizedPhone = normalizeCambodiaMobilePhone(phone);

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (!normalizedPhone) {
      return res.status(400).json({ message: "Please enter a valid Cambodia phone number" });
    }

    // Check if phone is already taken by ANOTHER user
    const existingUser = await User.findOne({
      phone: normalizedPhone,
      _id: { $ne: req.user._id },
    });
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
    user.tempPhone = normalizedPhone;
    user.phoneVerificationCode = hashedCode;
    user.phoneVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();

    const responsePayload = {
      message: "Verification code sent to phone.",
    };

    if (process.env.NODE_ENV !== "production") {
      responsePayload.devVerificationCode = verificationCode;
      console.log(`Phone verification code for ${normalizedPhone}: ${verificationCode}`);
    }

    res.json(responsePayload);

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

// 📧 REQUEST DELETE ACCOUNT OTP
export const requestDeleteOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
    const { otpCode } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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

    // Hard delete the account
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: "Your account has been successfully deleted." });

  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Failed to delete account", error: error.message });
  }
};
