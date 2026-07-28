import test from "node:test";
import assert from "node:assert/strict";
import {
  getLowStockThreshold,
  getStockAlert,
  shouldSendLowStockAlert,
  shouldSendOutOfStockAlert,
  syncLowStockAlertFlag,
} from "../utils/stockAlerts.js";

test("low stock alert fires when stock crosses threshold but remains above zero", (t) => {
  const threshold = getLowStockThreshold();
  if (threshold === 0) {
    t.skip("LOW_STOCK_THRESHOLD=0 has no separate low-stock state");
    return;
  }

  assert.equal(
    shouldSendLowStockAlert({
      previousStock: threshold + 3,
      currentStock: threshold,
      lowStockAlertSent: false,
    }),
    true
  );
});

test("low stock alert does not fire for out of stock", () => {
  assert.equal(
    shouldSendLowStockAlert({
      previousStock: getLowStockThreshold() + 3,
      currentStock: 0,
      lowStockAlertSent: false,
    }),
    false
  );
});

test("out of stock alert fires when stock reaches zero", () => {
  assert.equal(
    shouldSendOutOfStockAlert({
      previousStock: 1,
      currentStock: 0,
      outOfStockAlertSent: false,
    }),
    true
  );
});

test("stock alert prioritizes out of stock over low stock", () => {
  assert.deepEqual(
    getStockAlert({
      previousStock: getLowStockThreshold() + 3,
      currentStock: 0,
      lowStockAlertSent: false,
      outOfStockAlertSent: false,
    }),
    {
      kind: "out-of-stock",
      lowStockAlertSent: true,
      outOfStockAlertSent: true,
    }
  );
});

test("stock alert flags reset after replenishment", () => {
  const product = {
    stock: 10,
    lowStockAlertSent: true,
    outOfStockAlertSent: true,
  };

  syncLowStockAlertFlag(product);

  assert.equal(product.lowStockAlertSent, false);
  assert.equal(product.outOfStockAlertSent, false);
});
