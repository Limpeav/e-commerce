import axios from "axios";
import { API_BASE_URL, getUserToken, withAuthHeaders } from "./http";

export const SUPPORT_TICKET_STATUSES = [
  "OPEN",
  "PENDING",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
];

export const SUPPORT_TICKET_TOPICS = [
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
];

export const SUPPORT_ORDER_NOT_APPLICABLE = "N/A";
export const DEFAULT_NON_WARRANTY_SUPPORT_DAYS = 7;
export const MAX_SUPPORT_TICKETS_PER_REQUESTER = 2;

export const SUPPORT_TICKET_QUOTA_CODES = {
  GENERAL_DUPLICATE: "GENERAL_DUPLICATE",
  ORDER_DUPLICATE: "ORDER_DUPLICATE",
  LIMIT_REACHED: "LIMIT_REACHED",
};

export const GENERAL_SUPPORT_TOPICS = [
  "Technical Support",
  "Account Issue",
  "Payment Problem",
  "Product Inquiry",
  "Suggestion",
  "Other",
];

export const ACTIVE_ORDER_SUPPORT_TOPICS = [
  "Order Status",
  "Cancel Order",
  "Change Shipping Address",
  "Payment Problem",
  "Product Inquiry",
  "Technical Support",
  "Other",
];

export const IN_TRANSIT_ORDER_SUPPORT_TOPICS = [
  "Order Status",
  "Delivery Issue",
  "Tracking Problem",
  "Payment Problem",
  "Product Inquiry",
  "Technical Support",
  "Other",
];

export const DELIVERED_ORDER_SUPPORT_TOPICS = [
  "Delivery Issue",
  "Damaged Item",
  "Wrong Item Received",
  "Missing Item",
  "Warranty Support",
  "Product Inquiry",
  "Technical Support",
  "Other",
];

export const OLD_DELIVERED_ORDER_SUPPORT_TOPICS = [
  "Product Inquiry",
  "Technical Support",
  "Other",
];

export const CANCELLED_ORDER_SUPPORT_TOPICS = [
  "Order Status",
  "Payment Problem",
  "Technical Support",
  "Other",
];

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getProductWarrantyDays = (product = {}) => {
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
  const supportEndsAt = new Date(
    deliveredAt.getTime() + longestWindowDays * 24 * 60 * 60 * 1000
  );

  return {
    isDelivered: true,
    isOldOrder: supportEndsAt.getTime() < new Date(now).getTime(),
    supportEndsAt,
    longestWindowDays,
    fallbackDays: DEFAULT_NON_WARRANTY_SUPPORT_DAYS,
  };
};

export const getSupportTopicsForOrder = (order = null, now = new Date()) => {
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

const normalizeSupportOrderReference = (value) => {
  const rawValue = String(value || "").split("\u0000").join("").trim().slice(0, 80);
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

const isSupportOrderNotApplicable = (value) =>
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

const hasAttachments = (payload = {}) =>
  Array.isArray(payload.attachments) && payload.attachments.length > 0;

const toSupportFormData = (payload = {}) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (key === "attachments" || value === undefined || value === null) return;
    formData.append(key, value);
  });

  payload.attachments?.forEach((file) => {
    formData.append("attachments", file);
  });

  return formData;
};

const requestConfig = (payload = {}) => {
  const token = getUserToken();

  return {
    headers: {
      ...(hasAttachments(payload) ? {} : { "Content-Type": "application/json" }),
      ...withAuthHeaders(token),
    },
  };
};

const requestBody = (payload = {}) =>
  hasAttachments(payload) ? toSupportFormData(payload) : payload;

export const submitContactSupport = async (payload) => {
  const response = await axios.post(
    `${API_BASE_URL}/support/tickets`,
    requestBody(payload),
    requestConfig(payload)
  );

  return response.data;
};

export const getMySupportTickets = async () => {
  const token = getUserToken();
  const response = await axios.get(`${API_BASE_URL}/support/tickets/my`, {
    headers: withAuthHeaders(token),
  });

  return response.data.tickets || [];
};

export const getSupportTicket = async (ticketNumber, accessToken = "") => {
  const token = getUserToken();
  const response = await axios.get(
    `${API_BASE_URL}/support/tickets/${encodeURIComponent(ticketNumber)}`,
    {
      params: accessToken ? { accessToken } : {},
      headers: withAuthHeaders(token),
    }
  );

  return response.data.ticket;
};

export const replyToSupportTicket = async (ticketNumber, payload = {}) => {
  const response = await axios.post(
    `${API_BASE_URL}/support/tickets/${encodeURIComponent(ticketNumber)}/replies`,
    requestBody(payload),
    requestConfig(payload)
  );

  return response.data.ticket;
};

export const reopenSupportTicket = async (ticketNumber, payload = {}) => {
  const response = await axios.post(
    `${API_BASE_URL}/support/tickets/${encodeURIComponent(ticketNumber)}/reopen`,
    requestBody(payload),
    requestConfig(payload)
  );

  return response.data.ticket;
};
