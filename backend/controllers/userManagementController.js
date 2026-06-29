import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Product from "../models/Product.js";
import DeletedAccountLog from "../models/deletedAccountLogModel.js";
import { USER_ROLES } from "../constants/roles.js";
import { emitDomainChanged } from "../realtime/socket.js";
import { normalizeEmail, validatePortalPassword } from "../utils/authSecurity.js";
import { recordDeletedAccount } from "../utils/accountDeletionLog.js";

const STAFF_LOGIN_ROLES = ["seller", "delivery", "admin"];

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
});

// @desc    Create a seller portal login
// @route   POST /api/admin/users
// @access  Private/Admin
export const createStaffLogin = asyncHandler(async (req, res) => {
    const name = req.body.name?.trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const phone = req.body.phone?.trim();
    const role = req.body.role || "seller";

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const passwordCheck = validatePortalPassword(password);
    if (!passwordCheck.valid) {
        return res.status(400).json({ message: passwordCheck.message });
    }

    if (!STAFF_LOGIN_ROLES.includes(role)) {
        return res.status(400).json({ message: "Role must be admin, seller, or delivery" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({
            message: "A user with this email already exists. Change that user's role instead.",
        });
    }

    const user = await User.create({
        name,
        email,
        password,
        ...(phone ? { phone } : {}),
        role,
        isVerified: true,
    });
    emitDomainChanged("users", "created", { userId: user._id, role: user.role });

    res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
    });
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-password");

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error("User not found");
    }
});

// @desc    Update staff account information
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateStaffLogin = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("+tokenVersion");

    if (!user) {
        return res.status(404).json({ message: "Staff user not found" });
    }

    if (!["seller", "delivery"].includes(user.role)) {
        return res.status(400).json({ message: "Only staff accounts can be edited here" });
    }

    const name = req.body.name?.trim();
    const email = normalizeEmail(req.body.email);
    const phone = req.body.phone?.trim();
    const role = req.body.role;
    const password = String(req.body.password || "");

    if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
    }

    if (!["seller", "delivery"].includes(role)) {
        return res.status(400).json({ message: "Role must be seller or delivery" });
    }

    if (password) {
        const passwordCheck = validatePortalPassword(password);
        if (!passwordCheck.valid) {
            return res.status(400).json({ message: passwordCheck.message });
        }
    }

    const duplicateEmail = await User.exists({
        email,
        _id: { $ne: user._id },
    });
    if (duplicateEmail) {
        return res.status(409).json({ message: "A user with this email already exists" });
    }

    const loginIdentityChanged =
        user.email !== email || user.role !== role || Boolean(password);
    user.name = name;
    user.email = email;
    user.phone = phone || undefined;
    user.role = role;
    if (password) {
        user.password = password;
    }

    if (loginIdentityChanged) {
        user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    const updatedUser = await user.save();
    emitDomainChanged("users", "updated", {
        userId: updatedUser._id,
        role: updatedUser.role,
    });

    return res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
    });
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        const { role } = req.body;

        if (role && !USER_ROLES.includes(role)) {
            res.status(400);
            throw new Error("Invalid role");
        }

        if (
            user._id.toString() === req.user._id.toString() &&
            role &&
            role !== "admin"
        ) {
            res.status(400);
            throw new Error("Cannot remove your own admin access");
        }

        const previousRole = user.role;
        user.role = role || user.role;
        if (role && role !== previousRole) {
            user.tokenVersion = (user.tokenVersion || 0) + 1;
        }
        const updatedUser = await user.save();
        emitDomainChanged("users", "updated", {
            userId: updatedUser._id,
            role: updatedUser.role,
        });

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        // Prevent deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            res.status(400);
            throw new Error("Cannot delete your own account");
        }

        // Find all products that have reviews from this user
        const productsToUpdate = await Product.find({
            "reviews.user": user._id
        });

        // Remove user's reviews and recalculate ratings for each product
        for (const product of productsToUpdate) {
            // Remove reviews from this user
            product.reviews = product.reviews.filter(
                review => review.user.toString() !== user._id.toString()
            );

            // Recalculate rating and numReviews
            product.numReviews = product.reviews.length;
            
            if (product.reviews.length > 0) {
                product.rating =
                    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
                    product.reviews.length;
            } else {
                product.rating = 0;
            }

            await product.save();
        }

        await recordDeletedAccount({
            user,
            deletedBy: "admin",
            deletedByUser: req.user?._id,
        });
        await user.deleteOne();
        emitDomainChanged("users", "deleted", { userId: user._id });
        if (productsToUpdate.length) {
            emitDomainChanged("products", "reviews-removed", {
                productIds: productsToUpdate.map((product) => product._id),
            }, { users: true });
            emitDomainChanged("reviews", "deleted", { userId: user._id });
        }
        res.json({ message: "User and their reviews removed successfully" });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
});

// @desc    Get user statistics
// @route   GET /api/admin/users/stats
// @access  Private/Admin
export const getUserStats = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: "admin" });
    const sellerUsers = await User.countDocuments({ role: "seller" });
    const deliveryUsers = await User.countDocuments({ role: "delivery" });
    const regularUsers = await User.countDocuments({ role: "user" });
    const deletedCustomerStats = await DeletedAccountLog.aggregate([
        { $match: { role: "user" } },
        {
            $group: {
                _id: "$deletedBy",
                count: { $sum: 1 },
            },
        },
    ]);
    const deletedCustomersBySource = deletedCustomerStats.reduce(
        (counts, item) => ({
            ...counts,
            [item._id]: Number(item.count || 0),
        }),
        { self: 0, admin: 0 }
    );
    const deletedCustomers =
        deletedCustomersBySource.self + deletedCustomersBySource.admin;

    // Get recent users (last 5)
    const recentUsers = await User.find({})
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(5);

    res.json({
        totalUsers,
        adminUsers,
        sellerUsers,
        staffUsers: sellerUsers,
        deliveryUsers,
        regularUsers,
        deletedCustomers,
        deletedCustomersBySource,
        recentUsers,
    });
});
