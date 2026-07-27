import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import Notification from "../models/notificationModel.js";
import Order from "../models/orderModel.js";
import SupportTicket from "../models/supportTicketModel.js";
import User from "../models/userModel.js";
import {
  emitDomainChanged,
  emitNotificationCreated,
} from "../realtime/socket.js";
import {
  sendSupportAutoClosedEmail,
  sendSupportCustomerReplyNotificationEmail,
  sendSupportReplyEmail,
  sendSupportResolvedEmail,
  sendSupportTeamNewTicketEmail,
  sendSupportTicketReceivedEmail,
  sendSupportTicketReopenedEmail,
  sendSupportWaitingForCustomerEmail,
  sendSupportWaitingReminderEmail,
} from "../utils/sendEmail.js";
import {
  getAdminFrontendUrl,
  getCustomerFrontendUrl,
} from "../utils/frontendUrls.js";
import { getNextSupportTicketNumber } from "../utils/supportTicketNumbers.js";
import {
  SUPPORT_TICKET_PRIORITIES,
  SUPPORT_TICKET_SENDER_TYPES,
  SUPPORT_TICKET_STATUSES,
  SUPPORT_TICKET_TOPICS,
  applyClosedTicketReopenFields,
  applyCustomerReplyFields,
  applyWaitingForCustomerFields,
  buildWaitingAutoCloseClaimFilter,
  buildWaitingReminderClaimFilter,
  canReopenSupportTicket,
  isValidSupportEmail,
  normalizeSupportTicketPriority,
  normalizeSupportTicketStatus,
  normalizeSupportTicketTopic,
  sanitizeSupportEmail,
  sanitizeSupportText,
  shouldAutoCloseWaitingTicket,
  shouldSendWaitingReminder,
  stripInternalNotesFromTicket,
  ticketBelongsToUser,
} from "../utils/supportTicketRules.js";

export const SUPPORT_ATTACHMENT_ALLOWED_MIME_TYPES = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
export const SUPPORT_ATTACHMENT_MAX_FILES = 5;
export const SUPPORT_ATTACHMENT_MAX_SIZE_BYTES = 5 * 1024 * 1024;

const WORKFLOW_LOCK_MS = 10 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const DEFAULT_CLOSED_REASON = "Closed by support.";
const AUTO_CLOSED_REASON = "No customer response within 7 days.";

const getSupportTicketLinkSecret = () =>
  process.env.SUPPORT_TICKET_LINK_SECRET || process.env.JWT_SECRET;

const getAccessTokenDays = () => {
  const days = Number(process.env.SUPPORT_TICKET_ACCESS_DAYS || 60);
  return Number.isFinite(days) && days > 0 ? days : 60;
};

const toObjectId = (value) =>
  mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const asPlainTicket = (ticket) =>
  typeof ticket?.toObject === "function" ? ticket.toObject() : ticket;

const getActorName = (user) =>
  user?.name || user?.email || user?._id?.toString?.() || "SYSTEM";

const getPerformedBy = (user, fallback = "SYSTEM") =>
  user
    ? {
        userId: user._id,
        role: user.role || "user",
        name: getActorName(user),
      }
    : fallback;

const buildActivity = ({
  action,
  previousStatus = null,
  newStatus = null,
  performedBy = "SYSTEM",
  description,
  now = new Date(),
}) => ({
  action,
  previousStatus: previousStatus || null,
  newStatus: newStatus || null,
  performedBy,
  description,
  createdAt: now,
});

export const buildCustomerTicketUrl = (ticket, accessToken = "") => {
  const ticketNumber = ticket?.ticketNumber || ticket;
  const params = accessToken
    ? `?accessToken=${encodeURIComponent(accessToken)}`
    : "";

  return `${getCustomerFrontendUrl()}/customer/support/tickets/${ticketNumber}${params}`;
};

export const buildAdminTicketUrl = (ticket) => {
  const ticketNumber = ticket?.ticketNumber || ticket;
  return `${getAdminFrontendUrl()}/admin/support/tickets/${ticketNumber}`;
};

export const createSupportTicketAccessToken = (ticket) => {
  const secret = getSupportTicketLinkSecret();
  if (!secret) {
    throw new Error("Set SUPPORT_TICKET_LINK_SECRET or JWT_SECRET");
  }

  return jwt.sign(
    {
      type: "support-ticket-access",
      ticketNumber: ticket.ticketNumber,
      email: ticket.email,
      version: ticket.guestAccessVersion || 1,
    },
    secret,
    {
      expiresIn: `${getAccessTokenDays()}d`,
    }
  );
};

