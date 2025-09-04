/**
 * connect.ts
 *
 * Purpose: MongoDB connection management with performance monitoring and optimization
 *
 * Main Responsibilities:
 * - Establishes and manages MongoDB connection with optimized pool settings
 * - Initializes all Mongoose models and performance monitoring systems
 * - Provides connection state checking utilities for application health
 * - Handles environment configuration and error recovery for database connections
 * - Enables query performance monitoring for production debugging
 *
 * Architecture Role:
 * - Central database connection module imported by API routes and server startup
 * - Configures connection pooling and timeout settings for production scalability
 * - Integrates with performance monitoring system for query optimization
 * - Ensures all models are properly initialized before application startup
 * - Provides singleton pattern for database connection management
 */

import mongoose from "mongoose";
import EventModel from "./models/event.model";
import GiftModel from "./models/gift.model";
import OrderModel from "./models/order.model";
import PersonModel from "./models/person.model";
import { enableQueryPerformanceMonitoring } from "./performance";

const mongoUrl = process.env.MONGO_URL;

/**
 * Establishes MongoDB connection with optimized settings and performance monitoring
 *
 * @returns Promise<void> - Resolves when connection is established and models initialized
 *
 * @sideEffects
 * - Connects to MongoDB database
 * - Initializes all Mongoose models
 * - Enables query performance monitoring
 * - Modifies mongoose global connection state
 *
 * @performance
 * - Uses connection pooling with maxPoolSize: 10 for concurrent request handling
 * - Configures timeouts for server selection (5s) and socket operations (45s)
 * - Enables performance monitoring for query optimization
 *
 * @notes
 * - Implements singleton pattern - subsequent calls return early if already connected
 * - Requires MONGO_URL environment variable to be configured
 * - Logs connection status for debugging and monitoring
 *
 * @publicAPI Used by API routes and server initialization code
 */
export const connectToDatabase = async () => {
  if (!mongoUrl) {
    throw new Error("MongoDB URL not found in .env file");
  }

  if (mongoose.connection.readyState) {
    console.info("Already connected to MongoDB");
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

    console.info("Connected to MongoDB with performance monitoring enabled");
  } catch (error) {
    console.error(error);
  }

  return;
};

/**
 * Checks current MongoDB connection status
 *
 * @returns Boolean indicating if database connection is active (readyState === 1)
 *
 * @sideEffects None - pure function reading mongoose connection state
 * @performance O(1) - simple property access on mongoose.connection
 * @notes Useful for health checks and conditional database operations
 * @publicAPI Used by API routes and middleware for connection validation
 */
export const isConnected = () => {
  return mongoose.connection.readyState === 1;
};
