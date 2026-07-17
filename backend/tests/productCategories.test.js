import test from "node:test";
import assert from "node:assert/strict";
import {
  PRODUCT_CATEGORY_OPTIONS,
  getProductCategoryLookupValues,
  isAllowedProductCategory,
  isRemovedProductCategory,
  normalizeProductCategory,
} from "../utils/productCategories.js";

test("toy is an allowed product category", () => {
  assert.ok(PRODUCT_CATEGORY_OPTIONS.includes("Toy & Play"));
  assert.equal(isAllowedProductCategory("Toy & Play"), true);
  assert.equal(isAllowedProductCategory("Toy"), true);
  assert.equal(isRemovedProductCategory("Toy & Play"), false);
});

test("toy aliases normalize to the toy category", () => {
  assert.equal(normalizeProductCategory("Toy"), "Toy & Play");
  assert.equal(normalizeProductCategory("Toys"), "Toy & Play");
  assert.equal(normalizeProductCategory("Play & Learn"), "Toy & Play");
  assert.deepEqual(getProductCategoryLookupValues("Toy & Play"), [
    "Toy & Play",
    "Toy",
    "Toys",
    "Play & Learn",
    "Play",
    "Learn",
  ]);
});