export const verifySupportTicketAccessToken = (ticket, accessToken) => {
  if (!accessToken) return false;

  const secret = getSupportTicketLinkSecret();
  if (!secret) return false;

  try {
    const payload = jwt.verify(accessToken, secret, {
      algorithms: ["HS256"],
    });

    return (
      payload.type === "support-ticket-access" &&
      payload.ticketNumber === ticket.ticketNumber &&
      payload.email === ticket.email &&
      Number(payload.version || 1) === Number(ticket.guestAccessVersion || 1)
    );
  } catch {
    return false;
  }
};

export const uploadSupportAttachments = async (files = []) => {
  if (!files.length) return [];

  if (
    !process.env.CLOUDINARY_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("Support attachment uploads require Cloudinary configuration");
  }

  const uploadFile = (file) =>
    new Promise((resolve, reject) => {
      const isPdf = file.mimetype === "application/pdf";
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "support-tickets",
          resource_type: isPdf ? "raw" : "image",
          use_filename: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve({
            originalName: sanitizeSupportText(file.originalname, {
              maxLength: 180,
            }),
            url: result.secure_url,
            publicId: result.public_id,
            mimeType: file.mimetype,
            size: file.size,
            resourceType: result.resource_type,
          });
        }
      );

      uploadStream.end(file.buffer);
    });

  return Promise.all(files.map(uploadFile));
};

const recordTicketEmailFailure = async (ticketId, template, error) => {
  const message = sanitizeSupportText(error?.message || String(error), {
    maxLength: 500,
  });

  try {
    await SupportTicket.findByIdAndUpdate(ticketId, {
      $push: {
        emailFailures: {
          template,
          error: message || "Email failed",
          failedAt: new Date(),
        },
      },
    });
  } catch (recordError) {
    console.error("Support ticket email failure logging failed:", recordError.message);
  }
};

const sendTicketEmailSafely = async (ticket, template, sender) => {
  try {
    await sender();
    return true;
  } catch (error) {
    console.error(`Support ticket ${template} email failed:`, error.message);
    await recordTicketEmailFailure(ticket._id, template, error);
    return false;
  }
};

const emitSupportChanged = (ticket, action) => {
  const userId =
    ticket.customer?._id?.toString?.() ||
    ticket.customer?.toString?.() ||
    ticket.user?._id?.toString?.() ||
    ticket.user?.toString?.() ||
    null;

  emitDomainChanged(
    "support",
    action,
    {
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      priority: ticket.priority,
    },
    {
      roles: ["admin"],
      userId,
    }
  );
};

const notifySupportTeam = async (ticket, title, message) => {
  try {
    const notification = await Notification.create({
      type: "system",
      audience: "admin",
      title,
      message,
      link: `/admin/support/tickets/${ticket.ticketNumber}`,
      userId: ticket.customer || ticket.user,
    });
    emitNotificationCreated(notification);
  } catch (error) {
    console.error("Support notification failed:", error.message);
  }
};

const resolveRelatedOrder = async ({ orderNumber, user }) => {
  if (!orderNumber || !user?._id || !mongoose.isValidObjectId(orderNumber)) {
    return null;
  }

  return Order.findOne({ _id: orderNumber, user: user._id }).select("_id").lean();
};

const populateTicket = (query) =>
  query
    .populate("customer", "name email phone")
    .populate("user", "name email phone")
    .populate("assignedTo", "name email role")
    .populate("order", "orderStatus paymentStatus totalPrice createdAt");

const getTicketByNumberOrId = (identifier) => {
  const normalizedIdentifier = String(identifier || "").trim().toUpperCase();
  const objectId = toObjectId(identifier);

  return populateTicket(
    SupportTicket.findOne({
      $or: [
        { ticketNumber: normalizedIdentifier },
        ...(objectId ? [{ _id: objectId }] : []),
      ],
    })
  );
};

const ensureCustomerCanAccessTicket = (ticket, { user, accessToken } = {}) => {
  if (user && ticketBelongsToUser(ticket, user)) {
    return;
  }

  if (verifySupportTicketAccessToken(ticket, accessToken)) {
    return;
  }

  const error = new Error("Support ticket not found");
  error.statusCode = 404;
  throw error;
};

const createCustomerReply = ({
  user,
  fullName,
  message,
  attachments,
  now = new Date(),
}) => ({
  senderType: SUPPORT_TICKET_SENDER_TYPES.CUSTOMER,
  sender: user?._id,
  senderName: fullName || getActorName(user),
  message,
  attachments,
  createdAt: now,
});

const createSupportReply = ({
  user,
  message,
  attachments,
  now = new Date(),
  isInternalNote = false,
}) => ({
  senderType: SUPPORT_TICKET_SENDER_TYPES.SUPPORT,
  sender: user?._id,
  senderName: getActorName(user),
  message,
  attachments,
  isInternalNote,
  createdAt: now,
});

