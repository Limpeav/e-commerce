import express from "express";
import {
  createBanner,
  deleteBanner,
  getActiveBanners,
  getAdminBanners,
  updateBanner,
} from "../controllers/bannerController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { createUpload } from "../middleware/upload.js";

const router = express.Router();
const bannerUpload = createUpload("ecommerce-banners");

router.get("/", getActiveBanners);
router.get("/admin/all", protect, admin, getAdminBanners);
router.post("/", protect, admin, bannerUpload.single("image"), createBanner);
router.put("/:id", protect, admin, bannerUpload.single("image"), updateBanner);
router.delete("/:id", protect, admin, deleteBanner);

export default router;
