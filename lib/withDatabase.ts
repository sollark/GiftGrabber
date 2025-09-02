/**
 * withDatabase.ts
 *
 * Purpose: Enhanced database middleware providing functional error handling and connection management
 *
 * Main Responsibilities:
 * - Wraps database operations with automatic connection establishment
 * - Implements Result<T, E> pattern for type-safe database error handling
 * - Provides transaction management utilities for complex database operations
 * - Offers memoized connection caching for performance optimization
 * - Enables composable database operation patterns with pure functions
 *
 * Architecture Role:
 * - Foundation layer for all database-dependent operations
 * - Eliminates boilerplate connection handling in service layers
 * - Provides consistent error handling across all database interactions
 * - Enables functional composition of complex database workflows
 * - Critical infrastructure for server actions and API routes
 */

import { connectToDatabase } from "@/database/connect";
import { Result, success, failure, tryAsync } from "@/utils/fp";

/**
 * Enhanced database middleware with functional error handling
 * Provides Result-based error handling and composable database operations
 */

// ============================================================================
// RESULT-BASED DATABASE MIDDLEWARE
// ============================================================================

/**
 * Higher-order function ensuring database connection with Result-based error handling
 *
 * @param fn - Server action function to wrap with automatic database connection
 * @returns Function returning Result<R, Error> instead of throwing exceptions
 *
 * @sideEffects
 * - Establishes database connection if not already connected
 * - Modifies global mongoose connection state
 *
 * @performance
 * - Uses memoized connection to avoid redundant connection attempts
 * - Connection pooling optimizes database resource usage
 * - Minimal overhead for already-connected scenarios
 *
 * @businessLogic
 * - Ensures database availability before any database operation
 * - Converts thrown exceptions to Result.Failure for consistent error handling
 * - Enables functional composition of database operations
 *
 * @notes
 * - Critical wrapper for all server actions requiring database access
 * - Eliminates need for manual connection management in business logic
 * - Enables type-safe error handling without try/catch blocks
 *
 * @publicAPI Core utility used by service layers and server actions
 */
