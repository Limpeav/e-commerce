import express from "express";
import {
  registerUser,
  loginUser,
  updateUserProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/profile", protect, updateUserProfile);

export default router;
