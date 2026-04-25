import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import axios from "axios";

// Generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
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

    const googleResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 10000,
      }
    );

    const { email, name, sub, email_verified: emailVerified } = googleResponse.data;

    if (!email || !name || !sub || !emailVerified) {
      return res.status(400).json({ message: "Invalid Google account response" });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      if (sub && !user.googleId) {
        user.googleId = sub;
        await user.save();
      }
      res.json({
        _id: user._id,
        name: user.name,
        phone: user.phone || "",
        email: user.email,
        role: user.role,
        googleId: user.googleId || null,
        token: generateToken(user._id),
      });
    } else {
      user = await User.create({
        name,
        email,
        role: "user",
        googleId: sub,
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        phone: user.phone || "",
        email: user.email,
        role: user.role,
        googleId: user.googleId || null,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    console.error("Google auth error:", error);
    const statusCode = error.response?.status === 401 ? 401 : 500;
    res.status(statusCode).json({ message: "Google authentication failed" });
  }
};
