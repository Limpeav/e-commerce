import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { PORTAL_ROLES } from "../constants/roles.js";
import {
  PORTAL_TOKEN_AUDIENCE,
  PORTAL_TOKEN_ISSUER,
} from "../utils/authSecurity.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    req.auth = decoded;

    req.user = await User.findById(decoded.id).select("+tokenVersion -password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (decoded.type === "portal-session") {
      if (
        decoded.iss !== PORTAL_TOKEN_ISSUER ||
        decoded.aud !== PORTAL_TOKEN_AUDIENCE ||
        decoded.role !== req.user.role ||
        decoded.tokenVersion !== (req.user.tokenVersion || 0)
      ) {
        return res.status(401).json({ message: "Session is no longer valid" });
      }
    }

    next();
  } catch {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const admin = (req, res, next) => {
  if (
    req.user &&
    req.user.role === "admin" &&
    req.auth?.type === "portal-session"
  ) {
    next();
  } else {
    res.status(403).json({ message: "Admin access only" });
  }
};

export const adminOrSeller = (req, res, next) => {
  if (
    req.user &&
    ["admin", "seller"].includes(req.user.role) &&
    req.auth?.type === "portal-session"
  ) {
    next();
  } else {
    res.status(403).json({ message: "Admin or seller access only" });
  }
};

export const portalAccess = (req, res, next) => {
  if (
    req.user &&
    PORTAL_ROLES.includes(req.user.role) &&
    req.auth?.type === "portal-session"
  ) {
    next();
  } else {
    res.status(403).json({ message: "Seller portal access only" });
  }
};

export const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      // Invalid token, just proceed without user
      console.error("Optional auth error:", error.message);
    }
  }
  next();
};
