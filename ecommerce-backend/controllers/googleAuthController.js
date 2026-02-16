import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const fetchGoogleUserInfo = async (accessToken) => {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Invalid Google access token");
  }

  return response.json();
};

// @desc    Google OAuth callback
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: "Google access token is required" });
    }

    const googleUser = await fetchGoogleUserInfo(accessToken);
    const { email, name, sub, email_verified: emailVerified } = googleUser;

    if (!email || !name || !sub) {
      return res.status(400).json({ message: "Incomplete Google profile data" });
    }

    if (!emailVerified) {
      return res.status(400).json({ message: "Google email is not verified" });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (user.googleId && user.googleId !== sub) {
        return res.status(403).json({
          message: "Google account mismatch for this email",
        });
      }

      if (!user.googleId) {
        user.googleId = sub;
        await user.save();
      }

      return res.json({
        _id: user._id,
        name: user.name,
        phone: user.phone || "",
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }

    // User doesn't exist, create new user
    user = await User.create({
      name,
      email: normalizedEmail,
      // phone is intentionally omitted for Google OAuth users (sparse unique index)
      password: crypto.randomBytes(32).toString("hex"),
      role: "user",
      googleId: sub,
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone || "",
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: error.message || "Google authentication failed" });
  }
};
