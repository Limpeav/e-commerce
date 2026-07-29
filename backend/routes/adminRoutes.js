import express from "express";
import rateLimit from "express-rate-limit";
import {
    getDashboardData,
    getDailyCashReport,
    getSentimentReport,
    uploadProductImage,
} from "../controllers/adminController.js";
import {
    registerAdmin,
    loginAdmin,
    verifyAdminLogin,
    changePortalPassword,
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
    updateAdminFinancialSettings,
} from "../controllers/settingsController.js";
import {
    addAdminInternalNote,
    addAdminSupportReply,
    getAdminTicket,
    getSupportTickets,
    reopenAdminTicket,
    updateAdminSupportAssignment,
    updateAdminSupportPriority,
    updateSupportTicketStatus,
} from "../controllers/supportController.js";
import { protect, admin, portalAccess } from "../middleware/authMiddleware.js";
import { cleanupOrphanedReviews } from "../utils/cleanupReviews.js";
import {
    createMemoryImageUpload,
    createSupportAttachmentUpload,
} from "../middleware/upload.js";

const router = express.Router();
const productImageUpload = createMemoryImageUpload();
const supportAttachmentUpload = createSupportAttachmentUpload();
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

const uploadSupportAttachments = (req, res, next) => {
    supportAttachmentUpload.array("attachments", 5)(req, res, (error) => {
        if (error) {
            res.status(400);
            next(error);
            return;
        }

        next();
    });
};

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
router.put("/me/password", protect, portalAccess, changePortalPassword);

// Dashboard
router.get("/dashboard", protect, portalAccess, getDashboardData);
router.get("/cash-report", protect, portalAccess, getDailyCashReport);
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

// Support ticket workflow
router.get("/support/tickets", protect, admin, getSupportTickets);
router.get("/support/tickets/:ticketNumber", protect, admin, getAdminTicket);
router.post(
    "/support/tickets/:ticketNumber/replies",
    protect,
    admin,
    uploadSupportAttachments,
    addAdminSupportReply
);
router.patch(
    "/support/tickets/:ticketNumber/status",
    protect,
    admin,
    updateSupportTicketStatus
);
router.patch(
    "/support/tickets/:ticketNumber/priority",
    protect,
    admin,
    updateAdminSupportPriority
);
router.patch(
    "/support/tickets/:ticketNumber/assignment",
    protect,
    admin,
    updateAdminSupportAssignment
);
router.post(
    "/support/tickets/:ticketNumber/internal-notes",
    protect,
    admin,
    addAdminInternalNote
);
router.post(
    "/support/tickets/:ticketNumber/reopen",
    protect,
    admin,
    reopenAdminTicket
);

// User management routes
router.get("/users", protect, admin, getAllUsers);
router.post("/users", protect, admin, createStaffLogin);
router.get("/users/:id", protect, admin, getUserById);
router.put("/users/:id", protect, admin, updateStaffLogin);
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
