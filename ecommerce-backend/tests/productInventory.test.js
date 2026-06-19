import test from "node:test";
import assert from "node:assert/strict";
import { getAvailableStock } from "../utils/productInventory.js";

test("available stock excludes pending KHQR reservations", () => {
  assert.equal(
    getAvailableStock({
      stock: 10,
      reservedStock: 3,
      hasProductIssue: false,
    }),
    7
  );
});

test("available stock excludes reservations and damaged quantity", () => {
  assert.equal(
    getAvailableStock({
      stock: 10,
      reservedStock: 3,
      hasProductIssue: true,
      issueQuantity: 2,
    }),
    5
  );
});
