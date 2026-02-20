import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

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
    const { email, name, picture, sub } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: "Missing required information from Google" });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, generate token and login
      // Update googleId if not already set
      if (sub && !user.googleId) {
        await User.updateOne({ _id: user._id }, { googleId: sub });
        user.googleId = sub;
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
      // User doesn't exist, create new user
      user = await User.create({
        name,
        email,
        // phone is intentionally omitted for Google OAuth users (sparse unique index)
        password: sub + Date.now() + Math.random(), // Random password (won't be used for Google auth)
        role: "user",
        googleId: sub, // Store Google ID
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
    res.status(500).json({ message: error.message || "Google authentication failed" });
  }
};
