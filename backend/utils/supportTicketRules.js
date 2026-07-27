export const SUPPORT_TICKET_STATUSES = Object.freeze({
  OPEN: "OPEN",
  PENDING: "PENDING",
  WAITING_FOR_CUSTOMER: "WAITING_FOR_CUSTOMER",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
});

export const SUPPORT_TICKET_PRIORITIES = Object.freeze({
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
});

export const SUPPORT_TICKET_SENDER_TYPES = Object.freeze({
  CUSTOMER: "CUSTOMER",
  SUPPORT: "SUPPORT",
  SYSTEM: "SYSTEM",
});

export const SUPPORT_TICKET_TOPICS = Object.freeze([
  "Order Status",
  "Delivery Issue",
  "Return and Refund",
  "Product Inquiry",
  "Payment Problem",
  "Technical Support",
  "Account Issue",
  "Suggestion",
  "Other",
]);

export const WAITING_REMINDER_DELAY_MS = 3 * 24 * 60 * 60 * 1000;
export const WAITING_AUTO_CLOSE_DELAY_MS = 7 * 24 * 60 * 60 * 1000;
export const CLOSED_REOPEN_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const LEGACY_STATUS_MAP = Object.freeze({
  open: SUPPORT_TICKET_STATUSES.OPEN,
  in_progress: SUPPORT_TICKET_STATUSES.PENDING,
  pending: SUPPORT_TICKET_STATUSES.PENDING,
  waiting_for_customer: SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER,
  resolved: SUPPORT_TICKET_STATUSES.RESOLVED,
  closed: SUPPORT_TICKET_STATUSES.CLOSED,
});

const TOPIC_ALIASES = Object.freeze({
  general: "Other",
  "billing & finance": "Payment Problem",
  billing: "Payment Problem",
  finance: "Payment Problem",
  partnership: "Other",
  "other / general": "Other",
});

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const normalizeSupportTicketStatus = (value) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return SUPPORT_TICKET_STATUSES.OPEN;

  const upperValue = rawValue.toUpperCase();
  if (Object.values(SUPPORT_TICKET_STATUSES).includes(upperValue)) {
    return upperValue;
  }

  return LEGACY_STATUS_MAP[rawValue.toLowerCase()] || "";
};

export const normalizeSupportTicketPriority = (value) => {
  const upperValue = String(value || "").trim().toUpperCase();
  return Object.values(SUPPORT_TICKET_PRIORITIES).includes(upperValue)
    ? upperValue
    : SUPPORT_TICKET_PRIORITIES.NORMAL;
};

export const normalizeSupportTicketTopic = (value) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "Other";

  const directMatch = SUPPORT_TICKET_TOPICS.find(
    (topic) => topic.toLowerCase() === rawValue.toLowerCase()
  );
  if (directMatch) return directMatch;

  return TOPIC_ALIASES[rawValue.toLowerCase()] || "Other";
};

export const sanitizeSupportText = (value, { maxLength = 2000 } = {}) =>
  String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\s+\n/g, "\n")
    .trim()
    .slice(0, maxLength);

export const sanitizeSupportEmail = (value) =>
  String(value || "").trim().toLowerCase().slice(0, 254);

export const isValidSupportEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

export const getWaitingCycleDates = (now = new Date()) => {
  const waitingSince = new Date(now);
  const autoCloseAt = new Date(waitingSince.getTime() + WAITING_AUTO_CLOSE_DELAY_MS);

  return {
    waitingSince,
    autoCloseAt,
  };
};

export const hasCustomerReplySinceLatestSupportReply = (ticket = {}) => {
  const lastCustomerReplyAt = toDate(ticket.lastCustomerReplyAt);
  const lastSupportReplyAt = toDate(ticket.lastSupportReplyAt);

  if (!lastCustomerReplyAt || !lastSupportReplyAt) {
    return false;
  }

  return lastCustomerReplyAt >= lastSupportReplyAt;
};

export const isWaitingForCustomerWithoutReply = (ticket = {}) =>
  normalizeSupportTicketStatus(ticket.status) ===
    SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER &&
  !hasCustomerReplySinceLatestSupportReply(ticket);

export const shouldSendWaitingReminder = (ticket = {}, now = new Date()) => {
  if (!isWaitingForCustomerWithoutReply(ticket) || ticket.reminderSentAt) {
    return false;
  }

  const waitingSince = toDate(ticket.waitingSince);
  if (!waitingSince) return false;

  return new Date(now).getTime() - waitingSince.getTime() >= WAITING_REMINDER_DELAY_MS;
};

