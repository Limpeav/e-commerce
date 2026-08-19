import "../config/env.js";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import PurchaseOrder from "../models/PurchaseOrder.js";

const normalizeSku = (value = "") =>
  String(value || "").trim().toUpperCase();

const getGeneratedProductSku = (product = {}) =>
  product?._id ? `PRD-${product._id.toString().slice(-8).toUpperCase()}` : "";

const getProductSku = (product = {}) =>
  normalizeSku(product.sku) || getGeneratedProductSku(product);

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const productsMissingSku = await Product.find({
    $or: [{ sku: { $exists: false } }, { sku: null }, { sku: "" }],
  });

  let productsUpdated = 0;

  for (const product of productsMissingSku) {
    product.sku = getGeneratedProductSku(product);
    await product.save();
    productsUpdated += 1;
  }

  const allProducts = await Product.find({}).select("sku supplierSku").lean();
  const skuByProductId = new Map(
    allProducts.map((product) => [product._id.toString(), getProductSku(product)])
  );

  const purchaseOrders = await PurchaseOrder.find({
    $or: [
      { "items.sku": { $exists: false } },
      { "items.sku": null },
      { "items.sku": "" },
      { "receivingLogs.itemsReceived.sku": { $exists: false } },
      { "receivingLogs.itemsReceived.sku": null },
      { "receivingLogs.itemsReceived.sku": "" },
    ],
  });

  let purchaseOrdersUpdated = 0;
  let poItemsUpdated = 0;

  for (const po of purchaseOrders) {
    let hasPoChanges = false;

    po.items.forEach((item) => {
      if (normalizeSku(item.sku)) return;

      const productId = item.product?.toString();
      const sku = productId ? skuByProductId.get(productId) : "";
      if (!sku) return;

      item.sku = sku;
      hasPoChanges = true;
      poItemsUpdated += 1;
    });

    po.receivingLogs?.forEach((log) => {
      log.itemsReceived?.forEach((item) => {
        if (normalizeSku(item.sku)) return;

        const poItem = po.items.find(
          (candidate) =>
            candidate._id?.toString() === item.itemId?.toString() ||
            candidate.product?.toString() === item.product?.toString()
        );
        const sku = normalizeSku(poItem?.sku);

        if (!sku) return;

        item.sku = sku;
        hasPoChanges = true;
      });
    });

    if (hasPoChanges) {
      await po.save();
      purchaseOrdersUpdated += 1;
    }
  }

  console.log(`Backfilled ${productsUpdated} product SKU${productsUpdated === 1 ? "" : "s"}.`);
  console.log(
    `Updated ${poItemsUpdated} PO item SKU${poItemsUpdated === 1 ? "" : "s"} across ${purchaseOrdersUpdated} purchase order${purchaseOrdersUpdated === 1 ? "" : "s"}.`
  );
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
