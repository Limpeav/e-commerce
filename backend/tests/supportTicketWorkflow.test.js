import test from "node:test";
import assert from "node:assert/strict";
import SupportTicket from "../models/supportTicketModel.js";
import {
  buildCustomerTicketUrl,
  createSupportTicketAccessToken,
  verifySupportTicketAccessToken,
} from "../services/supportTicketService.js";
import {
  getAdminFrontendUrl,
  getCustomerFrontendUrl,
} from "../utils/frontendUrls.js";
import {
  SUPPORT_TICKET_STATUSES,
  applyClosedTicketReopenFields,
  applyCustomerReplyFields,
  applyWaitingForCustomerFields,
  buildWaitingReminderClaimFilter,
  canManageSupportTickets,
  canReopenSupportTicket,
  normalizeSupportTicketStatus,
  normalizeSupportTicketTopic,
  shouldAutoCloseWaitingTicket,
  shouldSendWaitingReminder,
  stripInternalNotesFromTicket,
  ticketBelongsToUser,
} from "../utils/supportTicketRules.js";

const baseNow = new Date("2026-07-27T08:00:00.000Z");
const daysAfter = (days) => new Date(baseNow.getTime() + days * 24 * 60 * 60 * 1000);

const withEnv = (updates, callback) => {
  const previousValues = new Map();

  for (const key of Object.keys(updates)) {
    previousValues.set(key, process.env[key]);
    if (updates[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = updates[key];
    }
  }

  try {
    callback();
  } finally {
    for (const [key, value] of previousValues.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

test("development support email links prefer local frontend URLs", () => {
  withEnv(
    {
      NODE_ENV: undefined,
      FRONTEND_URL: "https://cherishbabykhstore.store",
      ADMIN_FRONTEND_URL: "https://cherishbabykhstore.store",
      SUPPORT_CUSTOMER_FRONTEND_URL: undefined,
      SUPPORT_FRONTEND_URL: undefined,
      SUPPORT_ADMIN_FRONTEND_URL: undefined,
      SUPPORT_ADMIN_URL: undefined,
    },
    () => {
      assert.equal(getCustomerFrontendUrl(), "http://localhost:5173");
      assert.equal(getAdminFrontendUrl(), "http://localhost:5174");
    }
  );
});

test("production support email links use configured frontend URLs", () => {
  withEnv(
    {
      NODE_ENV: "production",
      FRONTEND_URL: "https://cherishbabykhstore.store",
      ADMIN_FRONTEND_URL: "https://admin.cherishbabykhstore.store",
      SUPPORT_CUSTOMER_FRONTEND_URL: undefined,
      SUPPORT_FRONTEND_URL: undefined,
      SUPPORT_ADMIN_FRONTEND_URL: undefined,
      SUPPORT_ADMIN_URL: undefined,
    },
    () => {
      assert.equal(getCustomerFrontendUrl(), "https://cherishbabykhstore.store");
      assert.equal(getAdminFrontendUrl(), "https://admin.cherishbabykhstore.store");
    }
  );
});

test("customer support email links open the ticket detail route with a valid token", () => {
  withEnv(
    {
      NODE_ENV: undefined,
      FRONTEND_URL: "http://localhost:5173",
      SUPPORT_CUSTOMER_FRONTEND_URL: undefined,
      SUPPORT_FRONTEND_URL: undefined,
      JWT_SECRET: "support-link-test-secret",
      SUPPORT_TICKET_LINK_SECRET: undefined,
    },
    () => {
      const ticket = {
        ticketNumber: "CBS-000004",
        email: "customer@example.com",
        guestAccessVersion: 1,
        customer: "64f000000000000000000001",
      };
      const accessToken = createSupportTicketAccessToken(ticket);
      const ticketUrl = buildCustomerTicketUrl(ticket, accessToken);
      const parsedUrl = new URL(ticketUrl);

      assert.equal(
        `${parsedUrl.origin}${parsedUrl.pathname}`,
        "http://localhost:5173/customer/support/tickets/CBS-000004"
      );
      assert.equal(
        verifySupportTicketAccessToken(
          ticket,
          parsedUrl.searchParams.get("accessToken")
        ),
        true
      );
    }
  );
});

test("new support ticket documents default to OPEN", async () => {
  const ticket = new SupportTicket({
    fullName: "Customer",
    email: "customer@example.com",
    subject: "Need help",
    message: "My order needs support.",
  });

  await ticket.validate();

  assert.equal(ticket.status, SUPPORT_TICKET_STATUSES.OPEN);
});

test("admin waiting-for-customer action sets waiting dates", () => {
  const ticket = {
    status: SUPPORT_TICKET_STATUSES.PENDING,
  };

  applyWaitingForCustomerFields(ticket, baseNow);

  assert.equal(ticket.status, SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER);
  assert.equal(ticket.waitingSince.toISOString(), baseNow.toISOString());
  assert.equal(ticket.lastSupportReplyAt.toISOString(), baseNow.toISOString());
  assert.equal(ticket.autoCloseAt.toISOString(), daysAfter(7).toISOString());
  assert.equal(ticket.reminderSentAt, null);
});

test("waiting reminder is eligible after three full days", () => {
  const ticket = {
    status: SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER,
    waitingSince: baseNow,
    lastSupportReplyAt: baseNow,
    lastCustomerReplyAt: daysAfter(-1),
    reminderSentAt: null,
  };

  assert.equal(shouldSendWaitingReminder(ticket, daysAfter(2)), false);
  assert.equal(shouldSendWaitingReminder(ticket, daysAfter(3)), true);
});

test("waiting reminder is sent only once in a waiting cycle", () => {
  const ticket = {
    status: SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER,
    waitingSince: baseNow,
    lastSupportReplyAt: baseNow,
    lastCustomerReplyAt: null,
    reminderSentAt: daysAfter(3),
  };

  assert.equal(shouldSendWaitingReminder(ticket, daysAfter(4)), false);
});

test("waiting ticket closes after seven days without a customer reply", () => {
  const ticket = {
    status: SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER,
    waitingSince: baseNow,
    lastSupportReplyAt: baseNow,
    lastCustomerReplyAt: null,
    autoCloseAt: daysAfter(7),
  };

  assert.equal(shouldAutoCloseWaitingTicket(ticket, daysAfter(6)), false);
  assert.equal(shouldAutoCloseWaitingTicket(ticket, daysAfter(7)), true);
});

test("customer reply while waiting changes status to PENDING and clears automation fields", () => {
  const ticket = {
    status: SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER,
    lastSupportReplyAt: baseNow,
    reminderSentAt: daysAfter(3),
    autoCloseAt: daysAfter(7),
  };

  applyCustomerReplyFields(ticket, daysAfter(4));

  assert.equal(ticket.status, SUPPORT_TICKET_STATUSES.PENDING);
  assert.equal(ticket.lastCustomerReplyAt.toISOString(), daysAfter(4).toISOString());
  assert.equal(ticket.reminderSentAt, null);
  assert.equal(ticket.autoCloseAt, null);
});

test("customer reply before seven days prevents automatic closure", () => {
  const ticket = {
    status: SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER,
    waitingSince: baseNow,
    lastSupportReplyAt: baseNow,
    lastCustomerReplyAt: daysAfter(4),
    autoCloseAt: daysAfter(7),
  };

  assert.equal(shouldAutoCloseWaitingTicket(ticket, daysAfter(8)), false);
});

test("ticket can enter WAITING_FOR_CUSTOMER more than once", () => {
  const ticket = {
    status: SUPPORT_TICKET_STATUSES.PENDING,
    lastCustomerReplyAt: daysAfter(4),
    reminderSentAt: daysAfter(3),
    autoCloseAt: daysAfter(7),
  };

  applyWaitingForCustomerFields(ticket, daysAfter(5));

  assert.equal(ticket.status, SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER);
  assert.equal(ticket.waitingSince.toISOString(), daysAfter(5).toISOString());
  assert.equal(ticket.reminderSentAt, null);
  assert.equal(ticket.autoCloseAt.toISOString(), daysAfter(12).toISOString());
});

test("new waiting cycle can send a new reminder", () => {
  const ticket = {
    status: SUPPORT_TICKET_STATUSES.PENDING,
  };

  applyWaitingForCustomerFields(ticket, daysAfter(5));

  assert.equal(shouldSendWaitingReminder(ticket, daysAfter(8)), true);
});

test("closed ticket can reopen within thirty days", () => {
  const ticket = {
    status: SUPPORT_TICKET_STATUSES.CLOSED,
    closedAt: baseNow,
  };

  assert.equal(canReopenSupportTicket(ticket, daysAfter(30)), true);
});

test("closed ticket cannot reopen after thirty days", () => {
  const ticket = {
    status: SUPPORT_TICKET_STATUSES.CLOSED,
    closedAt: baseNow,
  };

  assert.equal(canReopenSupportTicket(ticket, daysAfter(31)), false);
});

test("reopening clears closed and waiting automation fields", () => {
  const ticket = {
    status: SUPPORT_TICKET_STATUSES.CLOSED,
    closedAt: baseNow,
    closedReason: "No response",
    reminderSentAt: daysAfter(3),
    autoCloseAt: daysAfter(7),
  };

  applyClosedTicketReopenFields(ticket, {
    status: SUPPORT_TICKET_STATUSES.PENDING,
    now: daysAfter(10),
  });

  assert.equal(ticket.status, SUPPORT_TICKET_STATUSES.PENDING);
  assert.equal(ticket.closedAt, null);
  assert.equal(ticket.closedReason, "");
  assert.equal(ticket.reminderSentAt, null);
  assert.equal(ticket.autoCloseAt, null);
});

test("customer ownership checks prevent access to another customer's ticket", () => {
  const ticket = {
    customer: {
      _id: "64f000000000000000000001",
    },
  };

  assert.equal(
    ticketBelongsToUser(ticket, { _id: "64f000000000000000000001" }),
    true
  );
  assert.equal(
    ticketBelongsToUser(ticket, { _id: "64f000000000000000000002" }),
    false
  );
});

test("internal notes are hidden from customer ticket serialization", () => {
  const ticket = {
    replies: [
      { message: "Customer-visible", isInternalNote: false },
      { message: "Internal note", isInternalNote: true },
    ],
    activities: [{ action: "INTERNAL_NOTE_ADDED" }],
  };

  const result = stripInternalNotesFromTicket(ticket);

  assert.equal(result.replies.length, 1);
  assert.equal(result.replies[0].message, "Customer-visible");
  assert.equal(result.activities, undefined);
});

test("only admin users can manage support tickets", () => {
  assert.equal(canManageSupportTickets({ role: "admin" }), true);
  assert.equal(canManageSupportTickets({ role: "user" }), false);
  assert.equal(canManageSupportTickets({ role: "seller" }), false);
});

test("scheduler reminder claim filter requires a waiting ticket and empty reminder", () => {
  const filter = buildWaitingReminderClaimFilter("ticket-id", daysAfter(3), baseNow);

  assert.equal(filter.status, SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER);
  assert.equal(filter.reminderSentAt, null);
  assert.ok(filter.$and.some((clause) => Array.isArray(clause.$or)));
});

test("legacy statuses and topics normalize to the new workflow values", () => {
  assert.equal(normalizeSupportTicketStatus("in_progress"), SUPPORT_TICKET_STATUSES.PENDING);
  assert.equal(normalizeSupportTicketStatus("waiting_for_customer"), SUPPORT_TICKET_STATUSES.WAITING_FOR_CUSTOMER);
  assert.equal(normalizeSupportTicketTopic("Billing & Finance"), "Payment Problem");
  assert.equal(normalizeSupportTicketTopic("unknown topic"), "Other");
});