export function withDatabaseResult<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<Result<R, Error>> {
  return async (...args: T): Promise<Result<R, Error>> => {
    try {
      await getMemoizedConnection();
      const result = await fn(...args);
      return success(result);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

/**
 * Enhanced batch operation execution with Result pattern
 * Executes multiple database operations concurrently with proper error handling
 * @param operations - Array of async operations to execute in parallel
 * @returns Promise<Result<T[], Error>> with all results or first error encountered
 */
export const executeBatchOperations = async <T>(
  operations: (() => Promise<T>)[]
): Promise<Result<T[], Error>> => {
  if (operations.length === 0) {
    return success([]);
  }

  try {
    await getMemoizedConnection();

    const results = await Promise.all(
      operations.map((operation) => operation())
    );

    return success(results);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * Executes database operation with automatic connection and Result-based error handling
 *
 * @param operation - Database operation function to execute with connection
 * @returns Promise<Result<T, Error>> with operation result or connection/execution error
 *
 * @sideEffects
 * - Establishes database connection if needed
 * - Executes provided database operation
 *
 * @performance
 * - Leverages memoized connection for optimal performance
 * - Single operation execution with minimal middleware overhead
 *
 * @notes
 * - Convenience wrapper for single database operations
 * - Alternative to withDatabaseResult for immediate execution
 * - Ideal for one-off database queries in utility functions
 *
 * @publicAPI Utility function for immediate database operation execution
 */
export const executeWithDatabase = <T>(
  operation: () => Promise<T>
): Promise<Result<T, Error>> => {
  return withDatabaseResult(operation)();
};

/**
 * Composable database transaction wrapper with memoized connection
 * @param operations - Array of database operations to execute in sequence
 * @returns Result<T[], Error> where T[] contains results of all operations
 */
export const executeTransaction = async <T>(
  operations: (() => Promise<T>)[]
): Promise<Result<T[], Error>> => {
  const results: T[] = [];

  try {
    await getMemoizedConnection();

    for (const operation of operations) {
      const result = await operation();
      results.push(result);
    }

    return success(results);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

// ============================================================================
// CONNECTION MEMOIZATION WITH RESILIENCE
// ============================================================================

/**
 * Configuration for database connection resilience
 */
interface ConnectionConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  timeoutMs: number;
  circuitBreakerTimeoutMs: number;
}

const DEFAULT_CONNECTION_CONFIG: ConnectionConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  timeoutMs: 30000,
  circuitBreakerTimeoutMs: 60000, // 1 minute circuit breaker
};

/**
 * Memoized connection promise to avoid redundant database connections.
 * Enhanced with retry logic and circuit breaker pattern.
 */
let connectionPromise: Promise<void> | null = null;
let failureCount = 0;
let lastFailureTime = 0;

/**
 * Attempts database connection with retry logic and exponential backoff.
 * @param config - Connection configuration options
 * @returns Promise<void> - Resolves when connection is established
 * @throws Error when all retries are exhausted or circuit breaker is open
 */
const tryConnectWithRetry = async (config: ConnectionConfig): Promise<void> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Race connection attempt against timeout
      await Promise.race([
        connectToDatabase(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Database connection timeout")),
            config.timeoutMs
          )
        ),
      ]);

      // Reset failure tracking on successful connection
      failureCount = 0;
      lastFailureTime = 0;
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't delay on final attempt
      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.baseDelay * Math.pow(2, attempt),
          config.maxDelay
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};

/**
 * Creates or reuses existing database connection promise with enhanced resilience.
 * Implements circuit breaker pattern to prevent cascading failures.
 * @param config - Optional connection configuration (uses defaults if not provided)
 * @returns Promise<void> - Resolves when connection is established
 * @throws Error when circuit breaker is open or connection fails after retries
 */
const getMemoizedConnection = async (
  config = DEFAULT_CONNECTION_CONFIG
): Promise<void> => {
  const now = Date.now();

  // Circuit breaker - don't retry immediately after multiple failures
  if (
    failureCount >= config.maxRetries &&
    now - lastFailureTime < config.circuitBreakerTimeoutMs
  ) {
    throw new Error(
      `Database connection circuit breaker is open. Last failure: ${new Date(
        lastFailureTime
      ).toISOString()}. Retry after: ${new Date(
        lastFailureTime + config.circuitBreakerTimeoutMs
      ).toISOString()}`
    );
  }

  // Reset circuit breaker if enough time has passed
  if (
    failureCount >= config.maxRetries &&
    now - lastFailureTime >= config.circuitBreakerTimeoutMs
  ) {
    failureCount = 0;
    lastFailureTime = 0;
  }

  if (!connectionPromise) {
    connectionPromise = tryConnectWithRetry(config).catch((error) => {
      connectionPromise = null;
      failureCount++;
      lastFailureTime = now;
      throw error;
    });
  }

  return connectionPromise;
};

// ============================================================================
// BACKWARD COMPATIBILITY WRAPPERS
// ============================================================================

/**
 * Higher-order function that ensures database connection before executing server actions
 * with memoized connection to reduce overhead.
 * @param fn - The server action function to wrap with database connection
 * @returns Wrapped function that automatically handles database connection
 */
export function withDatabase<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    await getMemoizedConnection();
    return fn(...args);
  };
}

// ============================================================================
// FUNCTIONAL DATABASE UTILITIES
// ============================================================================

/**
 * Safely executes a database query with Result handling and memoized connection
 * @param queryFn - Function that returns a database query promise
 * @returns Result<T, Error>
 */
export const safeQuery = <T>(
  queryFn: () => Promise<T>
): Promise<Result<T, Error>> => {
  return tryAsync(async () => {
    await getMemoizedConnection();
    return await queryFn();
  })();
};

/**
 * Executes multiple database queries in parallel
 * @param queries - Array of query functions
 * @returns Result<T[], Error>
 */
export const parallelQueries = async <T>(
  queries: (() => Promise<T>)[]
): Promise<Result<T[], Error>> => {
  try {
    await connectToDatabase();
    const results = await Promise.all(queries.map((query) => query()));
    return success(results);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * Database operation with retry logic
 * @param operation - Database operation to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param delay - Delay between retries in ms (default: 1000)
 * @returns Result<T, Error>
 */
export const withRetry = <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<Result<T, Error>> => {
  const attempt = async (retriesLeft: number): Promise<Result<T, Error>> => {
    try {
      await connectToDatabase();
      const result = await operation();
      return success(result);
    } catch (error) {
      if (retriesLeft <= 0) {
        return failure(
          error instanceof Error ? error : new Error(String(error))
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      return attempt(retriesLeft - 1);
    }
  };

  return attempt(maxRetries);
};

// ============================================================================
// QUERY BUILDERS
// ============================================================================

/**
 * Functional query builder for common database operations
 */
export const queryBuilder = {
  /**
   * Creates a find query with error handling
   */
  find:
    <T>(model: any, filter: any = {}) =>
    (): Promise<T[]> =>
      model.find(filter).exec(),

  /**
   * Creates a findOne query with error handling
   */
  findOne:
    <T>(model: any, filter: any) =>
    (): Promise<T | null> =>
      model.findOne(filter).exec(),

  /**
   * Creates a create query with error handling
   */
  create:
    <T>(model: any, data: any) =>
    (): Promise<T> =>
      model.create(data),

  /**
   * Creates an update query with error handling
   */
  updateOne:
    <T>(model: any, filter: any, update: any) =>
    (): Promise<T | null> =>
      model.findOneAndUpdate(filter, update, { new: true }).exec(),

  /**
   * Creates a delete query with error handling
   */
  deleteOne: (model: any, filter: any) => (): Promise<boolean> =>
    model
      .deleteOne(filter)
      .exec()
      .then((result: any) => result.deletedCount > 0),

  /**
   * Creates a populated query
   */
  populate:
    <T>(query: any, populateOptions: any) =>
    (): Promise<T> =>
      query.populate(populateOptions).exec(),
};

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Adapter for legacy database functions to new Result-based approach
 * @param legacyFn - Legacy function that throws errors
 * @returns Function that returns Result
 */
export const adaptLegacyDbFunction =
  <T extends any[], R>(legacyFn: (...args: T) => Promise<R>) =>
  (...args: T): Promise<Result<R, Error>> =>
    withDatabaseResult(legacyFn)(...args);

/**
 * Converts Result-based function back to legacy throwing function
 * @param resultFn - Function that returns Result
 * @returns Function that throws on error
 */
export const resultToLegacy =
  <T extends any[], R>(resultFn: (...args: T) => Promise<Result<R, Error>>) =>
  async (...args: T): Promise<R> => {
    const result = await resultFn(...args);
    if (result._tag === "Success") {
      return result.value;
    }
    throw result.error;
  };

const DatabaseUtils = {
  withDatabaseResult,
  executeWithDatabase,
  executeTransaction,
  safeQuery,
  parallelQueries,
  withRetry,
  queryBuilder,
  adaptLegacyDbFunction,
  resultToLegacy,

  // Legacy compatibility
  withDatabase,
};

export default DatabaseUtils;
