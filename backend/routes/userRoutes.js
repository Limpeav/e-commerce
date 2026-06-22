import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerUser,
  verifyRegistrationEmail,
  resendRegistrationVerificationCode,
  loginUser,
  updateUserProfile,
  forgotPassword,
  verifyResetCode,
  resendResetCode,
  resetPassword,
  getNotificationPreferences,
  updateNotificationPreferences,
  startPhoneVerification,
  verifyPhone,
  requestDeleteOtp,
  deleteAccount,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, registerUser);
router.post("/verify-registration-email", resetLimiter, verifyRegistrationEmail);
router.post("/resend-registration-verification", resetLimiter, resendRegistrationVerificationCode);
router.post("/login", authLimiter, loginUser);
router.post("/forgot-password", resetLimiter, forgotPassword);
router.post("/verify-reset-code", resetLimiter, verifyResetCode);
router.post("/resend-reset-code", resetLimiter, resendResetCode);
router.post("/reset-password", resetLimiter, resetPassword);
router.put("/profile", protect, updateUserProfile);
router.get("/notification-preferences", protect, getNotificationPreferences);
router.put("/notification-preferences", protect, updateNotificationPreferences);
router.post("/start-phone-verification", protect, otpLimiter, startPhoneVerification);
router.post("/verify-phone", protect, otpLimiter, verifyPhone);
router.post("/request-delete-otp", protect, otpLimiter, requestDeleteOtp);
router.post("/delete-account", protect, otpLimiter, deleteAccount);

export default router;
