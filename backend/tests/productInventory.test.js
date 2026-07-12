import test from "node:test";
import assert from "node:assert/strict";
import {
    adjustProductInventory,
    getAvailableStock,
    normalizeSizeStocks,
    parseSizeStocksPayload,
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

test("available stock can be checked by selected color without size", () => {
  assert.equal(
    getAvailableStock(
      {
        stock: 7,
        reservedStock: 1,
        sizeStocks: normalizeSizeStocks([
          { size: "ONE SIZE", color: "Black", stock: 4, reservedStock: 1 },
          { size: "ONE SIZE", color: "Red", stock: 3, reservedStock: 0 },
        ]),
      },
      "",
      "black"
    ),
    3
  );
});

test("color-only stock does not fall back to total stock for a missing color row", () => {
  assert.equal(
    getAvailableStock(
      {
        stock: 7,
        reservedStock: 0,
        sizeStocks: normalizeSizeStocks([
          { size: "ONE SIZE", color: "Black", stock: 4 },
          { size: "ONE SIZE", color: "Red", stock: 3 },
        ]),
      },
      "",
      "Blue"
    ),
    0
  );
});

test("color-only inventory adjustments keep total stock in sync", () => {
  const product = {
    stock: 7,
    reservedStock: 0,
    sizeStocks: normalizeSizeStocks([
      { size: "ONE SIZE", color: "Black", stock: 4 },
      { size: "ONE SIZE", color: "Red", stock: 3 },
    ]),
  };

  adjustProductInventory(product, {
    color: "Red",
    quantity: 2,
    action: "reduce",
  });

  assert.equal(getAvailableStock(product, "", "Red"), 1);
  assert.equal(product.stock, 5);
});

test("size stock payload accepts simple admin CSV format", () => {
  assert.deepEqual(parseSizeStocksPayload("NB:5 | 0-3M:8"), [
    { size: "NB", color: "", stock: 5, reservedStock: 0 },
    { size: "0-3M", color: "", stock: 8, reservedStock: 0 },
  ]);
});

test("size stock payload accepts color variants in admin CSV format", () => {
  assert.deepEqual(parseSizeStocksPayload("NB:Pink:5 | NB:Blue:3"), [
    { size: "NB", color: "Pink", stock: 5, reservedStock: 0 },
    { size: "NB", color: "Blue", stock: 3, reservedStock: 0 },
  ]);
});
