import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

// Generate token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

// @desc    Register new admin
// @route   POST /api/admin/register
// @access  Private/Admin
export const registerAdmin = async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();
        const normalizedPhone = phone?.trim();

        if (!name || !normalizedEmail || !password) {
            return res
                .status(400)
                .json({ message: "Name, email, and password are required" });
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
            role: "admin", // Force admin role
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

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        // Validate input
        if (!normalizedEmail || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Check if user is admin
        if (user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admin only." });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ message: error.message || "Server error during login" });
    }
};
