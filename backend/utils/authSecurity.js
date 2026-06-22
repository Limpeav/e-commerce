import crypto from "crypto";
import jwt from "jsonwebtoken";

export const PORTAL_TOKEN_ISSUER = "ecommerce-backend";
export const PORTAL_TOKEN_AUDIENCE = "ecommerce-admin-portal";
export const PORTAL_TOKEN_TTL = "15m";
export const PORTAL_CHALLENGE_TTL = "5m";

export const normalizeEmail = (email = "") =>
  String(email).trim().toLowerCase();

export const validatePortalPassword = (password = "") => {
  const value = String(password);
  const errors = [];

  if (value.length < 12) errors.push("at least 12 characters");
  if (!/[a-z]/.test(value)) errors.push("a lowercase letter");
  if (!/[A-Z]/.test(value)) errors.push("an uppercase letter");
  if (!/\d/.test(value)) errors.push("a number");
  if (!/[^A-Za-z0-9]/.test(value)) errors.push("a special character");

  return {
    valid: errors.length === 0,
    message: errors.length
      ? `Password must contain ${errors.join(", ")}.`
      : "",
  };
};

export const validateCustomerPassword = (password = "") => {
  const value = String(password);
  const errors = [];

  if (value.length < 10) errors.push("at least 10 characters");
  if (!/[a-z]/.test(value)) errors.push("a lowercase letter");
  if (!/[A-Z]/.test(value)) errors.push("an uppercase letter");
  if (!/\d/.test(value)) errors.push("a number");
  if (!/[^A-Za-z0-9]/.test(value)) errors.push("a special character");

  return {
    valid: errors.length === 0,
    message: errors.length
      ? `Password must contain ${errors.join(", ")}.`
      : "",
  };
};

export const createPortalSessionToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
      type: "portal-session",
    },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: PORTAL_TOKEN_TTL,
      issuer: PORTAL_TOKEN_ISSUER,
      audience: PORTAL_TOKEN_AUDIENCE,
    }
  );

export const createPortalChallengeToken = (user, challengeId) =>
  jwt.sign(
    {
      id: user._id.toString(),
      challengeId,
      type: "portal-login-challenge",
    },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: PORTAL_CHALLENGE_TTL,
      issuer: PORTAL_TOKEN_ISSUER,
      audience: PORTAL_TOKEN_AUDIENCE,
    }
  );

export const verifyPortalToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: PORTAL_TOKEN_ISSUER,
    audience: PORTAL_TOKEN_AUDIENCE,
  });

export const generateLoginCode = () =>
  crypto.randomInt(100000, 1000000).toString();

export const generateChallengeId = () => crypto.randomBytes(24).toString("hex");

export const hashLoginCode = (code, challengeId) =>
  crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(`${challengeId}:${String(code)}`)
    .digest("hex");

export const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
};