const createSystemReply = ({ message, now = new Date() }) => ({
  senderType: SUPPORT_TICKET_SENDER_TYPES.SYSTEM,
  senderName: "Cherish Baby Store Support",
  message,
  createdAt: now,
});

const mapTicketForResponse = (ticket, { forAdmin = false } = {}) => {
  const plainTicket = asPlainTicket(ticket);
  if (!plainTicket) return null;
  const customerTicket = forAdmin
    ? plainTicket
    : stripInternalNotesFromTicket(plainTicket);

  const replies = Array.isArray(customerTicket.replies)
    ? customerTicket.replies
    : [];
  const lastReply = replies[replies.length - 1];
  const isReopenEligible = canReopenSupportTicket(customerTicket);
  const canReply = customerTicket.status !== SUPPORT_TICKET_STATUSES.CLOSED;

  const response = {
    ...customerTicket,
    id: customerTicket._id?.toString?.() || customerTicket._id,
    customerId:
      customerTicket.customer?._id?.toString?.() ||
      customerTicket.customer?.toString?.() ||
      customerTicket.user?._id?.toString?.() ||
      customerTicket.user?.toString?.() ||
      null,
    fullName: customerTicket.fullName || customerTicket.name || "",
    phoneNumber: customerTicket.phoneNumber || customerTicket.phone || "",
    inquiryTopic: customerTicket.inquiryTopic || customerTicket.topic || "Other",
    lastActivityAt:
      lastReply?.createdAt || customerTicket.updatedAt || customerTicket.createdAt,
    isReopenEligible,
    canReply,
  };

  if (!forAdmin) {
    delete response.activities;
    delete response.emailFailures;
    delete response.workflowLock;
  }

  return response;
};

const buildNewTicketPayload = async ({ body, user, files }) => {
  const fullName = sanitizeSupportText(body.fullName || body.name || user?.name, {
    maxLength: 120,
  });
  const email = sanitizeSupportEmail(body.email || user?.email);
  const phoneNumber = sanitizeSupportText(body.phoneNumber || body.phone, {
    maxLength: 40,
  });
  const orderNumber = sanitizeSupportText(body.orderNumber || body.orderId, {
    maxLength: 80,
  });
  const inquiryTopic = normalizeSupportTicketTopic(body.inquiryTopic || body.topic);
  const subject = sanitizeSupportText(body.subject || inquiryTopic, {
    maxLength: 160,
  });
  const message = sanitizeSupportText(body.message, { maxLength: 5000 });
  const priority = normalizeSupportTicketPriority(body.priority);

  if (!fullName || !email || !subject || !message) {
    const error = new Error("Full name, email, subject, and message are required");
    error.statusCode = 400;
    throw error;
  }

  if (!isValidSupportEmail(email)) {
    const error = new Error("A valid email address is required");
    error.statusCode = 400;
    throw error;
  }

  const relatedOrder = await resolveRelatedOrder({ orderNumber, user });
  const attachments = await uploadSupportAttachments(files);

  return {
    fullName,
    email,
    phoneNumber,
    order: relatedOrder?._id,
    orderNumber,
    inquiryTopic,
    subject,
    message,
    priority,
    attachments,
  };
};

export const createSupportTicketRecord = async ({
  body,
  user,
  files = [],
  now = new Date(),
} = {}) => {
  const payload = await buildNewTicketPayload({ body, user, files });
  const { sequence, ticketNumber } = await getNextSupportTicketNumber();

  const ticket = await SupportTicket.create({
    sequence,
    ticketNumber,
    customer: user?._id,
    user: user?._id,
    fullName: payload.fullName,
    name: payload.fullName,
    email: payload.email,
    phoneNumber: payload.phoneNumber,
    phone: payload.phoneNumber,
    order: payload.order,
    orderNumber: payload.orderNumber,
    inquiryTopic: payload.inquiryTopic,
    topic: payload.inquiryTopic,
    subject: payload.subject,
    message: payload.message,
    status: SUPPORT_TICKET_STATUSES.OPEN,
    priority: payload.priority,
    lastCustomerReplyAt: now,
    replies: [
      createCustomerReply({
        user,
        fullName: payload.fullName,
        message: payload.message,
        attachments: payload.attachments,
        now,
      }),
    ],
    activities: [
      buildActivity({
        action: "TICKET_CREATED",
        newStatus: SUPPORT_TICKET_STATUSES.OPEN,
        performedBy: user ? getPerformedBy(user) : "GUEST",
        description: "Support ticket created.",
        now,
      }),
    ],
  });

  const accessToken = createSupportTicketAccessToken(ticket);
  const ticketUrl = buildCustomerTicketUrl(ticket, accessToken);
  const adminUrl = buildAdminTicketUrl(ticket);
  const customerEmailSent = await sendTicketEmailSafely(
    ticket,
    "ticket_received",
    () =>
      sendSupportTicketReceivedEmail({
        ticket,
        ticketUrl,
      })
  );

  await sendTicketEmailSafely(ticket, "team_new_ticket", () =>
    sendSupportTeamNewTicketEmail({
      ticket,
      adminUrl,
    })
  );

  await notifySupportTeam(
    ticket,
    "New Support Ticket",
    `${payload.fullName} submitted ${ticket.ticketNumber}: ${payload.subject}`
  );
  emitSupportChanged(ticket, "created");

  return {
    ticket: mapTicketForResponse(ticket, { forAdmin: false }),
    accessToken,
    ticketUrl,
    customerEmailSent,
  };
};

