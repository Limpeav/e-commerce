import crypto from "crypto";
import User from "../models/userModel.js";
import { PORTAL_ROLES } from "../constants/roles.js";
import { sendPasswordResetCode, sendPortalLoginCode } from "../utils/sendEmail.js";
import {
  createPortalChallengeToken,
  createPortalSessionToken,
  generateChallengeId,
  generateLoginCode,
  hashLoginCode,
  normalizeEmail,
  safeEqual,
  validatePortalPassword,
  verifyPortalToken,
} from "../utils/authSecurity.js";

const genericLoginError = (res) =>
  res.status(401).json({ message: "Invalid email or password" });

const serializePortalUser = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  token,
  expiresIn: null,
});

const STAFF_ROLES = ["seller", "delivery"];

const serializePortalProfile = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

const maskEmail = (email) =>
  String(email).replace(
    /^(.{2})(.*)(@.*)$/,
    (_, start, middle, domain) => start + "*".repeat(middle.length) + domain
  );

const hashResetValue = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

export const registerAdmin = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const phone = req.body.phone?.trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const passwordCheck = validatePortalPassword(password);

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!passwordCheck.valid) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    if (await User.exists({ email })) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      phone,
      email,
      password,
      role: "admin",
      isVerified: true,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(500).json({ message: "Unable to create administrator" });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select(
      "+tokenVersion +portalLoginCodeHash +portalLoginChallengeId +portalLoginCodeExpires +portalLoginAttempts"
    );

    if (!user || !PORTAL_ROLES.includes(user.role)) {
      return genericLoginError(res);
    }

    if (!(await user.matchPassword(password))) {
      return genericLoginError(res);
    }

    const code = generateLoginCode();
    const challengeId = generateChallengeId();
    user.portalLoginCodeHash = hashLoginCode(code, challengeId);
    user.portalLoginChallengeId = challengeId;
    user.portalLoginCodeExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.portalLoginAttempts = 0;
    await user.save({ validateModifiedOnly: true });

    try {
      await sendPortalLoginCode(user.email, user.name, code);
    } catch (error) {
      user.portalLoginCodeHash = undefined;
      user.portalLoginChallengeId = undefined;
      user.portalLoginCodeExpires = undefined;
      await user.save({ validateModifiedOnly: true });
      console.error("Portal login email error:", error);
      return res.status(503).json({
        message: "Unable to send the security code. Please try again later.",
      });
    }

    return res.json({
      mfaRequired: true,
      challengeToken: createPortalChallengeToken(user, challengeId),
      message: "A security code was sent to your email.",
    });
  } catch (error) {
    console.error("Portal login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const verifyAdminLogin = async (req, res) => {
  try {
    const challengeToken = String(req.body.challengeToken || "");
    const code = String(req.body.code || "").trim();

    if (!challengeToken || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: "Enter the six-digit security code" });
    }

    let challenge;
    try {
      challenge = verifyPortalToken(challengeToken);
    } catch {
      return res.status(401).json({ message: "Security challenge expired. Sign in again." });
    }

    if (challenge.type !== "portal-login-challenge") {
      return res.status(401).json({ message: "Invalid security challenge" });
    }

    const user = await User.findById(challenge.id).select(
      "+tokenVersion +portalLoginCodeHash +portalLoginChallengeId +portalLoginCodeExpires +portalLoginAttempts"
    );

    if (
      !user ||
      !PORTAL_ROLES.includes(user.role) ||
      user.portalLoginChallengeId !== challenge.challengeId ||
      !user.portalLoginCodeHash ||
      !user.portalLoginCodeExpires ||
      user.portalLoginCodeExpires.getTime() <= Date.now()
    ) {
      return res.status(401).json({ message: "Security challenge expired. Sign in again." });
    }

    user.portalLoginAttempts = (user.portalLoginAttempts || 0) + 1;
    const codeMatches = safeEqual(
      user.portalLoginCodeHash,
      hashLoginCode(code, challenge.challengeId)
    );

    if (!codeMatches) {
      if (user.portalLoginAttempts >= 5) {
        user.portalLoginCodeHash = undefined;
        user.portalLoginChallengeId = undefined;
        user.portalLoginCodeExpires = undefined;
      }
      await user.save({ validateModifiedOnly: true });
      return res.status(401).json({ message: "Invalid or expired security code" });
    }

    user.portalLoginCodeHash = undefined;
    user.portalLoginChallengeId = undefined;
    user.portalLoginCodeExpires = undefined;
    user.portalLoginAttempts = 0;
    await user.save({ validateModifiedOnly: true });

    return res.json(serializePortalUser(user, createPortalSessionToken(user)));
  } catch (error) {
    console.error("Portal login verification error:", error);
    res.status(500).json({ message: "Unable to verify security code" });
  }
};

