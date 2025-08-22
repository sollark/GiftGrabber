import mongoose from "mongoose";
import EventModel from "./models/event.model";
import GiftModel from "./models/gift.model";
import OrderModel from "./models/order.model";
import PersonModel from "./models/person.model";
import { enableQueryPerformanceMonitoring } from "./performance";

const mongoUrl = process.env.MONGO_URL;

export const connectToDatabase = async () => {
  if (!mongoUrl) {
    throw new Error("MongoDB URL not found in .env file");
  }

  if (mongoose.connection.readyState) {
    console.log("Already connected to MongoDB");
    return;
  }

  mongoose.set("strictQuery", true);

  try {
    // Enable query performance monitoring - Issue D Fix
    enableQueryPerformanceMonitoring();

    await mongoose.connect(mongoUrl, {
      // Connection pool optimization - Issue D Fix
      maxPoolSize: 10, // Maximum number of connections
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long to wait for a response
      // Removed deprecated options
    });

    // Initialize models
    PersonModel.init();
    GiftModel.init();
    EventModel.init();
    OrderModel.init();

    console.log("Connected to MongoDB with performance monitoring enabled");
  } catch (error) {
    console.log(error);
  }

  return;
};

export const isConnected = () => {
  return mongoose.connection.readyState === 1;
};
