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
 * Enhanced higher-order function that ensures database connection and returns Result
 * @param fn - The server action function to wrap with database connection
 * @returns Wrapped function that returns Result<T, Error>
 */
export function withDatabaseResult<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<Result<R, Error>> {
  return async (...args: T): Promise<Result<R, Error>> => {
    try {
      await connectToDatabase();
      const result = await fn(...args);
      return success(result);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

/**
 * Database operation with automatic connection and Result handling
 * @param operation - Database operation to execute
 * @returns Result<T, Error>
 */
export const executeWithDatabase = <T>(
  operation: () => Promise<T>
): Promise<Result<T, Error>> => {
  return withDatabaseResult(operation)();
};

/**
 * Composable database transaction wrapper
 * @param operations - Array of database operations to execute in sequence
 * @returns Result<T[], Error> where T[] contains results of all operations
 */
export const executeTransaction = async <T>(
  operations: (() => Promise<T>)[]
): Promise<Result<T[], Error>> => {
  const results: T[] = [];

  try {
    await connectToDatabase();

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
// BACKWARD COMPATIBILITY WRAPPERS
// ============================================================================

/**
 * Higher-order function that ensures database connection before executing server actions
 * @param fn - The server action function to wrap with database connection
 * @returns Wrapped function that automatically handles database connection
 */
export function withDatabase<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    await connectToDatabase();
    return fn(...args);
  };
}

// ============================================================================
// FUNCTIONAL DATABASE UTILITIES
// ============================================================================

/**
 * Safely executes a database query with Result handling
 * @param queryFn - Function that returns a database query promise
 * @returns Result<T, Error>
 */
export const safeQuery = <T>(
  queryFn: () => Promise<T>
): Promise<Result<T, Error>> => {
  return tryAsync(async () => {
    await connectToDatabase();
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

export default {
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
