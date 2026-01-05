import express from "express";
import {
  getProducts,
  getProductById,
  updateProduct,
  createProduct,
} from "../controllers/productController.js";
import upload from "../middleware/upload.js";
import Product from '../models/Product.js'; 


const router = express.Router();

// CREATE
router.post("/", upload.single("image"), createProduct);

// READ ALL
router.get("/", getProducts);

// READ ONE (🔥 THIS FIXES YOUR ERROR)
router.get("/:id", getProductById);

// UPDATE (🔥 FIXED WITH CLOUDINARY)
router.put("/:id", upload.single("image"), updateProduct);

// DELETE
router.delete("/:id", async (req, res) => {
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