export const listMySupportTickets = async (user) => {
  const tickets = await SupportTicket.find({
    $or: [{ customer: user._id }, { user: user._id }],
  })
    .sort({ updatedAt: -1 })
    .select("-activities -emailFailures -workflowLock")
    .lean();

  return tickets.map((ticket) => mapTicketForResponse(ticket));
};

export const getCustomerSupportTicket = async ({
  ticketNumber,
  user,
  accessToken,
}) => {
  const ticket = await getTicketByNumberOrId(ticketNumber);
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  ensureCustomerCanAccessTicket(ticket, { user, accessToken });

  return mapTicketForResponse(ticket, { forAdmin: false });
};

export const addCustomerReplyToTicket = async ({
  ticketNumber,
  body,
  user,
  accessToken,
  files = [],
  now = new Date(),
}) => {
  const ticket = await getTicketByNumberOrId(ticketNumber);
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  ensureCustomerCanAccessTicket(ticket, { user, accessToken });

  if (ticket.status === SUPPORT_TICKET_STATUSES.CLOSED) {
    const error = new Error("Closed tickets must be reopened before replying");
    error.statusCode = 409;
    throw error;
  }

  const message = sanitizeSupportText(body.message, { maxLength: 5000 });
  const attachments = await uploadSupportAttachments(files);
  if (!message && attachments.length === 0) {
    const error = new Error("Reply message or attachment is required");
    error.statusCode = 400;
    throw error;
  }

  const previousStatus = ticket.status;
  applyCustomerReplyFields(ticket, now);
  ticket.replies.push(
    createCustomerReply({
      user,
      fullName: ticket.fullName,
      message: message || "Attachment added.",
      attachments,
      now,
    })
  );
  ticket.activities.push(
    buildActivity({
      action: "CUSTOMER_REPLIED",
      previousStatus,
      newStatus: ticket.status,
      performedBy: user ? getPerformedBy(user) : "GUEST",
      description:
        previousStatus === SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER
          ? "Customer replied and the ticket returned to pending."
          : "Customer added a reply.",
      now,
    })
  );
  await ticket.save();

  const adminUrl = buildAdminTicketUrl(ticket);
  await sendTicketEmailSafely(ticket, "customer_reply_notification", () =>
    sendSupportCustomerReplyNotificationEmail({
      ticket,
      adminUrl,
    })
  );
  await notifySupportTeam(
    ticket,
    "Customer Replied",
    `${ticket.ticketNumber} received a customer reply.`
  );
  emitSupportChanged(ticket, "updated");

  return mapTicketForResponse(ticket, { forAdmin: false });
};

