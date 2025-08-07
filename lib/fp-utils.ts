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
 * Creates a success result
 */
export const success = <T>(value: T): Success<T> => ({
  _tag: "Success",
  value,
});

/**
 * Creates a failure result
 */
export const failure = <E>(error: E): Failure<E> => ({
  _tag: "Failure",
  error,
});

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

/**
 * Maybe type: represents an optional value (Some or None).
 *
 * Example:
 *   const a: Maybe<number> = some(5); // Some(5)
 *   const b: Maybe<number> = none;    // None
 */
export type Maybe<T> = Some<T> | None;

/**
 * Some: wraps a present value in a Maybe.
 *
 * Example:
 *   const a = some(42); // { _tag: 'Some', value: 42 }
 */
export interface Some<T> {
  readonly _tag: "Some";
  readonly value: T;
}

/**
 * None: represents the absence of a value in a Maybe.
 *
 * Example:
 *   const b = none; // { _tag: 'None' }
 */
export interface None {
  readonly _tag: "None";
}

/**
 * Checks if a value is a Maybe (Some or None) as defined by fp-utils.
 *
 * @param value - The value to check.
 * @returns {boolean} True if value is a Maybe (Some or None), false otherwise.
 *
 * Usage:
 *   if (isMaybe(someVar)) {
 *     // someVar is a Maybe (Some or None)
 *   }
 */
export const isMaybe = <T = any>(value: any): value is Maybe<T> => {
  return value && (value._tag === "Some" || value._tag === "None");
};

/**
 * Wraps a value in a Some (present) Maybe.
 *
 * Example:
 *   const a = some("hello"); // { _tag: 'Some', value: 'hello' }
 */
export const some = <T>(value: T): Some<T> => ({
  _tag: "Some",
  value,
});

/**
 * The singleton None value (absent value for Maybe).
 *
 * Example:
 *   const b = none; // { _tag: 'None' }
 */
export const none: None = { _tag: "None" };

/**
 * Converts a nullable value to a Maybe.
 *
 * Example:
 *   fromNullable(5)      // Some(5)
 *   fromNullable(null)   // None
 *   fromNullable(undefined) // None
 */
export const fromNullable = <T>(value: T | null | undefined): Maybe<T> =>
  value != null ? some(value) : none;

/**
 * Checks if a Maybe is Some (has a value).
 *
 * Example:
 *   isSome(some(1)) // true
 *   isSome(none)    // false
 */
export const isSome = <T>(maybe: Maybe<T>): maybe is Some<T> =>
  maybe._tag === "Some";

/**
 * Checks if a Maybe is None (no value).
 *
 * Example:
 *   isNone(some(1)) // false
 *   isNone(none)    // true
 */
export const isNone = <T>(maybe: Maybe<T>): maybe is None =>
  maybe._tag === "None";

/**
 * Maps a function over a Maybe's value, returning a new Maybe.
 * If the Maybe is None, returns None.
 *
 * Example:
 *   mapMaybe(x => x * 2)(some(3)) // Some(6)
 *   mapMaybe(x => x * 2)(none)    // None
 */
export const mapMaybe =
  <T, U>(fn: (value: T) => U) =>
  (maybe: Maybe<T>): Maybe<U> =>
    isSome(maybe) ? some(fn(maybe.value)) : none;

/**
 * Flat maps a function returning Maybe over a Maybe's value.
 * Useful for chaining operations that may also return Maybe.
 * If the Maybe is None, returns None.
 *
 * Example:
 *   flatMapMaybe(x => x > 0 ? some(x * 2) : none)(some(2)) // Some(4)
 *   flatMapMaybe(x => x > 0 ? some(x * 2) : none)(some(-1)) // None
 *   flatMapMaybe(x => some(x * 2))(none) // None
 *
 * // Flattening nested Maybes:
 *   const mm: Maybe<Maybe<number>> = some(some(5));
 *   flatMapMaybe(x => x)(mm) // Some(5)
 */
export const flatMapMaybe =
  <T, U>(fn: (value: T) => Maybe<U>) =>
  (maybe: Maybe<T>): Maybe<U> =>
    isSome(maybe) ? fn(maybe.value) : none;

/**
 * Extracts value from Maybe with default
 */
export const getMaybeOrElse =
  <T>(defaultValue: T) =>
  (maybe: Maybe<T>): T =>
    isSome(maybe) ? maybe.value : defaultValue;

// ============================================================================
// FUNCTION COMPOSITION AND UTILITIES
// ============================================================================

/**
 * Function composition - applies functions from right to left
 */
export const compose =
  <A, B, C>(f: (b: B) => C, g: (a: A) => B) =>
  (a: A): C =>
    f(g(a));

/**
 * Pipe function - applies functions from left to right
 */
export const pipe = <T>(value: T) => ({
  to: <U>(fn: (value: T) => U) => pipe(fn(value)),
  value,
});

/**
 * Curried function helper
 */
export const curry =
  <A, B, C>(fn: (a: A, b: B) => C) =>
  (a: A) =>
  (b: B) =>
    fn(a, b);

/**
 * Partial application helper
 */
export const partial =
  <A extends any[], B extends any[], C>(
    fn: (...args: [...A, ...B]) => C,
    ...partialArgs: A
  ) =>
  (...restArgs: B): C =>
    fn(...partialArgs, ...restArgs);

/**
 * Identity function
 */
