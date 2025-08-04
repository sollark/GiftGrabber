import { connectToDatabase } from "@/database/connect";

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

/**
 * Type-safe wrapper for server actions that return boolean results
 * @param fn - Server action function returning boolean or undefined
 * @returns Wrapped function with database connection handling
 */
export function withDatabaseBoolean<T extends any[]>(
  fn: (...args: T) => Promise<boolean | undefined>
): (...args: T) => Promise<boolean | undefined> {
  return withDatabase(fn);
}

/**
 * Type-safe wrapper for server actions that return nullable results
 * @param fn - Server action function returning T or null
 * @returns Wrapped function with database connection handling
 */
export function withDatabaseNullable<T extends any[], R>(
  fn: (...args: T) => Promise<R | null>
): (...args: T) => Promise<R | null> {
  return withDatabase(fn);
}

/**
 * Type-safe wrapper for server actions that return array results
 * @param fn - Server action function returning array
 * @returns Wrapped function with database connection handling
 */
export function withDatabaseArray<T extends any[], R>(
  fn: (...args: T) => Promise<R[]>
): (...args: T) => Promise<R[]> {
  return withDatabase(fn);
}
