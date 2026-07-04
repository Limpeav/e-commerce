import express from "express";
import rateLimit from "express-rate-limit";
import { googleAuth } from "../controllers/googleAuthController.js";

const router = express.Router();
const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Google OAuth
router.post("/google", googleAuthLimiter, googleAuth);

// Admin login is handled in adminRoutes.js at /api/admin/login
// This file is kept for other auth routes if needed

export default router;
