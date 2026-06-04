import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { normalizeProductCategory } from "../utils/productCategories.js";

dotenv.config();

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const products = await Product.find({
    category: { $in: ["Nursery & Decor", "Nursery", "Decor", "Decore"] },
  });

  let updatedCount = 0;

  for (const product of products) {
    const normalizedCategory = normalizeProductCategory(product.category);
    if (product.category === normalizedCategory) continue;

    product.category = normalizedCategory;
    await product.save();
    updatedCount += 1;
  }

  console.log(`Normalized ${updatedCount} product categor${updatedCount === 1 ? "y" : "ies"}.`);
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
