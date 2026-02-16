import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/userModel.js";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce";

const adminConfig = {
  name: process.env.ADMIN_BOOTSTRAP_NAME || "Admin User",
  phone: process.env.ADMIN_BOOTSTRAP_PHONE || undefined,
  email: process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@example.com",
  password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
};

if (!adminConfig.password) {
  console.error(
    "Missing ADMIN_BOOTSTRAP_PASSWORD. Set it in environment before running createAdmin.js"
  );
  process.exit(1);
}

async function createAdmin() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const existingAdmin = await User.findOne({ email: adminConfig.email });
    if (existingAdmin) {
      console.log(`Admin already exists for ${adminConfig.email}`);
      process.exit(0);
    }

    const adminUser = new User({
      name: adminConfig.name,
      phone: adminConfig.phone,
      email: adminConfig.email,
      password: adminConfig.password,
      role: "admin",
    });

    await adminUser.save();

    console.log("Admin created successfully");
    console.log(`Email: ${adminConfig.email}`);
    console.log("Role: admin");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exit(1);
  }
}

createAdmin();
