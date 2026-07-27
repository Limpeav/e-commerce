import asyncHandler from "express-async-handler";
import {
  addCustomerReplyToTicket,
  addInternalNoteToTicket,
  addSupportReplyToTicket,
  createSupportTicketRecord,
  getAdminSupportTicket,
  getCustomerSupportTicket,
  listAdminSupportTickets,
  listMySupportTickets,
  reopenSupportTicket,
  supportTicketLookups,
  updateSupportTicketAssignment,
  updateSupportTicketPriority,
  updateSupportTicketStatus,
} from "../services/supportTicketService.js";

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

const getAccessToken = (req) =>
  req.body?.accessToken ||
  req.query?.accessToken ||
  req.headers["x-support-access-token"] ||
  "";

// @desc    Get FAQ entries
// @route   GET /api/support/faqs
// @access  Public
export const getFaqs = asyncHandler(async (req, res) => {
  res.json({ faqs: FAQS });
});

// @desc    Get support ticket dropdown values
// @route   GET /api/support/lookups
// @access  Public
export const getSupportTicketLookups = asyncHandler(async (req, res) => {
  res.json(supportTicketLookups);
});

// @desc    Submit contact support form / create support ticket
// @route   POST /api/support/contact
// @route   POST /api/support/tickets
// @access  Public (optional auth)
export const submitContactForm = asyncHandler(async (req, res) => {
  const result = await createSupportTicketRecord({
    body: req.body || {},
    user: req.user,
    files: req.files || [],
  });

  res.status(201).json({
    message: "Support request submitted successfully",
    confirmation:
      "Thank you. Your support request has been received. Our support team will respond within one business day.",
    ticketId: result.ticket.id,
    ticketNumber: result.ticket.ticketNumber,
    ticket: result.ticket,
    accessToken: result.accessToken || undefined,
    ticketUrl: result.ticketUrl,
    emailSent: result.customerEmailSent,
  });
});

// @desc    Get authenticated customer's support tickets
// @route   GET /api/support/tickets/my
// @access  Private
export const getMySupportTickets = asyncHandler(async (req, res) => {
  const tickets = await listMySupportTickets(req.user);
  res.json({ tickets });
});

// @desc    Get customer support ticket detail
// @route   GET /api/support/tickets/:ticketNumber
// @access  Private owner or signed guest ticket token
export const getCustomerTicket = asyncHandler(async (req, res) => {
  const ticket = await getCustomerSupportTicket({
    ticketNumber: req.params.ticketNumber,
    user: req.user,
    accessToken: getAccessToken(req),
  });

  res.json({ ticket });
});

// @desc    Add a customer reply
// @route   POST /api/support/tickets/:ticketNumber/replies
// @access  Private owner or signed guest ticket token
export const addCustomerTicketReply = asyncHandler(async (req, res) => {
  const ticket = await addCustomerReplyToTicket({
    ticketNumber: req.params.ticketNumber,
    body: req.body || {},
    user: req.user,
    accessToken: getAccessToken(req),
    files: req.files || [],
  });

  res.status(201).json({ ticket });
});

// @desc    Reopen a customer ticket
// @route   POST /api/support/tickets/:ticketNumber/reopen
// @access  Private owner or signed guest ticket token
export const reopenCustomerTicket = asyncHandler(async (req, res) => {
  const ticket = await reopenSupportTicket({
    ticketNumber: req.params.ticketNumber,
    body: req.body || {},
    user: req.user,
    accessToken: getAccessToken(req),
    files: req.files || [],
  });

  res.json({ ticket });
});

// @desc    Get admin support tickets
// @route   GET /api/admin/support/tickets
// @route   GET /api/support/tickets
// @access  Private/Admin
export const getSupportTickets = asyncHandler(async (req, res) => {
  const result = await listAdminSupportTickets(req.query || {});
  res.json(result);
});

// @desc    Get admin support ticket detail
// @route   GET /api/admin/support/tickets/:ticketNumber
// @access  Private/Admin
export const getAdminTicket = asyncHandler(async (req, res) => {
  const ticket = await getAdminSupportTicket(req.params.ticketNumber);
  res.json({ ticket });
});

// @desc    Add an admin support reply
// @route   POST /api/admin/support/tickets/:ticketNumber/replies
// @access  Private/Admin
export const addAdminSupportReply = asyncHandler(async (req, res) => {
  const ticket = await addSupportReplyToTicket({
    ticketNumber: req.params.ticketNumber,
    body: req.body || {},
    user: req.user,
    files: req.files || [],
  });

  res.status(201).json({ ticket });
});

// @desc    Add an internal note
// @route   POST /api/admin/support/tickets/:ticketNumber/internal-notes
// @access  Private/Admin
export const addAdminInternalNote = asyncHandler(async (req, res) => {
  const ticket = await addInternalNoteToTicket({
    ticketNumber: req.params.ticketNumber,
    body: req.body || {},
    user: req.user,
  });

  res.status(201).json({ ticket });
});

// @desc    Update support ticket status
// @route   PATCH /api/admin/support/tickets/:ticketNumber/status
// @route   PUT /api/support/tickets/:id/status
// @access  Private/Admin
export const updateSupportTicketStatusController = asyncHandler(async (req, res) => {
  const ticket = await updateSupportTicketStatus({
    ticketNumber: req.params.ticketNumber || req.params.id,
    body: req.body || {},
    user: req.user,
  });

  res.json({ ticket });
});

// Backwards-compatible export name used by the original route file.
export { updateSupportTicketStatusController as updateSupportTicketStatus };

// @desc    Update support ticket priority
// @route   PATCH /api/admin/support/tickets/:ticketNumber/priority
// @access  Private/Admin
export const updateAdminSupportPriority = asyncHandler(async (req, res) => {
  const ticket = await updateSupportTicketPriority({
    ticketNumber: req.params.ticketNumber,
    body: req.body || {},
    user: req.user,
  });

  res.json({ ticket });
});

// @desc    Update support ticket assignment
// @route   PATCH /api/admin/support/tickets/:ticketNumber/assignment
// @access  Private/Admin
export const updateAdminSupportAssignment = asyncHandler(async (req, res) => {
  const result = await updateSupportTicketAssignment({
    ticketNumber: req.params.ticketNumber,
    body: req.body || {},
    user: req.user,
  });

  res.json(result);
});

// @desc    Reopen an admin support ticket
// @route   POST /api/admin/support/tickets/:ticketNumber/reopen
// @access  Private/Admin
export const reopenAdminTicket = asyncHandler(async (req, res) => {
  const ticket = await reopenSupportTicket({
    ticketNumber: req.params.ticketNumber,
    body: req.body || {},
    performedByUser: req.user,
  });

  res.json({ ticket });
});
