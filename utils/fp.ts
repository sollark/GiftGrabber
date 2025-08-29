/**
 * fp.ts
 *
 * Purpose: Core functional programming utilities providing type-safe error handling and data flow
 *
 * Main Responsibilities:
 * - Implements Result<T, E> monad for explicit error handling without exceptions
 * - Provides Maybe<T> type for safe null/undefined handling
 * - Offers function composition utilities for complex data transformations
 * - Enables async operation chaining with automatic error propagation
 * - Supports functional programming patterns across the application
 *
 * Architecture Role:
 * - Foundation layer for all service operations and context state management
 * - Eliminates runtime errors through compile-time type safety
 * - Enables predictable error paths in async operations (database, API calls)
 * - Used by database services, context providers, and validation systems
 * - Promotes immutable data patterns and pure function composition
 */

/**
 * Example usage of fromPromise in a React hook:
 *
 *   const result = await fromPromise(fetchDataAsync());
 *   if (isSuccess(result)) { ... } else { ... }
 */
/**
 * Converts a Promise to a Result type for safe async operations
 *
 * @param promise - Promise<T> to convert to Result-based async operation
 * @returns Promise<Result<T, E>> that never throws, errors are captured in Failure
 *
 * @sideEffects None - wraps promise execution without side effects
 * @performance Minimal overhead - single try/catch wrapper around promise execution
 * @notes Essential for database operations and API calls to avoid unhandled rejections
 * @publicAPI Core utility used throughout service layer and async hooks
 */
export async function fromPromise<T, E = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> {
  try {
    const value = await promise;
    return success(value);
  } catch (error) {
    return failure(error as E);
  }
}
/**
 * Functional Programming Utilities
 * Core functional programming primitives and patterns for the GiftGrabber application
 */

// ============================================================================
// RESULT TYPE SYSTEM - Better error handling
// ============================================================================

export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly _tag: "Success";
  readonly value: T;
}

export interface Failure<E> {
  readonly _tag: "Failure";
  readonly error: E;
}

/**
 * Creates a Success result containing a successful value
 *
 * @param value - The successful value of type T to wrap
 * @returns Success<T> result with the provided value
 *
 * @sideEffects None - pure function creating immutable data structure
 * @performance O(1) - simple object creation
 * @notes Part of Result monad constructor functions
 * @publicAPI Used throughout application for successful operation results
 */
export const success = <T>(value: T): Success<T> => ({
  _tag: "Success",
  value,
});

/**
 * Creates a Failure result containing an error value
 *
 * @param error - The error value of type E to wrap
 * @returns Failure<E> result with the provided error
 *
 * @sideEffects None - pure function creating immutable data structure
 * @performance O(1) - simple object creation
 * @notes Part of Result monad constructor functions for error cases
 * @publicAPI Used throughout application for failed operation results
 */
export const failure = <E>(error: E): Failure<E> => ({
  _tag: "Failure",
  error,
});

/**
 * Creates a failure result with never success type for type inference
 *
 * @param error - The error value of type E to wrap
 * @returns Result<never, E> that can only represent failure
 *
 * @sideEffects None - pure function creating immutable data structure
 * @performance O(1) - simple object creation
 * @notes Useful for early returns in error scenarios with proper type inference
 * @publicAPI Helper function for error handling in complex operations
 */
export const createFailure = <E = Error>(error: E): Result<never, E> =>
  failure(error);

/**
 * Logs error to console (side effect)
 */
export const logError = <E = Error>(error: E): void => {
  if (typeof window !== "undefined") {
    console.error("Functional Error:", error);
  }
};

/**
 * Type guard for Success results
 */
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> =>
  result._tag === "Success";

/**
 * Type guard for Failure results
 */
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> =>
  result._tag === "Failure";

/**
 * Maps over a Result's success value
 */
export const map =
  <T, U, E>(fn: (value: T) => U) =>
  (result: Result<T, E>): Result<U, E> =>
    isSuccess(result) ? success(fn(result.value)) : result;

/**
 * Flat maps over a Result's success value
 */
export const flatMap =
  <T, U, E>(fn: (value: T) => Result<U, E>) =>
  (result: Result<T, E>): Result<U, E> =>
    isSuccess(result) ? fn(result.value) : result;

/**
 * Maps over a Result's error value
 */
