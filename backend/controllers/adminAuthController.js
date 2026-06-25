import User from "../models/userModel.js";
import { PORTAL_ROLES } from "../constants/roles.js";
import { sendPortalLoginCode } from "../utils/sendEmail.js";
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
  role: user.role,
  token,
  expiresIn: null,
});

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
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role,
  });
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
