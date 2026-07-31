import test from "node:test";
import assert from "node:assert/strict";
import {
  getInventoryStockAlert,
  getLowStockThreshold,
  getProductLowStockThreshold,
  getStockAlertTargetStock,
  getStockAlert,
  getVariantLowStockThreshold,
  shouldSendLowStockAlert,
  shouldSendOutOfStockAlert,
  syncLowStockAlertFlag,
} from "../utils/stockAlerts.js";

const withThresholdEnv = (updates, callback) => {
  const keys = [
    "LOW_STOCK_THRESHOLD",
    "PRODUCT_LOW_STOCK_THRESHOLD",
    "VARIANT_LOW_STOCK_THRESHOLD",
  ];
  const previousValues = new Map(
    keys.map((key) => [key, process.env[key]])
  );

  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      if (updates[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = updates[key];
      }
    }
  });

  try {
    callback();
  } finally {
    previousValues.forEach((value, key) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }
};

test("low stock alert fires when stock crosses threshold but remains above zero", (t) => {
  const threshold = getLowStockThreshold();
  if (threshold === 0) {
    t.skip("product low stock threshold 0 has no separate low-stock state");
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

test("low stock alert can fire at confirmation even when previous stock was already at threshold", () => {
  assert.equal(
    shouldSendLowStockAlert({
      previousStock: 5,
      currentStock: 2,
      lowStockAlertSent: false,
      threshold: 5,
      requireThresholdCross: false,
    }),
    true
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

test("default admin product low stock threshold is 5", () => {
  withThresholdEnv(
    {
      LOW_STOCK_THRESHOLD: undefined,
      PRODUCT_LOW_STOCK_THRESHOLD: undefined,
      VARIANT_LOW_STOCK_THRESHOLD: undefined,
    },
    () => {
      assert.equal(getProductLowStockThreshold(), 5);
    }
  );
});

test("default admin variant low stock threshold is 2", () => {
  withThresholdEnv(
    {
      LOW_STOCK_THRESHOLD: undefined,
      PRODUCT_LOW_STOCK_THRESHOLD: undefined,
      VARIANT_LOW_STOCK_THRESHOLD: undefined,
    },
    () => {
      assert.equal(getVariantLowStockThreshold(), 2);
    }
  );
});

test("product alert uses product stock threshold", () => {
  withThresholdEnv(
    {
      LOW_STOCK_THRESHOLD: undefined,
      PRODUCT_LOW_STOCK_THRESHOLD: undefined,
      VARIANT_LOW_STOCK_THRESHOLD: undefined,
    },
    () => {
      const product = {
        stock: 6,
        reservedStock: 0,
        lowStockAlertSent: false,
        outOfStockAlertSent: false,
      };
      const previousStock = getStockAlertTargetStock(product);

      product.stock = 5;
      syncLowStockAlertFlag(product);

      const alert = getInventoryStockAlert({
        product,
        previousStock,
      });

      assert.equal(alert.stock, 5);
      assert.equal(alert.threshold, 5);
      assert.equal(alert.stockAlert.kind, "low-stock");
      assert.equal(product.lowStockAlertSent, true);
    }
  );
});

test("variant alert uses size and color stock threshold", () => {
  withThresholdEnv(
    {
      LOW_STOCK_THRESHOLD: undefined,
      PRODUCT_LOW_STOCK_THRESHOLD: undefined,
      VARIANT_LOW_STOCK_THRESHOLD: undefined,
    },
    () => {
      const product = {
        stock: 12,
        reservedStock: 0,
        lowStockAlertSent: false,
        outOfStockAlertSent: false,
        sizeStocks: [
          {
            size: "M",
            color: "Black",
            stock: 3,
            reservedStock: 0,
            lowStockAlertSent: false,
            outOfStockAlertSent: false,
          },
          {
            size: "L",
            color: "Black",
            stock: 9,
            reservedStock: 0,
            lowStockAlertSent: false,
            outOfStockAlertSent: false,
          },
        ],
      };
      const previousStock = getStockAlertTargetStock(product, {
        size: "M",
        color: "Black",
      });

      product.sizeStocks[0].stock = 2;
      syncLowStockAlertFlag(product);

      const alert = getInventoryStockAlert({
        product,
        previousStock,
        size: "M",
        color: "Black",
      });

      assert.equal(alert.stock, 2);
      assert.equal(alert.threshold, 2);
      assert.equal(alert.variant.label, "M / Black");
      assert.equal(alert.stockAlert.kind, "low-stock");
      assert.equal(product.sizeStocks[0].lowStockAlertSent, true);
      assert.equal(product.lowStockAlertSent, false);
    }
  );
});