export const mapError =
  <T, E, F>(fn: (error: E) => F) =>
  (result: Result<T, E>): Result<T, F> =>
    isFailure(result) ? failure(fn(result.error)) : result;

/**
 * Extracts value from Result, providing a default for failures
 */
export const getOrElse =
  <T, E>(defaultValue: T) =>
  (result: Result<T, E>): T =>
    isSuccess(result) ? result.value : defaultValue;

/**
 * Extracts value from Result, throwing error for failures
 */
export const getOrThrow = <T, E extends Error>(result: Result<T, E>): T => {
  if (isSuccess(result)) return result.value;
  throw result.error;
};

// ============================================================================
// MAYBE TYPE SYSTEM - Handle null/undefined safely
// ============================================================================

export type Maybe<T> = Some<T> | None;

export interface Some<T> {
  readonly _tag: "Some";
  readonly value: T;
}

export interface None {
  readonly _tag: "None";
}

export const isMaybe = <T = any>(value: any): value is Maybe<T> => {
  return value && (value._tag === "Some" || value._tag === "None");
};

export const some = <T>(value: T): Some<T> => ({
  _tag: "Some",
  value,
});

/**
 * Represents a value that is absent (None) in the Maybe type system.
 * Used for safe null/undefined handling in functional flows.
 * @publicAPI
 */
export const none: None = { _tag: "None" };

export const fromNullable = <T>(value: T | null | undefined): Maybe<T> =>
  value != null ? some(value) : none;

/**
 * Returns true if the given Maybe is a Some (contains a value).
 * @param maybe - The Maybe to check
 * @returns boolean
 */
export const isSome = <T>(maybe: Maybe<T>): maybe is Some<T> =>
  maybe._tag === "Some";

/**
 * Returns true if the given Maybe is a None (contains no value).
 * @param maybe - The Maybe to check
 * @returns boolean
 */
export const isNone = <T>(maybe: Maybe<T>): maybe is None =>
  maybe._tag === "None";

export const mapMaybe =
  <T, U>(fn: (value: T) => U) =>
  (maybe: Maybe<T>): Maybe<U> =>
    isSome(maybe) ? some(fn(maybe.value)) : none;

export const flatMapMaybe =
  <T, U>(fn: (value: T) => Maybe<U>) =>
  (maybe: Maybe<T>): Maybe<U> =>
    isSome(maybe) ? fn(maybe.value) : none;

/**
 * Returns the value inside a Maybe, or a default if None.
 * @param defaultValue - The value to return if Maybe is None
 * @returns function that takes a Maybe and returns the value or default
 */
export const getMaybeOrElse =
  <T>(defaultValue: T) =>
  (maybe: Maybe<T>): T =>
    isSome(maybe) ? maybe.value : defaultValue;

// ============================================================================
// FUNCTION UTILITIES
// ============================================================================

export const identity = <T>(value: T): T => value;

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

export const arrayUtils = {
  mapResult:
    <T, U, E>(fn: (item: T) => Result<U, E>) =>
    (array: T[]): Result<U[], E> => {
      const results: U[] = [];
      for (const item of array) {
        const result = fn(item);
        if (isFailure(result)) return result;
        results.push(result.value);
      }
      return success(results);
    },
  filter:
    <T>(predicate: (item: T) => boolean) =>
    (array: T[]): T[] =>
      array.filter(predicate),
  find:
    <T>(predicate: (item: T) => boolean) =>
    (array: T[]): Maybe<T> =>
      fromNullable(array.find(predicate)),
  reduce:
    <T, U>(fn: (acc: U, item: T) => U, initialValue: U) =>
    (array: T[]): U =>
      array.reduce(fn, initialValue),
  groupBy:
    <T, K extends string | number>(keyFn: (item: T) => K) =>
    (array: T[]): Record<K, T[]> =>
      array.reduce((groups, item) => {
        const key = keyFn(item);
        (groups[key] = groups[key] || []).push(item);
        return groups;
      }, {} as Record<K, T[]>),
  at:
    <T>(index: number) =>
    (array: T[]): Maybe<T> =>
      fromNullable(array[index]),
  isEmpty: <T>(array: T[]): boolean => array.length === 0,
  head: <T>(array: T[]): Maybe<T> => fromNullable(array[0]),
  last: <T>(array: T[]): Maybe<T> => fromNullable(array[array.length - 1]),
};

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

