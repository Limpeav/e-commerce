import express from "express";
import rateLimit from "express-rate-limit";
import {
    getDashboardData,
    getDailyCashReport,
    getCsvBuilderDraft,
    saveCsvBuilderDraft,
    uploadProductImage,
} from "../controllers/adminController.js";
import { registerAdmin, loginAdmin, getAdminProfile } from "../controllers/adminAuthController.js";
import {
    createStaffLogin,
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    getUserStats,
} from "../controllers/userManagementController.js";
import { translateText } from "../controllers/translationController.js";
import { protect, admin, portalAccess } from "../middleware/authMiddleware.js";
import { cleanupOrphanedReviews } from "../utils/cleanupReviews.js";
import { createUpload } from "../middleware/upload.js";
import {
    getSettings,
    updateSettings,
} from "../controllers/settingsController.js";

const router = express.Router();
const productImageUpload = createUpload("products/csv-builder");
const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth routes
router.post("/register", protect, admin, registerAdmin);
router.post("/login", adminLoginLimiter, loginAdmin);
router.get("/me", protect, portalAccess, getAdminProfile);

// Dashboard
router.get("/dashboard", protect, portalAccess, getDashboardData);
router.get("/cash-report", protect, portalAccess, getDailyCashReport);
router.get("/csv-builder-draft", protect, admin, getCsvBuilderDraft);
router.put("/csv-builder-draft", protect, admin, saveCsvBuilderDraft);
router.post(
    "/uploads/product-image",
    protect,
    admin,
    productImageUpload.single("image"),
    uploadProductImage
);
router.post("/translate", protect, admin, translateText);

// User management routes
router.get("/users", protect, admin, getAllUsers);
router.post("/users", protect, admin, createStaffLogin);
router.get("/users/stats", protect, admin, getUserStats); // ← must be before /:id
router.get("/users/:id", protect, admin, getUserById);
router.put("/users/:id/role", protect, admin, updateUserRole);
router.delete("/users/:id", protect, admin, deleteUser);

// Settings
router.get("/settings", protect, admin, getSettings);
router.put("/settings", protect, admin, updateSettings);

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
