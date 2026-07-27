import { processSupportTicketAutomation } from "./supportTicketService.js";

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;

let supportTicketTimer = null;
let supportTicketAutomationRunning = false;

const getSchedulerConfig = () => {
  const enabled = process.env.SUPPORT_TICKET_AUTOMATION_ENABLED !== "false";
  const intervalMs = Number(process.env.SUPPORT_TICKET_AUTOMATION_INTERVAL_MS);

  return {
    enabled,
    intervalMs:
      Number.isFinite(intervalMs) && intervalMs > 0
        ? intervalMs
        : DEFAULT_INTERVAL_MS,
  };
};

const runSupportTicketAutomation = async () => {
  if (supportTicketAutomationRunning) {
    return;
  }

  supportTicketAutomationRunning = true;

  try {
    const summary = await processSupportTicketAutomation();

    if (summary.reminders.processed || summary.closures.processed) {
      console.log("Support ticket automation:", summary);
    }
  } catch (error) {
    console.error("Support ticket automation failed:", error.message);
  } finally {
    supportTicketAutomationRunning = false;
  }
};

export const startSupportTicketAutomation = () => {
  const config = getSchedulerConfig();

  if (!config.enabled || supportTicketTimer) {
    return null;
  }

  supportTicketTimer = setInterval(runSupportTicketAutomation, config.intervalMs);
  supportTicketTimer.unref?.();
  setImmediate(runSupportTicketAutomation);

  console.log(`Support ticket automation enabled every ${config.intervalMs}ms`);

  return supportTicketTimer;
};

export const stopSupportTicketAutomation = () => {
  if (supportTicketTimer) {
    clearInterval(supportTicketTimer);
    supportTicketTimer = null;
  }
};