export const tryAsync =
  <T extends any[], U>(fn: (...args: T) => Promise<U>) =>
  async (...args: T): Promise<Result<U, Error>> => {
    try {
      const result = await fn(...args);
      return success(result);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  };

export const trySync =
  <T extends any[], U>(fn: (...args: T) => U) =>
  (...args: T): Result<U, Error> => {
    try {
      const result = fn(...args);
      return success(result);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  };

export const mapAsyncSequential =
  <T, U>(fn: (item: T) => Promise<Result<U, Error>>) =>
  async (array: T[]): Promise<Result<U[], Error>> => {
    const results: U[] = [];
    for (const item of array) {
      const result = await fn(item);
      if (isFailure(result)) return result;
      results.push(result.value);
    }
    return success(results);
  };

export const mapAsyncParallel =
  <T, U>(fn: (item: T) => Promise<Result<U, Error>>) =>
  async (array: T[]): Promise<Result<U[], Error>> => {
    const results = await Promise.all(array.map(fn));
    const successResults: U[] = [];
    for (const result of results) {
      if (isFailure(result)) return result;
      successResults.push(result.value);
    }
    return success(successResults);
  };

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

export const objectUtils = {
  mapValues:
    <T, U>(fn: (value: T) => U) =>
    <K extends string>(obj: Record<K, T>): Record<K, U> => {
      const result = {} as Record<K, U>;
      for (const [key, value] of Object.entries(obj) as [K, T][]) {
        result[key] = fn(value);
      }
      return result;
    },
  filter:
    <T>(predicate: (value: T, key: string) => boolean) =>
    <K extends string>(obj: Record<K, T>): Partial<Record<K, T>> => {
      const result = {} as Partial<Record<K, T>>;
      for (const [key, value] of Object.entries(obj) as [K, T][]) {
        if (predicate(value, key)) {
          result[key] = value;
        }
      }
      return result;
    },
  get:
    <K extends string, T>(key: K) =>
    (obj: Record<K, T>): Maybe<T> =>
      fromNullable(obj[key]),
  set:
    <K extends string, T>(key: K, value: T) =>
    (obj: Record<K, T>): Record<K, T> => ({
      ...obj,
      [key]: value,
    }),
  omit:
    <T, K extends keyof T>(keys: K[]) =>
    (obj: T): Omit<T, K> => {
      const result = { ...obj };
      keys.forEach((key) => delete result[key]);
      return result;
    },
  pick:
    <T extends object, K extends keyof T>(keys: K[]) =>
    (obj: T): Pick<T, K> => {
      const result = {} as Pick<T, K>;
      keys.forEach((key) => {
        if (key in obj) {
          result[key] = obj[key];
        }
      });
      return result;
    },
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export type Validator<T> = (value: unknown) => Result<T, string>;

export const validators = {
  string: (value: unknown): Result<string, string> =>
    typeof value === "string" ? success(value) : failure("Expected string"),
  number: (value: unknown): Result<number, string> =>
    typeof value === "number" ? success(value) : failure("Expected number"),
  required: <T>(value: T | null | undefined): Result<T, string> =>
    value != null ? success(value) : failure("Value is required"),
  minLength:
    (min: number) =>
    (value: string): Result<string, string> =>
      value.length >= min
        ? success(value)
        : failure(`Minimum length is ${min}`),
  email: (value: string): Result<string, string> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value)
      ? success(value)
      : failure("Invalid email format");
  },
  all:
    <T>(...validators: Validator<T>[]) =>
    (value: unknown): Result<T, string> => {
      for (const validator of validators) {
        const result = validator(value);
        if (isFailure(result)) return result;
      }
      return success(value as T);
    },
};

// ============================================================================
// MEMOIZATION UTILITIES
// ============================================================================

export const memoize = <Args extends any[], Return>(
  fn: (...args: Args) => Return,
  options: {
    getKey?: (...args: Args) => string;
    maxSize?: number;
  } = {}
): ((...args: Args) => Return) => {
  const {
    getKey = (...args: Args) =>
      args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join("|"),
    maxSize = 100,
  } = options;

  const cache = new Map<string, Return>();

  return (...args: Args): Return => {
    const key = getKey(...args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    // LRU eviction when cache is full
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

export const debounce = <Args extends any[]>(
  fn: (...args: Args) => void,
  delay: number
) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Args): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = <Args extends any[]>(
  fn: (...args: Args) => void,
  delay: number
) => {
  let lastCall = 0;
  return (...args: Args): void => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};