export const reopenSupportTicket = async ({
  ticketNumber,
  body,
  user,
  accessToken,
  performedByUser,
  files = [],
  now = new Date(),
}) => {
  const ticket = await getTicketByNumberOrId(ticketNumber);
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (performedByUser?.role === "admin") {
    // Admin access is enforced by route middleware.
  } else {
    ensureCustomerCanAccessTicket(ticket, { user, accessToken });
  }

  if (!canReopenSupportTicket(ticket, now)) {
    const error = new Error(
      "This ticket can no longer be reopened. Please create a new support request."
    );
    error.statusCode = 409;
    throw error;
  }

  const message = sanitizeSupportText(body.message, { maxLength: 5000 });
  const attachments = await uploadSupportAttachments(files);
  const previousStatus = ticket.status;
  const reopenedByAdmin = performedByUser?.role === "admin";
  const reopenStatus = message && !reopenedByAdmin
    ? SUPPORT_TICKET_STATUSES.PENDING
    : SUPPORT_TICKET_STATUSES.OPEN;

  applyClosedTicketReopenFields(ticket, {
    status: reopenStatus,
    now,
  });

  if (message || attachments.length > 0) {
    ticket.replies.push(
      reopenedByAdmin
        ? createSupportReply({
            user: performedByUser,
            message: message || "Ticket reopened with attachment.",
            attachments,
            now,
          })
        : createCustomerReply({
            user,
            fullName: ticket.fullName,
            message: message || "Ticket reopened with attachment.",
            attachments,
            now,
          })
    );

    if (reopenedByAdmin) {
      ticket.lastSupportReplyAt = now;
    } else {
      ticket.lastCustomerReplyAt = now;
    }
  }

  ticket.activities.push(
    buildActivity({
      action: "TICKET_REOPENED",
      previousStatus,
      newStatus: ticket.status,
      performedBy: getPerformedBy(performedByUser || user, user ? "CUSTOMER" : "GUEST"),
      description: "Support ticket reopened.",
      now,
    })
  );
  await ticket.save();

  const adminUrl = buildAdminTicketUrl(ticket);
  const customerAccessToken = createSupportTicketAccessToken(ticket);
  await sendTicketEmailSafely(ticket, "ticket_reopened_customer", () =>
    sendSupportTicketReopenedEmail({
      ticket,
      ticketUrl: buildCustomerTicketUrl(ticket, customerAccessToken),
    })
  );
  await sendTicketEmailSafely(ticket, "ticket_reopened_team", () =>
    sendSupportCustomerReplyNotificationEmail({
      ticket,
      adminUrl,
      subjectPrefix: "Reopened support ticket",
    })
  );
  await notifySupportTeam(
    ticket,
    "Support Ticket Reopened",
    `${ticket.ticketNumber} was reopened.`
  );
  emitSupportChanged(ticket, "updated");

  return mapTicketForResponse(ticket, { forAdmin: performedByUser?.role === "admin" });
};

export const listAdminSupportTickets = async (queryParams = {}) => {
  const page = Math.max(1, Number.parseInt(queryParams.page || "1", 10));
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(queryParams.limit || DEFAULT_PAGE_SIZE, 10))
  );
  const filter = {};
  const status = queryParams.status
    ? normalizeSupportTicketStatus(queryParams.status)
    : "";
  const priority = normalizeSupportTicketPriority(queryParams.priority);
  const topic = queryParams.topic
    ? normalizeSupportTicketTopic(queryParams.topic)
    : "";
  const assignedTo = String(queryParams.assignedTo || "").trim();
  const search = sanitizeSupportText(queryParams.search, { maxLength: 120 });
  const startDate = queryParams.startDate
    ? new Date(queryParams.startDate)
    : null;
  const endDate = queryParams.endDate ? new Date(queryParams.endDate) : null;

  if (status) filter.status = status;
  if (queryParams.priority) filter.priority = priority;
  if (topic) filter.inquiryTopic = topic;

  if (assignedTo === "unassigned") {
    filter.assignedTo = { $exists: false };
  } else if (toObjectId(assignedTo)) {
    filter.assignedTo = toObjectId(assignedTo);
  }

  if (
    startDate &&
    !Number.isNaN(startDate.getTime()) &&
    endDate &&
    !Number.isNaN(endDate.getTime())
  ) {
    const inclusiveEndDate = new Date(endDate);
    inclusiveEndDate.setUTCHours(23, 59, 59, 999);
    filter.createdAt = { $gte: startDate, $lte: inclusiveEndDate };
  } else if (startDate && !Number.isNaN(startDate.getTime())) {
    filter.createdAt = { $gte: startDate };
  } else if (endDate && !Number.isNaN(endDate.getTime())) {
    const inclusiveEndDate = new Date(endDate);
    inclusiveEndDate.setUTCHours(23, 59, 59, 999);
    filter.createdAt = { $lte: inclusiveEndDate };
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { ticketNumber: regex },
      { fullName: regex },
      { name: regex },
      { email: regex },
      { subject: regex },
      { orderNumber: regex },
    ];
  }

  const sortMap = {
    ticketNumber: "ticketNumber",
    customer: "fullName",
    email: "email",
    topic: "inquiryTopic",
    orderNumber: "orderNumber",
    status: "status",
    priority: "priority",
    assignedAgent: "assignedTo",
    lastActivity: "updatedAt",
    createdDate: "createdAt",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  };
  const sortField = sortMap[queryParams.sortBy] || "updatedAt";
  const sortDirection = queryParams.sortOrder === "asc" ? 1 : -1;

  const [tickets, totalItems] = await Promise.all([
    populateTicket(
      SupportTicket.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip((page - 1) * limit)
        .limit(limit)
    ).lean(),
    SupportTicket.countDocuments(filter),
  ]);

  return {
    tickets: tickets.map((ticket) => mapTicketForResponse(ticket, { forAdmin: true })),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    },
  };
};

