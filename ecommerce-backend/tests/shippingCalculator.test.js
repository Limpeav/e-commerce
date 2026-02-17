import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateShippingFee,
  getShippingQuote,
} from "../utils/shippingCalculator.js";

test("calculateShippingFee applies free shipping for high cart value", () => {
  const fee = calculateShippingFee({
    shippingAddress: { city: "Phnom Penh", country: "Cambodia" },
    itemCount: 3,
    totalQuantity: 5,
    itemsPrice: 160,
  });

  assert.equal(fee, 0);
});

test("calculateShippingFee applies surcharge for international shipping", () => {
  const domestic = calculateShippingFee({
    shippingAddress: { city: "Phnom Penh", country: "Cambodia" },
    itemCount: 1,
    totalQuantity: 1,
    itemsPrice: 20,
  });

  const international = calculateShippingFee({
    shippingAddress: { city: "Phnom Penh", country: "Thailand" },
    itemCount: 1,
    totalQuantity: 1,
    itemsPrice: 20,
  });

  assert.ok(international > domestic);
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
  assert.ok(quote.shippingPrice >= 0);
});
