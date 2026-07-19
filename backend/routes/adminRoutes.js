import express from "express";
import rateLimit from "express-rate-limit";
import {
    getDashboardData,
    getDailyCashReport,
    getCsvBuilderDraft,
    getSentimentReport,
    saveCsvBuilderDraft,
    uploadProductImage,
} from "../controllers/adminController.js";
import {
    registerAdmin,
    loginAdmin,
    verifyAdminLogin,
    forgotPortalPassword,
    getAdminProfile,
    logoutPortalSession,
    resendPortalResetCode,
    resetPortalPassword,
    updatePortalProfile,
    verifyPortalResetCode,
} from "../controllers/adminAuthController.js";
import {
    createStaffLogin,
    getAllUsers,
    getUserById,
    updateStaffLogin,
    updateUserRole,
    deleteUser,
} from "../controllers/userManagementController.js";
import { translateText } from "../controllers/translationController.js";
import {
    getAdminFinancialSettings,
    getSettings,
    updateAdminFinancialSettings,
    updateSettings,
} from "../controllers/settingsController.js";
import { protect, admin, portalAccess } from "../middleware/authMiddleware.js";
import { cleanupOrphanedReviews } from "../utils/cleanupReviews.js";
import { createMemoryImageUpload } from "../middleware/upload.js";

const router = express.Router();
const productImageUpload = createMemoryImageUpload();
const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
});
const adminMfaLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
});
const adminResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth routes
router.post("/register", protect, admin, registerAdmin);
router.post("/login", adminLoginLimiter, loginAdmin);
router.post("/login/verify", adminMfaLimiter, verifyAdminLogin);
router.post("/forgot-password", adminResetLimiter, forgotPortalPassword);
router.post("/forgot-password/resend", adminResetLimiter, resendPortalResetCode);
router.post("/forgot-password/verify", adminResetLimiter, verifyPortalResetCode);
router.post("/reset-password", adminResetLimiter, resetPortalPassword);
router.post("/logout", protect, portalAccess, logoutPortalSession);
router.get("/me", protect, portalAccess, getAdminProfile);
router.put("/me", protect, portalAccess, updatePortalProfile);

// Dashboard
router.get("/dashboard", protect, portalAccess, getDashboardData);
router.get("/cash-report", protect, portalAccess, getDailyCashReport);
router.get("/csv-builder-draft", protect, admin, getCsvBuilderDraft);
router.put("/csv-builder-draft", protect, admin, saveCsvBuilderDraft);
router.get("/sentiment-report", protect, portalAccess, getSentimentReport);
router.get("/financial-settings", protect, admin, getAdminFinancialSettings);
router.put("/financial-settings", protect, admin, updateAdminFinancialSettings);
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
router.get("/users/:id", protect, admin, getUserById);
router.put("/users/:id", protect, admin, updateStaffLogin);
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
