import mongoose from "mongoose";
import Product from "../models/Product.js";
import dotenv from "dotenv";

dotenv.config();

const CATEGORIES = ["Milk", "Bath & Skin"];

const randomFutureDate = () => {
  const now = new Date();
  const monthsAhead = Math.floor(Math.random() * 18) + 6;
  const future = new Date(now);
  future.setMonth(future.getMonth() + monthsAhead);
  return future;
};

const backfill = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const products = await Product.find({
      category: { $in: CATEGORIES },
      expiryDate: null,
    });

    console.log(`Found ${products.length} products without expiry date`);

    let updated = 0;
    for (const product of products) {
      product.expiryDate = randomFutureDate();
      await product.save();
      updated++;
      console.log(`[${updated}/${products.length}] ${product.title} -> ${product.expiryDate}`);
    }

    console.log(`Done. Updated ${updated} products.`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
};

backfill();
