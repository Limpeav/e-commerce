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
  "Cancel Order",
  "Change Shipping Address",
  "Delivery Issue",
  "Tracking Problem",
  "Damaged Item",
  "Wrong Item Received",
  "Missing Item",
  "Warranty Support",
  "Product Inquiry",
  "Payment Problem",
  "Technical Support",
  "Account Issue",
  "Suggestion",
  "Other",
]);

export const SUPPORT_ORDER_NOT_APPLICABLE = "N/A";
export const DEFAULT_NON_WARRANTY_SUPPORT_DAYS = 7;
export const MAX_SUPPORT_TICKETS_PER_REQUESTER = 2;

export const SUPPORT_TICKET_QUOTA_CODES = Object.freeze({
  GENERAL_DUPLICATE: "GENERAL_DUPLICATE",
  ORDER_DUPLICATE: "ORDER_DUPLICATE",
  LIMIT_REACHED: "LIMIT_REACHED",
});

export const GENERAL_SUPPORT_TOPICS = Object.freeze([
  "Technical Support",
  "Account Issue",
  "Payment Problem",
  "Product Inquiry",
  "Suggestion",
  "Other",
]);

export const ACTIVE_ORDER_SUPPORT_TOPICS = Object.freeze([
  "Order Status",
  "Cancel Order",
  "Change Shipping Address",
  "Payment Problem",
  "Product Inquiry",
  "Technical Support",
  "Other",
]);

export const IN_TRANSIT_ORDER_SUPPORT_TOPICS = Object.freeze([
  "Order Status",
  "Delivery Issue",
  "Tracking Problem",
  "Payment Problem",
  "Product Inquiry",
  "Technical Support",
  "Other",
]);

export const DELIVERED_ORDER_SUPPORT_TOPICS = Object.freeze([
  "Delivery Issue",
  "Damaged Item",
  "Wrong Item Received",
  "Missing Item",
  "Warranty Support",
  "Product Inquiry",
  "Technical Support",
  "Other",
]);

export const OLD_DELIVERED_ORDER_SUPPORT_TOPICS = Object.freeze([
  "Product Inquiry",
  "Technical Support",
  "Other",
]);

