import express from "express";
import rateLimit from "express-rate-limit";
import {
  addCustomerTicketReply,
  getCustomerTicket,
  getFaqs,
  getMySupportTickets,
  getSupportTicketLookups,
  getSupportTickets,
  reopenCustomerTicket,
  submitContactForm,
  updateSupportTicketStatus,
} from "../controllers/supportController.js";
import { admin, optionalAuth, protect } from "../middleware/authMiddleware.js";
import { createSupportAttachmentUpload } from "../middleware/upload.js";

const router = express.Router();
const supportAttachmentUpload = createSupportAttachmentUpload();

const createTicketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many support requests. Please wait and try again.",
});

const replyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many support replies. Please wait and try again.",
});

const uploadAttachments = (req, res, next) => {
  supportAttachmentUpload.array("attachments", 5)(req, res, (error) => {
    if (error) {
      res.status(400);
      next(error);
      return;
    }

    next();
  });
};

router.get("/faqs", getFaqs);
router.get("/lookups", getSupportTicketLookups);

router.post("/contact", createTicketLimiter, optionalAuth, uploadAttachments, submitContactForm);
router.post("/tickets", createTicketLimiter, optionalAuth, uploadAttachments, submitContactForm);
router.get("/tickets/my", protect, getMySupportTickets);
router.get("/tickets", protect, admin, getSupportTickets);
router.get("/tickets/:ticketNumber", optionalAuth, getCustomerTicket);
router.post(
  "/tickets/:ticketNumber/replies",
  replyLimiter,
  optionalAuth,
  uploadAttachments,
  addCustomerTicketReply
);
router.post(
  "/tickets/:ticketNumber/reopen",
  replyLimiter,
  optionalAuth,
  uploadAttachments,
  reopenCustomerTicket
);

// Backwards-compatible admin status update route.
router.put("/tickets/:id/status", protect, admin, updateSupportTicketStatus);

export default router;