export const getAdminSupportTicket = async (ticketNumber) => {
  const ticket = await getTicketByNumberOrId(ticketNumber);
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  return mapTicketForResponse(ticket, { forAdmin: true });
};

export const addSupportReplyToTicket = async ({
  ticketNumber,
  body,
  user,
  files = [],
  now = new Date(),
}) => {
  const ticket = await getTicketByNumberOrId(ticketNumber);
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  const message = sanitizeSupportText(body.message, { maxLength: 5000 });
  const attachments = await uploadSupportAttachments(files);
  if (!message && attachments.length === 0) {
    const error = new Error("Reply message or attachment is required");
    error.statusCode = 400;
    throw error;
  }

  const previousStatus = ticket.status;
  const markWaiting =
    body.markWaitingForCustomer === true ||
    body.markWaitingForCustomer === "true" ||
    normalizeSupportTicketStatus(body.status) ===
      SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER;

  ticket.replies.push(
    createSupportReply({
      user,
      message: message || "Attachment added.",
      attachments,
      now,
    })
  );

  if (markWaiting) {
    applyWaitingForCustomerFields(ticket, now);
  } else {
    ticket.lastSupportReplyAt = now;
    if (ticket.status === SUPPORT_TICKET_STATUSES.OPEN) {
      ticket.status = SUPPORT_TICKET_STATUSES.PENDING;
    }
  }

  ticket.activities.push(
    buildActivity({
      action: markWaiting ? "WAITING_FOR_CUSTOMER" : "SUPPORT_REPLIED",
      previousStatus,
      newStatus: ticket.status,
      performedBy: getPerformedBy(user),
      description: markWaiting
        ? "Support replied and requested more information from the customer."
        : "Support replied to the customer.",
      now,
    })
  );
  await ticket.save();

  const accessToken = createSupportTicketAccessToken(ticket);
  const ticketUrl = buildCustomerTicketUrl(ticket, accessToken);
  const emailSender = markWaiting
    ? () => sendSupportWaitingForCustomerEmail({ ticket, ticketUrl })
    : () => sendSupportReplyEmail({ ticket, ticketUrl });

  await sendTicketEmailSafely(
    ticket,
    markWaiting ? "waiting_for_customer" : "support_reply",
    emailSender
  );
  emitSupportChanged(ticket, "updated");

  return mapTicketForResponse(ticket, { forAdmin: true });
};

export const addInternalNoteToTicket = async ({
  ticketNumber,
  body,
  user,
  now = new Date(),
}) => {
  const ticket = await getTicketByNumberOrId(ticketNumber);
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  const message = sanitizeSupportText(body.message, { maxLength: 5000 });
  if (!message) {
    const error = new Error("Internal note message is required");
    error.statusCode = 400;
    throw error;
  }

  ticket.replies.push(
    createSupportReply({
      user,
      message,
      now,
      isInternalNote: true,
    })
  );
  ticket.activities.push(
    buildActivity({
      action: "INTERNAL_NOTE_ADDED",
      previousStatus: ticket.status,
      newStatus: ticket.status,
      performedBy: getPerformedBy(user),
      description: "Internal note added.",
      now,
    })
  );
  await ticket.save();
  emitSupportChanged(ticket, "updated");

  return mapTicketForResponse(ticket, { forAdmin: true });
};

