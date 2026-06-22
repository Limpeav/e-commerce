import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/userModel.js";
import { validatePortalPassword } from "./utils/authSecurity.js";

dotenv.config();

const ADMIN_EMAIL = "thesisplus2026@gmail.com";

const createAdmin = async () => {
  try {
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    const passwordCheck = validatePortalPassword(password);

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is required");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const targetUser = await User.findOne({ email: ADMIN_EMAIL }).select("+tokenVersion");
    const legacyAdmin = await User.findOne({
      email: "admin@gmail.com",
      role: "admin",
    }).select("+tokenVersion");
    const existingUser = targetUser || legacyAdmin;

    if (existingUser) {
      const hasSecurePassword = existingUser.password?.startsWith("$2");
      if (!passwordCheck.valid && !hasSecurePassword) {
        throw new Error(
          `The existing administrator has an unsafe password. Set ADMIN_BOOTSTRAP_PASSWORD. ${passwordCheck.message}`
        );
      }

      existingUser.name = existingUser.name || "Administrator";
      existingUser.email = ADMIN_EMAIL;
      if (passwordCheck.valid) {
        existingUser.password = password;
      }
      existingUser.role = "admin";
      existingUser.isVerified = true;
      existingUser.tokenVersion = (existingUser.tokenVersion || 0) + 1;
      await existingUser.save();

      if (legacyAdmin && legacyAdmin._id.toString() !== existingUser._id.toString()) {
        legacyAdmin.role = "user";
        legacyAdmin.isAdmin = false;
        legacyAdmin.tokenVersion = (legacyAdmin.tokenVersion || 0) + 1;
        await legacyAdmin.save();
      }

      console.log(`Administrator updated: ${ADMIN_EMAIL}`);
      return;
    }

    if (!passwordCheck.valid) {
      throw new Error(
        `Set ADMIN_BOOTSTRAP_PASSWORD in the environment. ${passwordCheck.message}`
      );
    }

    await User.create({
      name: "Administrator",
      email: ADMIN_EMAIL,
      password,
      role: "admin",
      isAdmin: true,
      isVerified: true,
    });

    console.log(`Administrator created: ${ADMIN_EMAIL}`);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin().catch((error) => {
  console.error(`Unable to bootstrap administrator: ${error.message}`);
  process.exitCode = 1;
});