export const CANCELLED_ORDER_SUPPORT_TOPICS = Object.freeze([
  "Order Status",
  "Payment Problem",
  "Technical Support",
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
  "return and refund": "Other",
  refund: "Other",
  returns: "Other",
  "return": "Other",
  warranty: "Warranty Support",
  "warranty claim": "Warranty Support",
  "product warranty": "Warranty Support",
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

export const normalizeSupportOrderReference = (value) => {
  const rawValue = sanitizeSupportText(value, { maxLength: 80 });
  const normalizedValue = rawValue.toLowerCase();

  if (
    !rawValue ||
    normalizedValue === "n/a" ||
    normalizedValue === "na" ||
    normalizedValue === "not applicable" ||
    normalizedValue === "not related to an order"
  ) {
    return SUPPORT_ORDER_NOT_APPLICABLE;
  }

  return rawValue.replace(/^#/, "");
};

export const isSupportOrderNotApplicable = (value) =>
  normalizeSupportOrderReference(value) === SUPPORT_ORDER_NOT_APPLICABLE;

const getEntityId = (value) =>
  value?._id?.toString?.() || value?.toString?.() || "";

const buildSupportReferenceKeys = ({ order, orderNumber } = {}) => {
  const keys = new Set();
  const orderId = getEntityId(order);

  if (orderId) {
    const normalizedOrderId = orderId.toLowerCase();
    keys.add(`order:${normalizedOrderId}`);
    keys.add(`reference:${normalizedOrderId}`);
    keys.add(`reference:${normalizedOrderId.slice(-8)}`);
  }

  const orderReference = normalizeSupportOrderReference(orderNumber);

  if (isSupportOrderNotApplicable(orderReference)) {
    if (!orderId) {
      keys.add("general");
    }
  } else {
    keys.add(`reference:${orderReference.toLowerCase()}`);
  }

  return keys;
};

const setsIntersect = (firstSet, secondSet) => {
  for (const value of firstSet) {
    if (secondSet.has(value)) return true;
  }

  return false;
};

export const getSupportTicketQuotaIssue = ({
  existingTickets = [],
  order = null,
  orderNumber = SUPPORT_ORDER_NOT_APPLICABLE,
} = {}) => {
  const requestedKeys = buildSupportReferenceKeys({ order, orderNumber });
  const duplicateTicket = existingTickets.find((ticket) =>
    setsIntersect(
      requestedKeys,
      buildSupportReferenceKeys({
        order: ticket.order,
        orderNumber: ticket.orderNumber,
      })
    )
  );

  if (duplicateTicket) {
    return {
      code: requestedKeys.has("general")
        ? SUPPORT_TICKET_QUOTA_CODES.GENERAL_DUPLICATE
        : SUPPORT_TICKET_QUOTA_CODES.ORDER_DUPLICATE,
      ticketNumber: duplicateTicket.ticketNumber || "",
    };
  }

  if (existingTickets.length >= MAX_SUPPORT_TICKETS_PER_REQUESTER) {
    return {
      code: SUPPORT_TICKET_QUOTA_CODES.LIMIT_REACHED,
      ticketNumber: "",
    };
  }

  return null;
};

export const getProductWarrantyDays = (product = {}) => {
  const warrantyDays = Number(
    product?.warrantyPeriodDays ??
      product?.warrantyDays ??
      product?.warranty?.periodDays ??
      product?.warranty?.days
  );

  return Number.isFinite(warrantyDays) && warrantyDays > 0
    ? warrantyDays
    : null;
};

const getOrderItemWarrantyDays = (item = {}) =>
  getProductWarrantyDays(item.product) ?? getProductWarrantyDays(item);

const addDays = (date, days) =>
  new Date(date.getTime() + Number(days || 0) * 24 * 60 * 60 * 1000);

export const getOrderSupportEligibility = (order = {}, now = new Date()) => {
  const status = String(order?.orderStatus || "").trim();

  if (status !== "Delivered") {
    return {
      isDelivered: false,
      isOldOrder: false,
      supportEndsAt: null,
      fallbackDays: DEFAULT_NON_WARRANTY_SUPPORT_DAYS,
    };
  }

  const deliveredAt =
    toDate(order.deliveredAt) || toDate(order.updatedAt) || toDate(order.createdAt);

  if (!deliveredAt) {
    return {
      isDelivered: true,
      isOldOrder: false,
      supportEndsAt: null,
      fallbackDays: DEFAULT_NON_WARRANTY_SUPPORT_DAYS,
    };
  }

  const orderItems = Array.isArray(order.orderItems) ? order.orderItems : [];
  const supportWindows = orderItems.length > 0
    ? orderItems.map((item) =>
        getOrderItemWarrantyDays(item) ?? DEFAULT_NON_WARRANTY_SUPPORT_DAYS
      )
    : [DEFAULT_NON_WARRANTY_SUPPORT_DAYS];
  const longestWindowDays = Math.max(...supportWindows);
  const supportEndsAt = addDays(deliveredAt, longestWindowDays);

  return {
    isDelivered: true,
    isOldOrder: supportEndsAt.getTime() < new Date(now).getTime(),
    supportEndsAt,
    longestWindowDays,
    fallbackDays: DEFAULT_NON_WARRANTY_SUPPORT_DAYS,
  };
};

export const getSupportTicketTopicsForOrder = (order = null, now = new Date()) => {
  if (!order) {
    return GENERAL_SUPPORT_TOPICS;
  }

  const status = String(order.orderStatus || "").trim();

  if (status === "Pending" || status === "Processing") {
    return ACTIVE_ORDER_SUPPORT_TOPICS;
  }

  if (status === "Shipped") {
    return IN_TRANSIT_ORDER_SUPPORT_TOPICS;
  }

  if (status === "Delivered") {
    return getOrderSupportEligibility(order, now).isOldOrder
      ? OLD_DELIVERED_ORDER_SUPPORT_TOPICS
      : DELIVERED_ORDER_SUPPORT_TOPICS;
  }

  if (status === "Cancelled") {
    return CANCELLED_ORDER_SUPPORT_TOPICS;
  }

  return GENERAL_SUPPORT_TOPICS;
};

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
