import test from "node:test";
import assert from "node:assert/strict";
import {
  getProductSizes,
  parseProductDetailImagesPayload,
  validateProductSize,
} from "../utils/productOptions.js";

test("product detail images accept a general group when no colors are configured", () => {
  assert.deepEqual(
    parseProductDetailImagesPayload(
      JSON.stringify([
        {
          color: "Product",
          images: ["https://example.com/front.jpg", "https://example.com/nutrition.jpg"],
        },
      ]),
      []
    ),
    [
      {
        color: "Product",
        images: ["https://example.com/front.jpg", "https://example.com/nutrition.jpg"],
      },
    ]
  );
});

test("product detail images accept diapering care details without color variants", () => {
  assert.deepEqual(
    parseProductDetailImagesPayload(
      JSON.stringify([
        {
          color: "Product",
          images: [
            "https://example.com/diaper-front.jpg",
            "https://example.com/diaper-size-guide.jpg",
          ],
        },
      ]),
      []
    ),
    [
      {
        color: "Product",
        images: [
          "https://example.com/diaper-front.jpg",
          "https://example.com/diaper-size-guide.jpg",
        ],
      },
    ]
  );
});

test("product detail images keep more than five images", () => {
  const images = Array.from(
    { length: 8 },
    (_, index) => `https://example.com/product-detail-${index + 1}.jpg`
  );

  assert.deepEqual(
    parseProductDetailImagesPayload(
      JSON.stringify([
        {
          color: "Product",
          images,
        },
      ]),
      []
    ),
    [
      {
        color: "Product",
        images,
      },
    ]
  );
});

test("product detail images still reject unknown colors for color products", () => {
  assert.deepEqual(
    parseProductDetailImagesPayload(
      JSON.stringify([
        { color: "Red", images: ["https://example.com/red.jpg"] },
        { color: "Product", images: ["https://example.com/general.jpg"] },
      ]),
      ["Red"]
    ),
    [
      {
        color: "Red",
        images: ["https://example.com/red.jpg"],
      },
    ]
  );
});

test("diapering care products do not require size unless variants are configured", () => {
  assert.equal(
    validateProductSize({ category: "Diapering & Care", sizeStocks: [] }, ""),
    ""
  );

  const product = {
    category: "Diapering & Care",
    sizeStocks: [
      { size: "NB", stock: 4 },
      { size: "M", stock: 6 },
    ],
  };

  assert.deepEqual(getProductSizes(product), ["NB", "M"]);
  assert.equal(validateProductSize(product, ""), "Please choose a size for this item.");
  assert.equal(validateProductSize(product, "M"), "");
});

test("color-only inventory rows do not become shopper size choices", () => {
  assert.deepEqual(
    getProductSizes({
      category: "Furniture",
      sizeStocks: [{ size: "ONE SIZE", color: "White", stock: 2 }],
    }),
    []
  );
});
