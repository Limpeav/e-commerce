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
  "Delivery Issue",
  "Return and Refund",
  "Product Inquiry",
  "Payment Problem",
  "Technical Support",
  "Account Issue",
  "Suggestion",
  "Other",
];

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