export const shouldAutoCloseWaitingTicket = (ticket = {}, now = new Date()) => {
  if (!isWaitingForCustomerWithoutReply(ticket)) {
    return false;
  }

  const autoCloseAt = toDate(ticket.autoCloseAt);
  if (!autoCloseAt) return false;

  return autoCloseAt.getTime() <= new Date(now).getTime();
};

export const canReopenSupportTicket = (ticket = {}, now = new Date()) => {
  if (normalizeSupportTicketStatus(ticket.status) !== SUPPORT_TICKET_STATUSES.CLOSED) {
    return false;
  }

  const closedAt = toDate(ticket.closedAt);
  if (!closedAt) return false;

  return new Date(now).getTime() - closedAt.getTime() <= CLOSED_REOPEN_WINDOW_MS;
};

export const applyWaitingForCustomerFields = (ticket, now = new Date()) => {
  const { waitingSince, autoCloseAt } = getWaitingCycleDates(now);

  ticket.status = SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER;
  ticket.waitingSince = waitingSince;
  ticket.lastSupportReplyAt = waitingSince;
  ticket.reminderSentAt = null;
  ticket.autoCloseAt = autoCloseAt;
};

export const applyCustomerReplyFields = (ticket, now = new Date()) => {
  ticket.lastCustomerReplyAt = new Date(now);

  if (
    normalizeSupportTicketStatus(ticket.status) ===
    SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER
  ) {
    ticket.status = SUPPORT_TICKET_STATUSES.PENDING;
    ticket.reminderSentAt = null;
    ticket.autoCloseAt = null;
  }
};

export const applyClosedTicketReopenFields = (
  ticket,
  { status = SUPPORT_TICKET_STATUSES.OPEN, now = new Date() } = {}
) => {
  ticket.status = status;
  ticket.reopenedAt = new Date(now);
  ticket.closedAt = null;
  ticket.closedReason = "";
  ticket.reminderSentAt = null;
  ticket.autoCloseAt = null;
};

export const canManageSupportTickets = (user = {}) => user?.role === "admin";

export const ticketBelongsToUser = (ticket = {}, user = {}) => {
  if (!ticket || !user?._id) return false;

  const userId = user._id?.toString?.() || String(user._id);
  const customerId =
    ticket.customer?._id?.toString?.() ||
    ticket.customer?.toString?.() ||
    ticket.user?._id?.toString?.() ||
    ticket.user?.toString?.() ||
    "";

  return Boolean(customerId) && customerId === userId;
};

export const stripInternalNotesFromTicket = (ticket = {}) => ({
  ...ticket,
  replies: Array.isArray(ticket.replies)
    ? ticket.replies.filter((reply) => !reply.isInternalNote)
    : [],
  activities: undefined,
});

export const buildWaitingReminderClaimFilter = (
  ticketId,
  now = new Date(),
  lockExpiry = new Date()
) => ({
  _id: ticketId,
  status: SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER,
  reminderSentAt: null,
  waitingSince: { $lte: new Date(new Date(now).getTime() - WAITING_REMINDER_DELAY_MS) },
  $and: [
    {
      $or: [
        { lastCustomerReplyAt: null },
        { lastCustomerReplyAt: { $exists: false } },
        { $expr: { $lt: ["$lastCustomerReplyAt", "$lastSupportReplyAt"] } },
      ],
    },
    {
      $or: [
        { "workflowLock.expiresAt": null },
        { "workflowLock.expiresAt": { $exists: false } },
        { "workflowLock.expiresAt": { $lte: lockExpiry } },
      ],
    },
  ],
});

export const buildWaitingAutoCloseClaimFilter = (
  ticketId,
  now = new Date(),
  lockExpiry = new Date()
) => ({
  _id: ticketId,
  status: SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER,
  autoCloseAt: { $lte: new Date(now) },
  $and: [
    {
      $or: [
        { lastCustomerReplyAt: null },
        { lastCustomerReplyAt: { $exists: false } },
        { $expr: { $lt: ["$lastCustomerReplyAt", "$lastSupportReplyAt"] } },
      ],
    },
    {
      $or: [
        { "workflowLock.expiresAt": null },
        { "workflowLock.expiresAt": { $exists: false } },
        { "workflowLock.expiresAt": { $lte: lockExpiry } },
      ],
    },
  ],
});
