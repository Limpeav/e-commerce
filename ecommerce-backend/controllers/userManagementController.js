import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Product from "../models/Product.js";

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
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

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.role = req.body.role || user.role; // "admin" or "user"
        const updatedUser = await user.save();

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

        await user.deleteOne();
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
    const regularUsers = totalUsers - adminUsers;

    // Get recent users (last 5)
    const recentUsers = await User.find({})
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(5);

    res.json({
        totalUsers,
        adminUsers,
        regularUsers,
        recentUsers,
    });
});
