import asyncHandler from "express-async-handler";
import SupportTicket from "../models/supportTicketModel.js";
import Notification from "../models/notificationModel.js";
import { emitNotificationCreated } from "../realtime/socket.js";

const FAQS = [
  {
    category: "Orders & Delivery",
    questions: [
      {
        question: "How can I track my order?",
        answer:
          "Open My Orders and select an order to see its latest status and delivery progress.",
      },
      {
        question: "Can I cancel my order?",
        answer:
          "Orders can be cancelled while they are still pending or processing. Contact support immediately for help.",
      },
    ],
  },
  {
    category: "Payments",
    questions: [
      {
        question: "Do you support KHQR / Bakong?",
        answer:
          "Yes. You can choose BAKONG_KHQR during checkout and complete payment via the generated QR code.",
      },
      {
        question: "How do I know my payment is confirmed?",
        answer:
          "Payment status is shown in your order details and you will receive a payment update notification.",
      },
    ],
  },
  {
    category: "Account & Security",
    questions: [
      {
        question: "I forgot my password. What should I do?",
        answer:
          "Use Forgot Password on the login page to receive a verification code and reset your password.",
      },
      {
        question: "Can I save multiple addresses?",
        answer:
          "Yes. Add and manage addresses from your profile via the addresses API.",
      },
    ],
  },
];

// @desc    Get FAQ entries
// @route   GET /api/support/faqs
// @access  Public
export const getFaqs = asyncHandler(async (req, res) => {
  res.json({ faqs: FAQS });
});

// @desc    Submit contact support form
// @route   POST /api/support/contact
// @access  Public (optional auth)
export const submitContactForm = asyncHandler(async (req, res) => {
  const name = req.body.name?.toString().trim() || req.user?.name || "";
  const email =
    req.body.email?.toString().trim().toLowerCase() || req.user?.email || "";
  const phone = req.body.phone?.toString().trim() || "";
  const topic = req.body.topic?.toString().trim() || "General";
  const message = req.body.message?.toString().trim();

  if (!name || !email || !message) {
    res.status(400);
    throw new Error("Name, email, and message are required");
  }

  const ticket = await SupportTicket.create({
    user: req.user?._id,
    name,
    email,
    phone,
    topic,
    message,
  });

  // Notify admin stream.
  try {
    const notification = await Notification.create({
      type: "support",
      audience: "admin",
      title: "New Support Ticket",
      message: `${name} submitted a support request: ${topic}`,
      link: `/admin/reports`,
      userId: req.user?._id,
    });
    emitNotificationCreated(notification);
  } catch (error) {
    console.error("Support notification failed:", error.message);
  }

  res.status(201).json({
    message: "Support request submitted successfully",
    ticketId: ticket._id,
  });
});

// @desc    Get support tickets
// @route   GET /api/support/tickets
// @access  Private/Admin
export const getSupportTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json(tickets);
});

// @desc    Update support ticket status
// @route   PUT /api/support/tickets/:id/status
// @access  Private/Admin
export const updateSupportTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error("Support ticket not found");
  }

  const status = req.body.status?.toString().trim();
  const validStatuses = ["open", "in_progress", "resolved"];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid support ticket status");
  }

  ticket.status = status;
  ticket.resolvedAt = status === "resolved" ? new Date() : undefined;
  await ticket.save();

  res.json(ticket);
});
