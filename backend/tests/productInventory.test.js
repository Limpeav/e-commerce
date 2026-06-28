import test from "node:test";
import assert from "node:assert/strict";
import {
    adjustProductInventory,
    getAvailableStock,
    normalizeSizeStocks,
} from "../utils/productInventory.js";

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

test("available stock can be checked by selected size", () => {
  assert.equal(
    getAvailableStock(
      {
        stock: 8,
        reservedStock: 1,
        sizeStocks: normalizeSizeStocks([
          { size: "EU 16", stock: 3, reservedStock: 1 },
          { size: "EU 17", stock: 5, reservedStock: 0 },
        ]),
      },
      "eu 16"
    ),
    2
  );
});

test("size inventory adjustments keep total stock in sync", () => {
  const product = {
    stock: 8,
    reservedStock: 0,
    sizeStocks: normalizeSizeStocks([
      { size: "EU 16", stock: 3 },
      { size: "EU 17", stock: 5 },
    ]),
  };

  adjustProductInventory(product, {
    size: "EU 17",
    quantity: 2,
    action: "reduce",
  });

  assert.equal(getAvailableStock(product, "EU 17"), 3);
  assert.equal(product.stock, 6);
});
