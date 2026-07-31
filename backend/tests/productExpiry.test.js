import test from "node:test";
import assert from "node:assert/strict";
import {
  getDaysUntilProductExpiry,
  getProductExpiryAlertCutoffDate,
  getProductExpiryAlertStatus,
  getProductExpiryAlertWindowDays,
  shouldSendProductExpiryAlert,
  syncProductExpiryAlertFlag,
} from "../utils/productExpiry.js";

const withExpiryEnv = (updates, callback) => {
  const keys = ["PRODUCT_EXPIRY_ALERT_DAYS"];
  const previousValues = new Map(keys.map((key) => [key, process.env[key]]));

  keys.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(updates, key)) return;

    if (updates[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = updates[key];
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

const baseNow = new Date("2026-07-31T10:30:00.000Z");

test("default product expiry alert window is 60 days", () => {
  withExpiryEnv({ PRODUCT_EXPIRY_ALERT_DAYS: undefined }, () => {
    assert.equal(getProductExpiryAlertWindowDays(), 60);
  });
});

test("expiry alert cutoff uses UTC date boundaries", () => {
  const cutoffDate = getProductExpiryAlertCutoffDate({
    now: baseNow,
    windowDays: 60,
  });

  assert.equal(cutoffDate.toISOString(), "2026-09-29T00:00:00.000Z");
});

test("product expiring in 60 days is eligible for expiry alert", () => {
  const status = getProductExpiryAlertStatus(
    {
      category: "Milk",
      expiryDate: new Date("2026-09-29T00:00:00.000Z"),
    },
    { now: baseNow, windowDays: 60 }
  );

  assert.deepEqual(status, {
    eligible: true,
    daysUntilExpiry: 60,
    kind: "near-expiry",
  });
});

test("product expiring after alert window is not eligible", () => {
  assert.equal(
    getProductExpiryAlertStatus(
      {
        category: "Milk",
        expiryDate: new Date("2026-09-30T00:00:00.000Z"),
      },
      { now: baseNow, windowDays: 60 }
    ),
    null
  );
});

test("expired product with no previous alert is eligible", () => {
  assert.equal(
    getDaysUntilProductExpiry(new Date("2026-07-28T00:00:00.000Z"), baseNow),
    -3
  );

  assert.deepEqual(
    getProductExpiryAlertStatus(
      {
        category: "Bath & Skin",
        expiryDate: new Date("2026-07-28T00:00:00.000Z"),
      },
      { now: baseNow, windowDays: 60 }
    ),
    {
      eligible: true,
      daysUntilExpiry: -3,
      kind: "expired",
    }
  );
});

test("unsupported category never sends expiry alerts", () => {
  assert.equal(
    shouldSendProductExpiryAlert(
      {
        category: "Clothing",
        expiryDate: new Date("2026-09-01T00:00:00.000Z"),
        expiryAlertSent: false,
      },
      { now: baseNow, windowDays: 60 }
    ),
    false
  );
});

test("existing expiry alert prevents duplicate send", () => {
  assert.equal(
    shouldSendProductExpiryAlert(
      {
        category: "Milk",
        expiryDate: new Date("2026-09-01T00:00:00.000Z"),
        expiryAlertSent: true,
      },
      { now: baseNow, windowDays: 60 }
    ),
    false
  );
});

test("changing expiry date resets alert flag", () => {
  const product = {
    category: "Milk",
    expiryDate: new Date("2026-09-20T00:00:00.000Z"),
    expiryAlertSent: true,
    expiryAlertSentAt: new Date("2026-07-30T00:00:00.000Z"),
  };

  syncProductExpiryAlertFlag(
    product,
    new Date("2026-09-01T00:00:00.000Z"),
    { now: baseNow, windowDays: 60 }
  );

  assert.equal(product.expiryAlertSent, false);
  assert.equal(product.expiryAlertSentAt, null);
});
