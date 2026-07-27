import Counter from "../models/counterModel.js";

export const SUPPORT_TICKET_COUNTER_KEY = "supportTicket";
export const SUPPORT_TICKET_PREFIX = "CBS";

export const formatSupportTicketNumber = (sequence) =>
  `${SUPPORT_TICKET_PREFIX}-${String(sequence).padStart(6, "0")}`;

export const getNextCounterSequence = async (counterKey, { session } = {}) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: counterKey },
    { $inc: { sequence: 1 } },
    {
      new: true,
      setDefaultsOnInsert: true,
      upsert: true,
      session,
    }
  );

  return counter.sequence;
};

export const getNextSupportTicketNumber = async ({ session } = {}) => {
  const sequence = await getNextCounterSequence(SUPPORT_TICKET_COUNTER_KEY, {
    session,
  });

  return {
    sequence,
    ticketNumber: formatSupportTicketNumber(sequence),
  };
};
