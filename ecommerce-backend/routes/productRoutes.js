import express from "express";
import {
  getProducts,
  getProductsByCategory,
  getProductById,
  updateProduct,
  createProduct,
  deleteProduct,
  createProductReview,
} from "../controllers/productController.js";
import upload from "../middleware/upload.js";
import { protect, admin, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, admin, upload.single("image"), createProduct);

router.route("/:id/reviews").post(protect, createProductReview);

router.get("/search", getProducts);
router.get("/category/:category", getProductsByCategory);

router.get("/", getProducts);

router.get("/:id", optionalAuth, getProductById);

router.put("/:id", protect, admin, upload.single("image"), updateProduct);

router.delete("/:id", protect, admin, deleteProduct);

export default router;
