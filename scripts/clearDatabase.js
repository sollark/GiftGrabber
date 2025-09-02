#!/usr/bin/env node

/**
 * clearDatabase.js - Standalone Database Clearing Utility
 *
 * Purpose: Safely clear all data from MongoDB database
 *
 * Usage:
 *   npm run clear-db        # Clears database after confirmation
 *   npm run clear-db --force # Clears database without confirmation (DANGEROUS!)
 *
 * Safety Features:
 * - Requires user confirmation before proceeding
 * - Shows environment and database info before clearing
 * - Provides detailed logging of what was cleared
 * - Can be bypassed with --force flag for CI/CD scenarios
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const readline = require("readline");

// Load .env file manually to avoid extra dependencies
const loadEnvFile = () => {
  try {
    const envPath = path.join(__dirname, "..", ".env");
    const envFile = fs.readFileSync(envPath, "utf8");

    envFile.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        if (!key.startsWith("#") && value) {
          process.env[key.trim()] = value;
        }
      }
    });
  } catch (error) {
    console.log(
      "⚠️  Could not load .env file, using system environment variables"
    );
  }
};

loadEnvFile();
const mongoUrl = process.env.MONGO_URL;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askConfirmation = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim());
    });
  });
};

// Define schemas directly to avoid TypeScript import issues
const personSchema = new mongoose.Schema(
  {},
  { collection: "people", strict: false }
);
const giftSchema = new mongoose.Schema(
  {},
  { collection: "gifts", strict: false }
);
const eventSchema = new mongoose.Schema(
  {},
  { collection: "events", strict: false }
);
const orderSchema = new mongoose.Schema(
  {},
  { collection: "orders", strict: false }
);

const clearDatabase = async () => {
  try {
    if (!mongoUrl) {
      console.error("❌ MONGO_URL not found in environment variables");
      process.exit(1);
    }

    console.log("🔗 Connecting to MongoDB...");
    console.log(
      `📍 Database: ${mongoUrl.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")}`
    );
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "not set"}`);

    await mongoose.connect(mongoUrl);
    console.log("✅ Connected to MongoDB");

    // Create models for this script
    const PersonModel = mongoose.model("Person", personSchema);
    const GiftModel = mongoose.model("Gift", giftSchema);
    const EventModel = mongoose.model("Event", eventSchema);
    const OrderModel = mongoose.model("Order", orderSchema);

    // Check if --force flag is provided
    const forceMode = process.argv.includes("--force");

    if (!forceMode) {
      console.log(
        "\n🚨 WARNING: This will PERMANENTLY DELETE ALL DATA from the database! 🚨"
      );
      console.log("📊 Collections that will be cleared:");
      console.log("   • Person (applicants)");
      console.log("   • Gift (all gift records)");
      console.log("   • Event (all events)");
      console.log("   • Order (all orders)");
      console.log("");

      const confirmation = await askConfirmation(
        'Type "DELETE" to confirm (or anything else to cancel): '
      );

      if (confirmation !== "delete") {
        console.log("❌ Operation cancelled");
        rl.close();
        await mongoose.disconnect();
        process.exit(0);
      }
    }

    console.log("\n🗑️  Starting database clearing...");

    // Get counts before clearing
    const counts = {
      persons: await PersonModel.countDocuments(),
      gifts: await GiftModel.countDocuments(),
      events: await EventModel.countDocuments(),
      orders: await OrderModel.countDocuments(),
    };

    console.log(`📊 Current document counts:`);
    console.log(`   • Persons: ${counts.persons}`);
    console.log(`   • Gifts: ${counts.gifts}`);
    console.log(`   • Events: ${counts.events}`);
    console.log(`   • Orders: ${counts.orders}`);
    console.log("");

    // Clear all collections
    const results = await Promise.all([
      PersonModel.deleteMany({}),
      GiftModel.deleteMany({}),
      EventModel.deleteMany({}),
      OrderModel.deleteMany({}),
    ]);

    console.log("✅ Database cleared successfully!");
    console.log(`🗑️  Deleted:`);
    console.log(`   • Persons: ${results[0].deletedCount}`);
    console.log(`   • Gifts: ${results[1].deletedCount}`);
    console.log(`   • Events: ${results[2].deletedCount}`);
    console.log(`   • Orders: ${results[3].deletedCount}`);
    console.log(
      `📊 Total documents deleted: ${results.reduce(
        (sum, r) => sum + r.deletedCount,
        0
      )}`
    );
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
clearDatabase();
