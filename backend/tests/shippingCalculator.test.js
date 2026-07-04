import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateShippingFee,
  getShippingQuote,
} from "../utils/shippingCalculator.js";

test("calculateShippingFee always returns free delivery", () => {
  const fee = calculateShippingFee({
    shippingAddress: { city: "Phnom Penh", country: "Cambodia" },
    itemCount: 1,
    totalQuantity: 1,
    itemsPrice: 20,
  });

  assert.equal(fee, 0);
});

test("calculateShippingFee keeps international delivery free", () => {
  const international = calculateShippingFee({
    shippingAddress: { city: "Phnom Penh", country: "Thailand" },
    itemCount: 1,
    totalQuantity: 1,
    itemsPrice: 20,
  });

  assert.equal(international, 0);
});

test("getShippingQuote returns normalized payload", () => {
  const quote = getShippingQuote({
    shippingAddress: { city: "Siem Reap", country: "Cambodia" },
    itemCount: 2,
    totalQuantity: 2,
    itemsPrice: 30,
  });

  assert.equal(quote.currency, "USD");
  assert.ok(typeof quote.shippingPrice === "number");
  assert.equal(quote.shippingPrice, 0);
});