export const updateSupportTicketStatus = async ({
  ticketNumber,
  body,
  user,
  now = new Date(),
}) => {
  const ticket = await getTicketByNumberOrId(ticketNumber);
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  const status = normalizeSupportTicketStatus(body.status);
  if (!Object.values(SUPPORT_TICKET_STATUSES).includes(status)) {
    const error = new Error("Invalid support ticket status");
    error.statusCode = 400;
    throw error;
  }

  if (
    ticket.status === SUPPORT_TICKET_STATUSES.CLOSED &&
    status !== SUPPORT_TICKET_STATUSES.CLOSED &&
    !canReopenSupportTicket(ticket, now)
  ) {
    const error = new Error(
      "This ticket can no longer be reopened. Please create a new support request."
    );
    error.statusCode = 409;
    throw error;
  }

  const previousStatus = ticket.status;
  if (status === SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER) {
    applyWaitingForCustomerFields(ticket, now);
  } else if (
    previousStatus === SUPPORT_TICKET_STATUSES.CLOSED &&
    status !== SUPPORT_TICKET_STATUSES.CLOSED
  ) {
    applyClosedTicketReopenFields(ticket, { status, now });
  } else {
    ticket.status = status;
    if (status === SUPPORT_TICKET_STATUSES.RESOLVED) {
      ticket.resolvedAt = now;
      ticket.reminderSentAt = null;
      ticket.autoCloseAt = null;
    }
    if (status === SUPPORT_TICKET_STATUSES.CLOSED) {
      ticket.closedAt = now;
      ticket.closedReason =
        sanitizeSupportText(body.closedReason, { maxLength: 300 }) ||
        DEFAULT_CLOSED_REASON;
      ticket.reminderSentAt = null;
      ticket.autoCloseAt = null;
    }
    if (
      status === SUPPORT_TICKET_STATUSES.OPEN ||
      status === SUPPORT_TICKET_STATUSES.PENDING
    ) {
      ticket.closedAt = null;
      ticket.closedReason = "";
      ticket.reminderSentAt = null;
      ticket.autoCloseAt = null;
    }
  }

  ticket.activities.push(
    buildActivity({
      action:
        previousStatus === SUPPORT_TICKET_STATUSES.CLOSED &&
        status !== SUPPORT_TICKET_STATUSES.CLOSED
          ? "TICKET_REOPENED"
          : "STATUS_CHANGED",
      previousStatus,
      newStatus: ticket.status,
      performedBy: getPerformedBy(user),
      description: `Status changed from ${previousStatus} to ${ticket.status}.`,
      now,
    })
  );
  await ticket.save();

  const accessToken = createSupportTicketAccessToken(ticket);
  const ticketUrl = buildCustomerTicketUrl(ticket, accessToken);
  if (status === SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER) {
    await sendTicketEmailSafely(ticket, "waiting_for_customer", () =>
      sendSupportWaitingForCustomerEmail({ ticket, ticketUrl })
    );
  } else if (status === SUPPORT_TICKET_STATUSES.RESOLVED) {
    await sendTicketEmailSafely(ticket, "ticket_resolved", () =>
      sendSupportResolvedEmail({ ticket, ticketUrl })
    );
  } else if (status === SUPPORT_TICKET_STATUSES.CLOSED) {
    await sendTicketEmailSafely(ticket, "ticket_closed", () =>
      sendSupportAutoClosedEmail({
        ticket,
        ticketUrl,
        manual: true,
      })
    );
  } else if (
    previousStatus === SUPPORT_TICKET_STATUSES.CLOSED &&
    status !== SUPPORT_TICKET_STATUSES.CLOSED
  ) {
    await sendTicketEmailSafely(ticket, "ticket_reopened", () =>
      sendSupportTicketReopenedEmail({ ticket, ticketUrl })
    );
  }

  emitSupportChanged(ticket, "updated");

  return mapTicketForResponse(ticket, { forAdmin: true });
};

export const updateSupportTicketPriority = async ({
  ticketNumber,
  body,
  user,
  now = new Date(),
}) => {
  const ticket = await getTicketByNumberOrId(ticketNumber);
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  const previousPriority = ticket.priority;
  ticket.priority = normalizeSupportTicketPriority(body.priority);
  ticket.activities.push(
    buildActivity({
      action: "PRIORITY_CHANGED",
      previousStatus: ticket.status,
      newStatus: ticket.status,
      performedBy: getPerformedBy(user),
      description: `Priority changed from ${previousPriority} to ${ticket.priority}.`,
      now,
    })
  );
  await ticket.save();
  emitSupportChanged(ticket, "updated");

  return mapTicketForResponse(ticket, { forAdmin: true });
};

export const updateSupportTicketAssignment = async ({
  ticketNumber,
  body,
  user,
  now = new Date(),
}) => {
  const ticket = await getTicketByNumberOrId(ticketNumber);
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  const assignedTo = String(body.assignedTo || "").trim();
  const previousAssignedTo = ticket.assignedTo?.toString?.() || "";

  if (!assignedTo) {
    ticket.assignedTo = undefined;
  } else {
    const assignedUser = await User.findOne({
      _id: assignedTo,
      role: "admin",
    }).select("_id");
    if (!assignedUser) {
      const error = new Error("Assigned agent must be an admin user");
      error.statusCode = 400;
      throw error;
    }
    ticket.assignedTo = assignedUser._id;
  }

  ticket.activities.push(
    buildActivity({
      action: "ASSIGNMENT_CHANGED",
      previousStatus: ticket.status,
      newStatus: ticket.status,
      performedBy: getPerformedBy(user),
      description: assignedTo
        ? "Support ticket assigned to an agent."
        : "Support ticket assignment cleared.",
      now,
    })
  );
  await ticket.save();
  emitSupportChanged(ticket, "updated");

  return {
    ticket: mapTicketForResponse(ticket, { forAdmin: true }),
    previousAssignedTo,
  };
};

