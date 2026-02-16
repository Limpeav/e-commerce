import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendPasswordResetCode } from "../utils/sendEmail.js";

// 🔐 generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// 🟢 REGISTER (user only)
export const registerUser = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.trim();

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (normalizedPhone) {
      const phoneExists = await User.findOne({ phone: normalizedPhone });
      if (phoneExists) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
    }

    const user = await User.create({
      name: name.trim(),
      phone: normalizedPhone,
      email: normalizedEmail,
      password,
      role: "user",
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      addresses: user.addresses || [],
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
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
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
      addresses: user.addresses || [],
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
      addresses: updatedUser.addresses || [],
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
      // Return error so user knows the account doesn't exist (like Facebook)
      return res.status(404).json({
        message: "No account found with that email address.",
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
      console.error("❌ Failed to send email:", emailError.message);
      // Log the code for manual use if email fails (dev only)
      if (process.env.NODE_ENV !== "production") {
        console.log("\n📋 RESET CODE (dev mode):", resetCode, "\n");
      }
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
      return res.status(404).json({
        message: "No account found with that email address.",
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
      console.error("❌ Failed to resend email:", emailError.message);
      if (process.env.NODE_ENV !== "production") {
        console.log("\n📋 RESET CODE (dev mode):", resetCode, "\n");
      }
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

    // MOCK SMS sending (since we don't have SMS provider)
    // In production, integrate Twilio here
    console.log(`📱 [MOCK SMS] Verification code for ${phone}: ${verificationCode}`);

    // For now, we will ALSO send it to email if possible to simulate "sending"
    // or just return success and let frontend ask for code (dev mode)
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n📱 PHONE VERIFICATION CODE for ${phone}: ${verificationCode}\n`);
    }

    // Response
    res.json({
      message: "Verification code sent to phone (mocked)",
      // In dev mode, return code for easier testing if email fails
      devCode: process.env.NODE_ENV !== "production" ? verificationCode : undefined
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

// 3. Save Phone Number Directly (without OTP)
export const savePhoneNumber = async (req, res) => {
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

    // Directly save the phone number
    user.phone = phone;
    await user.save();

    res.json({
      message: "Phone number saved successfully",
      phone: user.phone
    });

  } catch (error) {
    console.error("Save phone error:", error);
    res.status(500).json({ message: error.message || "Failed to save phone number" });
  }
};

const normalizeAddressInput = (payload = {}, fallback = {}) => ({
  label: (payload.label ?? fallback.label ?? "Address").toString().trim() || "Address",
  fullName: (payload.fullName ?? fallback.fullName ?? "").toString().trim(),
  phone: (payload.phone ?? fallback.phone ?? "").toString().trim(),
  addressLine1: (payload.addressLine1 ?? fallback.addressLine1 ?? "").toString().trim(),
  addressLine2: (payload.addressLine2 ?? fallback.addressLine2 ?? "").toString().trim(),
  city: (payload.city ?? fallback.city ?? "").toString().trim(),
  postalCode: (payload.postalCode ?? fallback.postalCode ?? "").toString().trim(),
  country: (payload.country ?? fallback.country ?? "Cambodia").toString().trim() || "Cambodia",
  latitude:
    payload.latitude !== undefined && payload.latitude !== null && payload.latitude !== ""
      ? Number(payload.latitude)
      : fallback.latitude,
  longitude:
    payload.longitude !== undefined && payload.longitude !== null && payload.longitude !== ""
      ? Number(payload.longitude)
      : fallback.longitude,
  isDefault: Boolean(payload.isDefault ?? fallback.isDefault),
});

const validateAddressPayload = (address) => {
  if (!address.fullName || !address.phone || !address.addressLine1 || !address.city) {
    return "fullName, phone, addressLine1, and city are required";
  }

  if (
    (address.latitude !== undefined && !Number.isFinite(address.latitude)) ||
    (address.longitude !== undefined && !Number.isFinite(address.longitude))
  ) {
    return "Latitude and longitude must be valid numbers";
  }

  return null;
};

const clearDefaultAddress = (addresses = []) => {
  for (const address of addresses) {
    address.isDefault = false;
  }
};

// 📍 ADDRESS MANAGEMENT
export const getUserAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user.addresses || []);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch addresses" });
  }
};

export const addUserAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if ((user.addresses || []).length >= 10) {
      return res.status(400).json({ message: "Address limit reached (10)" });
    }

    const nextAddress = normalizeAddressInput(req.body);
    const validationError = validateAddressPayload(nextAddress);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (nextAddress.isDefault || !user.addresses.length) {
      clearDefaultAddress(user.addresses);
      nextAddress.isDefault = true;
    }

    user.addresses.push(nextAddress);
    await user.save();

    return res.status(201).json(user.addresses);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to add address" });
  }
};

export const updateUserAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const updatedAddress = normalizeAddressInput(req.body, address.toObject());
    const validationError = validateAddressPayload(updatedAddress);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (updatedAddress.isDefault) {
      clearDefaultAddress(user.addresses);
    }

    address.label = updatedAddress.label;
    address.fullName = updatedAddress.fullName;
    address.phone = updatedAddress.phone;
    address.addressLine1 = updatedAddress.addressLine1;
    address.addressLine2 = updatedAddress.addressLine2;
    address.city = updatedAddress.city;
    address.postalCode = updatedAddress.postalCode;
    address.country = updatedAddress.country;
    address.latitude = updatedAddress.latitude;
    address.longitude = updatedAddress.longitude;
    address.isDefault = updatedAddress.isDefault;

    if (user.addresses.length > 0 && !user.addresses.some((item) => item.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return res.json(user.addresses);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to update address" });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    clearDefaultAddress(user.addresses);
    const nextDefault = user.addresses.id(req.params.addressId);
    if (!nextDefault) {
      return res.status(404).json({ message: "Address not found" });
    }
    nextDefault.isDefault = true;

    await user.save();
    return res.json(user.addresses);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to set default address" });
  }
};

export const deleteUserAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return res.json(user.addresses);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to delete address" });
  }
};
