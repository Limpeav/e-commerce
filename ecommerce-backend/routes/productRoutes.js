import express from "express";
import multer from "multer";
import {
  getProducts,
  getProductById,
  updateProduct,
  createProduct,
  createProductReview,
  importProductsFromCsv,
  sendStorePromotionEmailBlast,
  translateMissingProductsToKhmer,
  translateProductToKhmer,
  upsertProductsFromCsv,
} from "../controllers/productController.js";
import upload from "../middleware/upload.js";
import Product from '../models/Product.js';
import { protect, admin, optionalAuth } from "../middleware/authMiddleware.js";
import { emitDomainChanged } from "../realtime/socket.js";

const router = express.Router();
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

// CREATE
router.post("/", protect, admin, upload.single("image"), createProduct);
router.post("/import-csv", protect, admin, csvUpload.single("file"), importProductsFromCsv);
router.post("/upsert-csv", protect, admin, csvUpload.single("file"), upsertProductsFromCsv);
router.post("/promotions/email", protect, admin, sendStorePromotionEmailBlast);

// REVIEWS
router.route("/:id/reviews").post(protect, createProductReview);

// READ ALL
router.get("/", optionalAuth, getProducts);

// GENERATE MISSING KHMER TEXT FOR THE PRODUCT LIST
router.post("/translate-khmer-missing", optionalAuth, translateMissingProductsToKhmer);

// READ ONE (🔥 THIS FIXES YOUR ERROR)
router.get("/:id", optionalAuth, getProductById);

// GENERATE KHMER PRODUCT TEXT WHEN A KHMER USER OPENS AN OLD PRODUCT
router.post("/:id/translate-khmer", optionalAuth, translateProductToKhmer);

// UPDATE (🔥 FIXED WITH CLOUDINARY)
router.put("/:id", protect, admin, upload.single("image"), updateProduct);

// DELETE
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    emitDomainChanged("products", "deleted", { productId: deleted._id }, { users: true });
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
