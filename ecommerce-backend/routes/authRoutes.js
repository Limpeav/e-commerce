import express from "express";
import { googleAuth } from "../controllers/googleAuthController.js";

const router = express.Router();

// Google OAuth
router.post("/google", googleAuth);

// Admin login is handled in adminRoutes.js at /api/admin/login
// This file is kept for other auth routes if needed

export default router;