export const identity = <T>(value: T): T => value;

/**
 * Constant function
 */
export const constant =
  <T>(value: T) =>
  (): T =>
    value;

/**
 * Tap function - executes side effect and returns original value
 */
export const tap =
  <T>(fn: (value: T) => void) =>
  (value: T): T => {
    fn(value);
    return value;
  };

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Functional array operations
 */
export const arrayUtils = {
  /**
   * Maps over array with Result handling
   */
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

  /**
   * Filters array with predicate
   */
  filter:
    <T>(predicate: (item: T) => boolean) =>
    (array: T[]): T[] =>
      array.filter(predicate),

  /**
   * Finds first item matching predicate
   */
  find:
    <T>(predicate: (item: T) => boolean) =>
    (array: T[]): Maybe<T> =>
      fromNullable(array.find(predicate)),

  /**
   * Reduces array with accumulator
   */
  reduce:
    <T, U>(fn: (acc: U, item: T) => U, initialValue: U) =>
    (array: T[]): U =>
      array.reduce(fn, initialValue),

  /**
   * Groups array by key function
   */
  groupBy:
    <T, K extends string | number>(keyFn: (item: T) => K) =>
    (array: T[]): Record<K, T[]> =>
      array.reduce((groups, item) => {
        const key = keyFn(item);
        (groups[key] = groups[key] || []).push(item);
        return groups;
      }, {} as Record<K, T[]>),

  /**
   * Safely gets array item at index
   */
  at:
    <T>(index: number) =>
    (array: T[]): Maybe<T> =>
      fromNullable(array[index]),

  /**
   * Checks if array is empty
   */
  isEmpty: <T>(array: T[]): boolean => array.length === 0,

  /**
   * Gets first item of array
   */
  head: <T>(array: T[]): Maybe<T> => fromNullable(array[0]),

  /**
   * Gets last item of array
   */
  last: <T>(array: T[]): Maybe<T> => fromNullable(array[array.length - 1]),
};

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Wraps async function to return Result instead of throwing
 */
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

/**
 * Wraps sync function to return Result instead of throwing
 */
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

/**
 * Sequential async mapping with Result handling
 */
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

/**
 * Parallel async mapping with Result handling
 */
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
  /**
   * Maps over object values
   */
  mapValues:
    <T, U>(fn: (value: T) => U) =>
    <K extends string>(obj: Record<K, T>): Record<K, U> => {
      const result = {} as Record<K, U>;
      for (const [key, value] of Object.entries(obj) as [K, T][]) {
        result[key] = fn(value);
      }
      return result;
    },

  /**
   * Filters object by predicate
   */
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

  /**
   * Safely gets object property
   */
  get:
    <K extends string, T>(key: K) =>
    (obj: Record<K, T>): Maybe<T> =>
      fromNullable(obj[key]),

  /**
   * Creates new object with updated property
   */
  set:
    <K extends string, T>(key: K, value: T) =>
    (obj: Record<K, T>): Record<K, T> => ({
      ...obj,
      [key]: value,
    }),

  /**
   * Omits keys from object
   */
  omit:
    <T, K extends keyof T>(keys: K[]) =>
    (obj: T): Omit<T, K> => {
      const result = { ...obj };
      keys.forEach((key) => delete result[key]);
      return result;
    },

  /**
   * Picks keys from object
   */
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
  /**
   * Validates that value is a string
   */
  string: (value: unknown): Result<string, string> =>
    typeof value === "string" ? success(value) : failure("Expected string"),

  /**
   * Validates that value is a number
   */
  number: (value: unknown): Result<number, string> =>
    typeof value === "number" ? success(value) : failure("Expected number"),

  /**
   * Validates that value is not null/undefined
   */
  required: <T>(value: T | null | undefined): Result<T, string> =>
    value != null ? success(value) : failure("Value is required"),

  /**
   * Validates string length
   */
  minLength:
    (min: number) =>
    (value: string): Result<string, string> =>
      value.length >= min
        ? success(value)
        : failure(`Minimum length is ${min}`),

  /**
   * Validates email format
   */
  email: (value: string): Result<string, string> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value)
      ? success(value)
      : failure("Invalid email format");
  },

  /**
   * Combines multiple validators
   */
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

/**
 * Simple memoization for pure functions
 */
export const memoize = <Args extends any[], Return>(
  fn: (...args: Args) => Return,
  getKey = (...args: Args) => JSON.stringify(args)
): ((...args: Args) => Return) => {
  const cache = new Map<string, Return>();

  return (...args: Args): Return => {
    const key = getKey(...args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Debounced function execution
 */
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

/**
 * Throttled function execution
 */
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

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Result type
  success,
  failure,
  isSuccess,
  isFailure,
  map,
  flatMap,
  mapError,
  getOrElse,
  getOrThrow,

  // Maybe type
  some,
  none,
  fromNullable,
  isMaybe,
  isSome,
  isNone,
  mapMaybe,
  flatMapMaybe,
  getMaybeOrElse,

  // Function utilities
  compose,
  pipe,
  curry,
  partial,
  identity,
  constant,
  tap,

  // Array utilities
  arrayUtils,

  // Async utilities
  tryAsync,
  trySync,
  mapAsyncSequential,
  mapAsyncParallel,

  // Object utilities
  objectUtils,

  // Validation
  validators,

  // Memoization
  memoize,
  debounce,
  throttle,
};
