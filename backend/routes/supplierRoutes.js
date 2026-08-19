import express from "express";
import {
  getSuppliers,
  getSupplierMetrics,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierProducts,
} from "../controllers/supplierController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, admin);

router.route("/")
  .get(getSuppliers)
  .post(createSupplier);

router.get("/metrics", getSupplierMetrics);

router.route("/:id")
  .get(getSupplierById)
  .put(updateSupplier)
  .delete(deleteSupplier);

router.get("/:id/products", getSupplierProducts);

export default router;