const claimWorkflowTicket = async ({ candidate, type, filterBuilder, now }) => {
  const lockToken = crypto.randomUUID();
  const lockExpiresAt = new Date(new Date(now).getTime() + WORKFLOW_LOCK_MS);

  return SupportTicket.findOneAndUpdate(
    filterBuilder(candidate._id, now, new Date(now)),
    {
      $set: {
        workflowLock: {
          token: lockToken,
          type,
          expiresAt: lockExpiresAt,
        },
      },
    },
    { new: true }
  );
};

const clearWorkflowLock = async (ticket) => {
  ticket.workflowLock = undefined;
  await ticket.save();
};

export const processWaitingTicketReminders = async ({
  now = new Date(),
  limit = 50,
} = {}) => {
  const candidates = await SupportTicket.find({
    status: SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER,
    reminderSentAt: null,
    waitingSince: {
      $lte: new Date(new Date(now).getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  })
    .sort({ waitingSince: 1 })
    .limit(limit);

  const processed = [];
  for (const candidate of candidates) {
    const ticket = await claimWorkflowTicket({
      candidate,
      type: "reminder",
      filterBuilder: buildWaitingReminderClaimFilter,
      now,
    });

    if (!ticket) continue;

    if (!shouldSendWaitingReminder(ticket, now)) {
      await clearWorkflowLock(ticket);
      continue;
    }

    ticket.reminderSentAt = now;
    ticket.replies.push(
      createSystemReply({
        message:
          "Reminder sent: we are still waiting for the customer's response.",
        now,
      })
    );
    ticket.activities.push(
      buildActivity({
        action: "WAITING_REMINDER_SENT",
        previousStatus: ticket.status,
        newStatus: ticket.status,
        description: "Three-day waiting reminder sent.",
        now,
      })
    );
    ticket.workflowLock = undefined;
    await ticket.save();

    const accessToken = createSupportTicketAccessToken(ticket);
    await sendTicketEmailSafely(ticket, "waiting_reminder", () =>
      sendSupportWaitingReminderEmail({
        ticket,
        ticketUrl: buildCustomerTicketUrl(ticket, accessToken),
      })
    );

    emitSupportChanged(ticket, "updated");
    processed.push(ticket.ticketNumber);
  }

  return {
    processed: processed.length,
    ticketNumbers: processed,
  };
};

export const processWaitingTicketClosures = async ({
  now = new Date(),
  limit = 50,
} = {}) => {
  const candidates = await SupportTicket.find({
    status: SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER,
    autoCloseAt: { $lte: now },
  })
    .sort({ autoCloseAt: 1 })
    .limit(limit);

  const processed = [];
  for (const candidate of candidates) {
    const ticket = await claimWorkflowTicket({
      candidate,
      type: "closure",
      filterBuilder: buildWaitingAutoCloseClaimFilter,
      now,
    });

    if (!ticket) continue;

    if (!shouldAutoCloseWaitingTicket(ticket, now)) {
      await clearWorkflowLock(ticket);
      continue;
    }

    const previousStatus = ticket.status;
    ticket.status = SUPPORT_TICKET_STATUSES.CLOSED;
    ticket.closedAt = now;
    ticket.closedReason = AUTO_CLOSED_REASON;
    ticket.autoCloseAt = null;
    ticket.replies.push(
      createSystemReply({
        message: AUTO_CLOSED_REASON,
        now,
      })
    );
    ticket.activities.push(
      buildActivity({
        action: "TICKET_AUTO_CLOSED",
        previousStatus,
        newStatus: SUPPORT_TICKET_STATUSES.CLOSED,
        description: AUTO_CLOSED_REASON,
        now,
      })
    );
    ticket.workflowLock = undefined;
    await ticket.save();

    const accessToken = createSupportTicketAccessToken(ticket);
    await sendTicketEmailSafely(ticket, "ticket_auto_closed", () =>
      sendSupportAutoClosedEmail({
        ticket,
        ticketUrl: buildCustomerTicketUrl(ticket, accessToken),
      })
    );

    emitSupportChanged(ticket, "updated");
    processed.push(ticket.ticketNumber);
  }

  return {
    processed: processed.length,
    ticketNumbers: processed,
  };
};

export const processSupportTicketAutomation = async ({
  now = new Date(),
  limit = 50,
} = {}) => {
  const closures = await processWaitingTicketClosures({ now, limit });
  const reminders = await processWaitingTicketReminders({ now, limit });

  return {
    reminders,
    closures,
  };
};

export const supportTicketLookups = {
  statuses: Object.values(SUPPORT_TICKET_STATUSES),
  priorities: Object.values(SUPPORT_TICKET_PRIORITIES),
  topics: SUPPORT_TICKET_TOPICS,
};
