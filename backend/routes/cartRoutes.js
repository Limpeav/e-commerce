import express from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity, 
  clearCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCart);
router.post("/add", protect, addToCart);
router.delete("/remove/:productId", protect, removeFromCart);
router.put("/:productId", protect, updateCartQuantity);
router.delete("/", protect, clearCart);

export default router;