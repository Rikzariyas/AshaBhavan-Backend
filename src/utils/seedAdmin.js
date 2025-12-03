/* eslint-disable no-console */
import User from "../models/User.js";
import connectDB from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    // Get admin credentials from environment variables
    const adminUsername =
      process.env.ADMIN_USERNAME ||
      process.env.DEFAULT_ADMIN_USERNAME ||
      "admin";
    const adminPassword =
      process.env.ADMIN_PASSWORD || process.env.DEFAULT_ADMIN_PASSWORD;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: adminUsername });

    if (existingAdmin) {
      console.log(`ℹ️  Admin user "${adminUsername}" already exists`);
      process.exit(0);
    }

    // Validate password is provided
    if (!adminPassword) {
      console.error(
        "❌ Error: ADMIN_PASSWORD or DEFAULT_ADMIN_PASSWORD must be set in .env"
      );
      console.error(
        "   Please set ADMIN_PASSWORD in your .env file before seeding admin user."
      );
      process.exit(1);
    }

    // Warn if using default username
    if (adminUsername === "admin" && !process.env.ADMIN_USERNAME) {
      console.warn(
        "⚠️  Warning: Using default username 'admin'. Consider setting ADMIN_USERNAME in .env"
      );
    }

    // Warn if using default password (if DEFAULT_ADMIN_PASSWORD is set)
    if (process.env.DEFAULT_ADMIN_PASSWORD) {
      console.warn(
        "⚠️  Warning: Using DEFAULT_ADMIN_PASSWORD. For production, use ADMIN_PASSWORD instead."
      );
    }

    // Create admin user
    await User.create({
      username: adminUsername,
      password: adminPassword,
      role: "admin",
    });

    console.log("✅ Admin user created successfully");
    console.log(`   Username: ${adminUsername}`);
    console.log("   Password: [HIDDEN - Check your .env file]");
    console.log(
      "⚠️  IMPORTANT: Change the default password after first login in production!"
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
    if (error.code === 11000) {
      console.error("   Duplicate username. Admin user may already exist.");
    }
    process.exit(1);
  }
};

seedAdmin();
