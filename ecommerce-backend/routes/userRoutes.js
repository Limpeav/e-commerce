import express from "express";
import {
  registerUser,
  loginUser,
  updateUserProfile,
  forgotPassword,
  verifyResetCode,
  resendResetCode,
  resetPassword,
  startPhoneVerification,
  verifyPhone,
  savePhoneNumber,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  setDefaultAddress,
  deleteUserAddress,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/resend-reset-code", resendResetCode);
router.post("/reset-password", resetPassword);
router.put("/profile", protect, updateUserProfile);
router.post("/start-phone-verification", protect, startPhoneVerification);
router.post("/verify-phone", protect, verifyPhone);
router.post("/save-phone", protect, savePhoneNumber);
router.get("/addresses", protect, getUserAddresses);
router.post("/addresses", protect, addUserAddress);
router.put("/addresses/:addressId", protect, updateUserAddress);
router.put("/addresses/:addressId/default", protect, setDefaultAddress);
router.delete("/addresses/:addressId", protect, deleteUserAddress);

export default router;
