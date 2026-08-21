import express from "express";
import { handleSupplierTelegramWebhook } from "../controllers/telegramSupplierController.js";

const router = express.Router();

router.post("/supplier/webhook", handleSupplierTelegramWebhook);
router.post("/supplier/webhook/:secret", handleSupplierTelegramWebhook);

export default router;
