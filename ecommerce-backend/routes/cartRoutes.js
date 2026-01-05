import express from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity, 
  
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCart);
router.post("/add", protect, addToCart);
router.delete("/remove/:productId", protect, removeFromCart);
router.put("/:productId", protect, updateCartQuantity); // Uncomment and fix this

export default router;