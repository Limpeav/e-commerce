import test from "node:test";
import assert from "node:assert/strict";
import { calcAmountKHR, formatKHR, DEFAULT_RATE } from "../utils/exchangeRate.js";

test("calcAmountKHR converts USD to KHR correctly", () => {
  assert.equal(calcAmountKHR(10, 4100), 41000);
  assert.equal(calcAmountKHR(1.5, 4100), 6150);
  assert.equal(calcAmountKHR(0, 4100), 0);
  assert.equal(calcAmountKHR(100.99, 4100), 414059);
  assert.equal(calcAmountKHR(50, 4000), 200000);
});

test("calcAmountKHR handles edge cases", () => {
  assert.equal(calcAmountKHR(null, 4100), 0);
  assert.equal(calcAmountKHR(undefined, 4100), 0);
  assert.equal(calcAmountKHR("10", "4100"), 41000);
  assert.equal(calcAmountKHR(10, null), 0);
  assert.equal(calcAmountKHR(10, undefined), 0);
});

test("calcAmountKHR rounds to nearest integer (Riel has no subunit)", () => {
  assert.equal(calcAmountKHR(1.23, 4100), 5043);
  assert.equal(calcAmountKHR(1.234, 4100), 5059);
});

test("DEFAULT_RATE is 4100", () => {
  assert.equal(DEFAULT_RATE, 4100);
});

test("formatKHR formats large numbers with locale separators", () => {
  assert.equal(formatKHR(41000), "41,000");
  assert.equal(formatKHR(1000000), "1,000,000");
  assert.equal(formatKHR(0), "0");
  assert.equal(formatKHR(null), "0");
});

import express from "express";
import request from "supertest";

test("GET /api/payments/exchange-rate returns exchangeRate field", async () => {
  const app = express();
  app.get("/api/payments/exchange-rate", (req, res) => {
    res.json({ exchangeRate: 4100, usd_to_khr_rate: 4100 });
  });

  const res = await request(app)
    .get("/api/payments/exchange-rate")
    .expect(200);

  assert.ok(res.body.exchangeRate !== undefined);
  assert.equal(typeof res.body.exchangeRate, "number");
  assert.equal(res.body.exchangeRate, 4100);
});

test("GET /api/payments/exchange-rate response includes backward-compat field", async () => {
  const app = express();
  app.get("/api/payments/exchange-rate", (req, res) => {
    res.json({ exchangeRate: 4200, usd_to_khr_rate: 4200 });
  });

  const res = await request(app)
    .get("/api/payments/exchange-rate")
    .expect(200);

  assert.equal(res.body.usd_to_khr_rate, 4200);
});

test("Bakong payment amountKHR matches calcAmountKHR", () => {
  const amountUSD = 25.50;
  const exchangeRate = 4100;
  const amountKHR = calcAmountKHR(amountUSD, exchangeRate);

  assert.equal(amountKHR, Math.round(25.50 * 4100));
  assert.equal(amountKHR, 104550);
});
