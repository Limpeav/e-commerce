import express from "express";
import { getPublicFinancialSettings } from "../controllers/settingsController.js";

const router = express.Router();

router.get("/financial", getPublicFinancialSettings);

export default router;
