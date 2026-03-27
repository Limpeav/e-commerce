import express from "express";
import {
  getProducts,
  getProductById,
  updateProduct,
  createProduct,
  createProductReview,
} from "../controllers/productController.js";
import upload from "../middleware/upload.js";
import Product from '../models/Product.js';
import { protect, admin, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// CREATE
router.post("/", protect, admin, upload.single("image"), createProduct);

// REVIEWS
router.route("/:id/reviews").post(protect, createProductReview);

// READ ALL
router.get("/", getProducts);

// READ ONE (🔥 THIS FIXES YOUR ERROR)
router.get("/:id", optionalAuth, getProductById);

// UPDATE (🔥 FIXED WITH CLOUDINARY)
router.put("/:id", protect, admin, upload.single("image"), updateProduct);

// DELETE
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
