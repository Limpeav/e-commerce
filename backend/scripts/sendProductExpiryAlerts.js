import mongoose from "mongoose";
import "../config/env.js";
import connectDB from "../config/db.js";
import { processProductExpiryAlerts } from "../services/productExpiryAlertService.js";

const run = async () => {
  try {
    await connectDB();

    const summary = await processProductExpiryAlerts();
    console.log("Product expiry alert summary:", summary);
  } catch (error) {
    console.error("Product expiry alert job failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
