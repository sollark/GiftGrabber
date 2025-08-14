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
 * Upgraded functional error handler
 * Returns a Result type for composable error handling
 */
export function handleError<E = Error>(error: E): Result<never, E> {
  if (typeof window !== "undefined") {
    // Log error in browser
    console.error("Functional Error:", error);
  }
  return failure(error);
}

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

export const none: None = { _tag: "None" };

export const fromNullable = <T>(value: T | null | undefined): Maybe<T> =>
  value != null ? some(value) : none;

export const isSome = <T>(maybe: Maybe<T>): maybe is Some<T> =>
  maybe._tag === "Some";

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

export const getMaybeOrElse =
  <T>(defaultValue: T) =>
  (maybe: Maybe<T>): T =>
    isSome(maybe) ? maybe.value : defaultValue;

// ============================================================================
// FUNCTION COMPOSITION AND UTILITIES
// ============================================================================

export const compose =
  <A, B, C>(f: (b: B) => C, g: (a: A) => B) =>
  (a: A): C =>
    f(g(a));

export const pipe = <T>(value: T) => ({
  to: <U>(fn: (value: T) => U) => pipe(fn(value)),
  value,
});

export const curry =
  <A, B, C>(fn: (a: A, b: B) => C) =>
  (a: A) =>
  (b: B) =>
    fn(a, b);

export const partial =
  <A extends any[], B extends any[], C>(
    fn: (...args: [...A, ...B]) => C,
    ...partialArgs: A
  ) =>
  (...restArgs: B): C =>
    fn(...partialArgs, ...restArgs);

export const identity = <T>(value: T): T => value;

export const constant =
  <T>(value: T) =>
  (): T =>
    value;

export const tap =
  <T>(fn: (value: T) => void) =>
  (value: T): T => {
    fn(value);
    return value;
  };

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