export const getAdminProfile = async (req, res) => {
  res.json(serializePortalProfile(req.user));
};

export const updatePortalProfile = async (req, res) => {
  try {
    if (!STAFF_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: "Staff profile access only" });
    }

    const name = req.body.name?.trim();
    const email = normalizeEmail(req.body.email);
    const phone = req.body.phone?.trim() || "";

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const existingEmailUser = await User.findOne({
      email,
      _id: { $ne: req.user._id },
    });

    if (existingEmailUser) {
      return res.status(409).json({ message: "Email is already in use" });
    }

    const user = await User.findById(req.user._id);
    if (!user || !STAFF_ROLES.includes(user.role)) {
      return res.status(404).json({ message: "Staff account not found" });
    }

    user.name = name;
    user.email = email;
    user.phone = phone;
    await user.save({ validateModifiedOnly: true });

    return res.json({
      message: "Profile updated successfully",
      user: serializePortalProfile(user),
    });
  } catch (error) {
    console.error("Portal profile update error:", error);
    return res.status(500).json({ message: "Unable to update profile" });
  }
};

export const forgotPortalPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const requestedRole = req.body.role;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    const roleAllowed =
      user &&
      STAFF_ROLES.includes(user.role) &&
      (!requestedRole || user.role === requestedRole);

    if (!roleAllowed) {
      return res.json({
        message: "If a staff account exists for that email, a reset code has been sent.",
      });
    }

    const resetCode = crypto.randomInt(100000, 1000000).toString();

    await User.updateOne(
      { _id: user._id },
      {
        resetPasswordToken: hashResetValue(resetCode),
        resetPasswordExpires: Date.now() + 10 * 60 * 1000,
      }
    );

    try {
      await sendPasswordResetCode(user.email, user.name, resetCode);
    } catch (emailError) {
      console.error("Portal password reset email error:", emailError);
      return res.status(503).json({
        message: "Unable to send reset code at the moment. Please try again later.",
      });
    }

    return res.json({
      message: "We sent a code to your email",
      maskedEmail: maskEmail(user.email),
      email: user.email,
    });
  } catch (error) {
    console.error("Portal forgot password error:", error);
    return res.status(500).json({ message: "Failed to process password reset request" });
  }
};

export const verifyPortalResetCode = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = req.body.code?.toString().trim();
    const requestedRole = req.body.role;

    if (!email || !/^\d{6}$/.test(code || "")) {
      return res.status(400).json({ message: "Email and six-digit code are required" });
    }

    if (requestedRole && !STAFF_ROLES.includes(requestedRole)) {
      return res.status(400).json({ message: "Invalid staff role" });
    }

    const query = {
      email,
      role: { $in: STAFF_ROLES },
      resetPasswordToken: hashResetValue(code),
      resetPasswordExpires: { $gt: Date.now() },
    };

    if (requestedRole) {
      query.role = requestedRole;
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired code. Please try again." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    await User.updateOne(
      { _id: user._id },
      {
        resetPasswordToken: hashResetValue(resetToken),
        resetPasswordExpires: Date.now() + 15 * 60 * 1000,
      }
    );

    return res.json({
      message: "Code verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error("Portal reset code verification error:", error);
    return res.status(500).json({ message: "Failed to verify code" });
  }
};

export const resetPortalPassword = async (req, res) => {
  try {
    const token = req.body.token?.toString().trim();
    const password = req.body.password;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    const passwordCheck = validatePortalPassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    const user = await User.findOne({
      role: { $in: STAFF_ROLES },
      resetPasswordToken: hashResetValue(token),
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+tokenVersion");

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token. Please start over.",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    return res.json({
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Portal reset password error:", error);
    return res.status(500).json({ message: "Unable to reset password" });
  }
};

export const logoutPortalSession = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+tokenVersion");

    if (!user) {
      return res.status(401).json({ message: "Session is no longer valid" });
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save({ validateModifiedOnly: true });

    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Portal logout error:", error);
    return res.status(500).json({ message: "Unable to complete logout" });
  }
};
