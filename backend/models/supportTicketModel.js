import mongoose from "mongoose";
import {
  SUPPORT_TICKET_PRIORITIES,
  SUPPORT_TICKET_SENDER_TYPES,
  SUPPORT_TICKET_STATUSES,
  SUPPORT_TICKET_TOPICS,
  normalizeSupportTicketPriority,
  normalizeSupportTicketStatus,
  normalizeSupportTicketTopic,
} from "../utils/supportTicketRules.js";

const attachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
    resourceType: { type: String, trim: true },
  },
  { _id: false }
);

const supportTicketReplySchema = new mongoose.Schema(
  {
    senderType: {
      type: String,
      enum: Object.values(SUPPORT_TICKET_SENDER_TYPES),
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    senderName: {
      type: String,
      default: "",
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    isInternalNote: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const supportTicketActivitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    previousStatus: {
      type: String,
      enum: [...Object.values(SUPPORT_TICKET_STATUSES), null],
      default: null,
    },
    newStatus: {
      type: String,
      enum: [...Object.values(SUPPORT_TICKET_STATUSES), null],
      default: null,
    },
    performedBy: {
      type: mongoose.Schema.Types.Mixed,
      default: "SYSTEM",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const emailFailureSchema = new mongoose.Schema(
  {
    template: { type: String, required: true, trim: true },
    error: { type: String, required: true, trim: true },
    failedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const supportTicketSchema = new mongoose.Schema(
  {
    sequence: {
      type: Number,
      min: 1,
    },
    ticketNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Legacy alias used by the original support ticket implementation.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    // Legacy alias for fullName.
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      default: "",
      trim: true,
    },
    // Legacy alias for phoneNumber.
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    orderNumber: {
      type: String,
      default: "",
      trim: true,
    },
    inquiryTopic: {
      type: String,
      enum: SUPPORT_TICKET_TOPICS,
      default: "Other",
      trim: true,
    },
    // Legacy alias for inquiryTopic.
    topic: {
      type: String,
      default: "Other",
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    // Legacy field containing the first customer message.
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(SUPPORT_TICKET_STATUSES),
      default: SUPPORT_TICKET_STATUSES.OPEN,
    },
    priority: {
      type: String,
      enum: Object.values(SUPPORT_TICKET_PRIORITIES),
      default: SUPPORT_TICKET_PRIORITIES.NORMAL,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    waitingSince: {
      type: Date,
    },
    lastCustomerReplyAt: {
      type: Date,
    },
    lastSupportReplyAt: {
      type: Date,
    },
    reminderSentAt: {
      type: Date,
    },
    autoCloseAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    closedReason: {
      type: String,
      default: "",
      trim: true,
    },
    reopenedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    replies: {
      type: [supportTicketReplySchema],
      default: [],
    },
    activities: {
      type: [supportTicketActivitySchema],
      default: [],
    },
    emailFailures: {
      type: [emailFailureSchema],
      default: [],
    },
    guestAccessVersion: {
      type: Number,
      default: 1,
    },
    workflowLock: {
      token: { type: String },
      type: { type: String },
      expiresAt: { type: Date },
    },
  },
  { timestamps: true }
);

supportTicketSchema.pre("validate", function normalizeSupportTicketFields() {
  const normalizedStatus = normalizeSupportTicketStatus(this.status);
  if (normalizedStatus) {
    this.status = normalizedStatus;
  }

  this.priority = normalizeSupportTicketPriority(this.priority);
  this.inquiryTopic = normalizeSupportTicketTopic(this.inquiryTopic || this.topic);
  this.topic = this.inquiryTopic;
  this.fullName = this.fullName || this.name;
  this.name = this.fullName;
  this.phoneNumber = this.phoneNumber || this.phone || "";
  this.phone = this.phoneNumber;
  this.subject = this.subject || this.inquiryTopic || "Support request";
  this.message =
    this.message ||
    this.replies?.find?.((reply) => reply.senderType === "CUSTOMER")?.message ||
    "Support request";

  if (this.customer && !this.user) {
    this.user = this.customer;
  }

  if (this.user && !this.customer) {
    this.customer = this.user;
  }

  if (this.status === SUPPORT_TICKET_STATUSES.RESOLVED && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }

  if (this.status !== SUPPORT_TICKET_STATUSES.RESOLVED) {
    this.resolvedAt = undefined;
  }
});

supportTicketSchema.index({ status: 1, updatedAt: -1 });
supportTicketSchema.index({ customer: 1, updatedAt: -1 });
supportTicketSchema.index({ user: 1, updatedAt: -1 });
supportTicketSchema.index({ assignedTo: 1, status: 1, updatedAt: -1 });
supportTicketSchema.index({
  status: 1,
  waitingSince: 1,
  reminderSentAt: 1,
  autoCloseAt: 1,
});
supportTicketSchema.index({ email: 1, ticketNumber: 1 });

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;
