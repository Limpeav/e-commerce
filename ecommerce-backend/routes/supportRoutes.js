import express from "express";
import {
  getFaqs,
  submitContactForm,
  getSupportTickets,
  updateSupportTicketStatus,
} from "../controllers/supportController.js";
import { admin, optionalAuth, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/faqs", getFaqs);
router.post("/contact", optionalAuth, submitContactForm);
router.get("/tickets", protect, admin, getSupportTickets);
router.put("/tickets/:id/status", protect, admin, updateSupportTicketStatus);

export default router;
