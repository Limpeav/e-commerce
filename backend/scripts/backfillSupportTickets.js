import "../config/env.js";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Counter from "../models/counterModel.js";
import SupportTicket from "../models/supportTicketModel.js";
import {
  SUPPORT_TICKET_COUNTER_KEY,
  formatSupportTicketNumber,
} from "../utils/supportTicketNumbers.js";
import {
  SUPPORT_TICKET_SENDER_TYPES,
  SUPPORT_TICKET_STATUSES,
  normalizeSupportTicketPriority,
  normalizeSupportTicketStatus,
  normalizeSupportTicketTopic,
} from "../utils/supportTicketRules.js";

const parseExistingSequence = (ticketNumber = "") => {
  const match = String(ticketNumber).match(/^CBS-(\d+)$/);
  return match ? Number(match[1]) : 0;
};

const getHighestExistingSequence = async () => {
  const tickets = await SupportTicket.find({
    ticketNumber: /^CBS-\d+$/,
  })
    .select("ticketNumber")
    .lean();

  return tickets.reduce(
    (highest, ticket) =>
      Math.max(highest, parseExistingSequence(ticket.ticketNumber)),
    0
  );
};

await connectDB();

try {
  const highestExistingSequence = await getHighestExistingSequence();
  const counter = await Counter.findOneAndUpdate(
    { _id: SUPPORT_TICKET_COUNTER_KEY },
    { $max: { sequence: highestExistingSequence } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  let nextSequence = counter.sequence;

  const tickets = await SupportTicket.find({}).sort({ createdAt: 1 });
  let updatedCount = 0;

  for (const ticket of tickets) {
    let changed = false;

    if (!ticket.ticketNumber) {
      nextSequence += 1;
      ticket.sequence = nextSequence;
      ticket.ticketNumber = formatSupportTicketNumber(nextSequence);
      changed = true;
    } else if (!ticket.sequence) {
      ticket.sequence = parseExistingSequence(ticket.ticketNumber) || undefined;
      changed = true;
    }

    const normalizedStatus = normalizeSupportTicketStatus(ticket.status);
    if (normalizedStatus && ticket.status !== normalizedStatus) {
      ticket.status = normalizedStatus;
      changed = true;
    }

    const normalizedPriority = normalizeSupportTicketPriority(ticket.priority);
    if (ticket.priority !== normalizedPriority) {
      ticket.priority = normalizedPriority;
      changed = true;
    }

    const normalizedTopic = normalizeSupportTicketTopic(ticket.inquiryTopic || ticket.topic);
    if (ticket.inquiryTopic !== normalizedTopic || ticket.topic !== normalizedTopic) {
      ticket.inquiryTopic = normalizedTopic;
      ticket.topic = normalizedTopic;
      changed = true;
    }

    ticket.fullName = ticket.fullName || ticket.name || "Customer";
    ticket.name = ticket.fullName;
    ticket.phoneNumber = ticket.phoneNumber || ticket.phone || "";
    ticket.phone = ticket.phoneNumber;
    ticket.subject = ticket.subject || ticket.inquiryTopic || "Support request";
    ticket.message = ticket.message || "Support request";
    changed =
      changed ||
      ticket.isModified("fullName") ||
      ticket.isModified("name") ||
      ticket.isModified("phoneNumber") ||
      ticket.isModified("phone") ||
      ticket.isModified("subject") ||
      ticket.isModified("message");

    if (ticket.user && !ticket.customer) {
      ticket.customer = ticket.user;
      changed = true;
    }

    if (ticket.customer && !ticket.user) {
      ticket.user = ticket.customer;
      changed = true;
    }

    if (!ticket.replies?.length) {
      ticket.replies.push({
        senderType: SUPPORT_TICKET_SENDER_TYPES.CUSTOMER,
        sender: ticket.customer,
        senderName: ticket.fullName,
        message: ticket.message,
        attachments: [],
        createdAt: ticket.createdAt || new Date(),
      });
      ticket.lastCustomerReplyAt = ticket.createdAt || new Date();
      changed = true;
    }

    if (!ticket.activities?.length) {
      ticket.activities.push({
        action: "TICKET_BACKFILLED",
        previousStatus: null,
        newStatus: ticket.status || SUPPORT_TICKET_STATUSES.OPEN,
        performedBy: "SYSTEM",
        description: "Support ticket normalized by backfill script.",
        createdAt: new Date(),
      });
      changed = true;
    }

    if (changed) {
      await ticket.save();
      updatedCount += 1;
    }
  }

  await Counter.findOneAndUpdate(
    { _id: SUPPORT_TICKET_COUNTER_KEY },
    { $max: { sequence: nextSequence } },
    { upsert: true }
  );

  console.log(`Backfilled ${updatedCount} support tickets.`);
  console.log(`Support ticket counter is at ${nextSequence}.`);
} finally {
  await mongoose.disconnect();
}
