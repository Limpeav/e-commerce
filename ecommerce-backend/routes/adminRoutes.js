import express from "express";
import {
    getDashboardData,
    getSentimentReport,
    getFeedbackTrends,
    getInventoryReport,
    getReviewModerationQueue,
    moderateReview,
} from "../controllers/adminController.js";
import { registerAdmin, loginAdmin } from "../controllers/adminAuthController.js";
import {
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    getUserStats,
} from "../controllers/userManagementController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { cleanupOrphanedReviews } from "../utils/cleanupReviews.js";

const router = express.Router();

// Auth routes
router.post("/register", protect, admin, registerAdmin);
router.post("/login", loginAdmin);

// Dashboard
router.get("/dashboard", protect, admin, getDashboardData);
router.get("/reports/sentiment", protect, admin, getSentimentReport);
router.get("/reports/feedback-trends", protect, admin, getFeedbackTrends);
router.get("/reports/inventory", protect, admin, getInventoryReport);
router.get("/reviews", protect, admin, getReviewModerationQueue);
router.patch("/reviews/:productId/:reviewId", protect, admin, moderateReview);

// User management routes
router.get("/users", protect, admin, getAllUsers);
router.get("/users/stats", protect, admin, getUserStats);
router.get("/users/:id", protect, admin, getUserById);
router.put("/users/:id/role", protect, admin, updateUserRole);
router.delete("/users/:id", protect, admin, deleteUser);

// Cleanup orphaned reviews
router.post("/cleanup-reviews", protect, admin, async (req, res) => {
    try {
        const result = await cleanupOrphanedReviews();
        res.json({ 
            message: "Cleanup completed successfully", 
            ...result 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
