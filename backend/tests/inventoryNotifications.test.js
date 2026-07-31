import test from "node:test";
import assert from "node:assert/strict";
import { createStockAlertPayload } from "../utils/inventoryNotifications.js";

test("variant stock alert payload uses matching color image", () => {
  const payload = createStockAlertPayload({
    product: {
      _id: "product-1",
      title: "Wooden Baby Changing Table",
      category: "Furniture",
      image: "https://example.com/white.jpg",
      colorImages: [
        { color: "White", image: "https://example.com/white.jpg" },
        { color: "Black", image: "https://example.com/black.jpg" },
      ],
    },
    stockAlert: {
      kind: "low-stock",
      lowStockAlertSent: true,
      outOfStockAlertSent: false,
    },
    stock: 1,
    threshold: 2,
    variant: {
      size: "ONE SIZE",
      color: "Black",
      label: "Black",
    },
  });

  assert.equal(payload.imageUrl, "https://example.com/black.jpg");
});

test("product stock alert payload uses product image", () => {
  const payload = createStockAlertPayload({
    product: {
      _id: "product-1",
      title: "Baby Lotion",
      category: "Skincare",
      image: "https://example.com/lotion.jpg",
      colorImages: [
        { color: "Black", image: "https://example.com/black.jpg" },
      ],
    },
    stockAlert: {
      kind: "low-stock",
      lowStockAlertSent: true,
      outOfStockAlertSent: false,
    },
    stock: 5,
    threshold: 5,
  });

  assert.equal(payload.imageUrl, "https://example.com/lotion.jpg");
});
