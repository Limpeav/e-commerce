import { getBakongConfig } from "../config/bakong.js";
import { reconcilePendingBakongPayments } from "../controllers/paymentController.js";

let reconciliationTimer = null;
let reconciliationRunning = false;

const runReconciliation = async () => {
  if (reconciliationRunning) {
    return;
  }

  reconciliationRunning = true;

  try {
    const summary = await reconcilePendingBakongPayments();

    if (summary.completed || summary.expired || summary.failed) {
      console.log("Bakong reconciliation:", summary);
    }
  } catch (error) {
    console.error("Bakong reconciliation worker failed:", error.message);
  } finally {
    reconciliationRunning = false;
  }
};

export const startBakongReconciliation = () => {
  const config = getBakongConfig();

  if (!config.enabled || reconciliationTimer) {
    return null;
  }

  reconciliationTimer = setInterval(
    runReconciliation,
    config.reconciliationIntervalMs
  );
  reconciliationTimer.unref?.();
  setImmediate(runReconciliation);

  console.log(
    `Bakong reconciliation enabled every ${config.reconciliationIntervalMs}ms`
  );

  return reconciliationTimer;
};

export const stopBakongReconciliation = () => {
  if (reconciliationTimer) {
    clearInterval(reconciliationTimer);
    reconciliationTimer = null;
  }
};
