/**
 * Database Performance Monitoring Middleware
 *
 * Adds query timing and performance monitoring to all Mongoose models.
 * Helps identify slow queries and monitor database performance.
 */

import mongoose from "mongoose";

// Query performance monitoring
const SLOW_QUERY_THRESHOLD = 100; // milliseconds

/**
 * Middleware to track query performance
 */
const queryPerformancePlugin = function (schema: mongoose.Schema) {
  const ops = ["find", "findOne", "findOneAndUpdate", "aggregate"];
  for (const op of ops) {
    schema.pre(op as any, function () {
      (this as any).startTime = Date.now();
    });
    schema.post(op as any, function () {
      const duration = Date.now() - (this as any).startTime;
      if (duration > SLOW_QUERY_THRESHOLD) {
        console.warn(`🐌 Slow Query Detected:`, {
          operation: (this as any).op || (this as any).getQuery(),
          duration: `${duration}ms`,
          threshold: `${SLOW_QUERY_THRESHOLD}ms`,
          model: (this as any).model?.modelName,
          query: (this as any).getQuery(),
        });
      }
      if (process.env.NODE_ENV === "development") {
        console.info(`📊 Query Performance:`, {
          model: (this as any).model?.modelName,
          operation: (this as any).op || "query",
          duration: `${duration}ms`,
          query: (this as any).getQuery(),
        });
      }
    });
  }
};

/**
 * Apply performance monitoring to all schemas
 */
export const enableQueryPerformanceMonitoring = () => {
  mongoose.plugin(queryPerformancePlugin);
  console.info("✅ Query performance monitoring enabled");
};

/**
 * Database performance metrics
 */
export class DatabaseMetrics {
  private static queryCount = 0;
  private static slowQueryCount = 0;
  private static totalQueryTime = 0;

  static incrementQuery(duration: number) {
    this.queryCount++;
    this.totalQueryTime += duration;

    if (duration > SLOW_QUERY_THRESHOLD) {
      this.slowQueryCount++;
    }
  }

  static getMetrics() {
    return {
      totalQueries: this.queryCount,
      slowQueries: this.slowQueryCount,
      averageQueryTime:
        this.queryCount > 0 ? this.totalQueryTime / this.queryCount : 0,
      slowQueryPercentage:
        this.queryCount > 0 ? (this.slowQueryCount / this.queryCount) * 100 : 0,
    };
  }

  static reset() {
    this.queryCount = 0;
    this.slowQueryCount = 0;
    this.totalQueryTime = 0;
  }
}
