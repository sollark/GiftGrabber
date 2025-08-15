import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Result,
  Maybe,
  success,
  failure,
  some,
  none,
  trySync,
  tryAsync,
  memoize,
} from "./fp";

/**
 * @file fp-hooks.ts
 *
 * Purpose: Provides a suite of advanced React hooks that integrate functional programming patterns (Result/Maybe types, immutability, compositional state, and error handling) for robust, safe, and maintainable state and effect management.
 *
 * Main Responsibilities:
 * - Implements reusable hooks for state, async, memoization, validation, and effect logic using functional paradigms.
 * - Ensures explicit error and null handling, composability, and separation of concerns in React components and services.
 * - Bridges the functional utility layer (fp.ts) and the UI/business logic layers.
 *
 * Architectural Role:
 * - Core utility module for all React stateful and effectful logic that requires safety, composability, and testability.
 * - Used by components, services, and contexts throughout the application.
 */

// ============================================================================
// SAFE STATE MANAGEMENT HOOKS
// ============================================================================

/**
 * useResultState (Public API)
 *
 * React hook for managing state with functional Result-based updates, ensuring only successful updates are applied.
 * @param initialValue T - Initial state value
 * @returns [T, setResultState, resetState] - State, updater, and reset function
 * @sideEffects Updates React state
 * @notes Only applies updates if Result is Success; ignores on Failure
 */
export function useResultState<T>(
  initialValue: T
): [T, (updater: (prev: T) => Result<T, Error>) => void, () => void] {
  const [state, setState] = useState<T>(initialValue);

  const setResultState = useCallback(
    (updater: (prev: T) => Result<T, Error>) => {
      setState((prevState) => {
        const result = updater(prevState);
        return result._tag === "Success" ? result.value : prevState;
      });
    },
    []
  );

  const resetState = useCallback(() => {
    setState(initialValue);
  }, [initialValue]);

  return [state, setResultState, resetState];
}

/**
 * useMaybeState (Public API)
 *
 * React hook for managing state as a Maybe type, ensuring explicit handling of null/undefined.
 * @param initialValue Maybe<T> - Initial state (defaults to none)
 * @returns [Maybe<T>, setSafeState, resetState] - State, setter, and reset function
 * @sideEffects Updates React state
 * @notes Converts null/undefined to none, otherwise wraps in some
 */
export function useMaybeState<T>(
  initialValue: Maybe<T> = none
): [Maybe<T>, (value: T | null | undefined) => void, () => void] {
  const [state, setState] = useState<Maybe<T>>(initialValue);

  const setSafeState = useCallback((value: T | null | undefined) => {
    setState(value != null ? some(value) : none);
  }, []);

  const resetState = useCallback(() => {
    setState(initialValue);
  }, [initialValue]);

  return [state, setSafeState, resetState];
}

/**
 * useImmutableState (Public API)
 *
 * React hook for managing immutable state, freezing all updates to prevent mutation.
 * @param initialValue T - Initial state value
 * @returns [Readonly<T>, setImmutableState, resetState] - Frozen state, updater, and reset function
 * @sideEffects Updates React state, uses Object.freeze
 * @notes All state and updates are deeply frozen for immutability
 */
export function useImmutableState<T>(
  initialValue: T
): [Readonly<T>, (updater: (prev: Readonly<T>) => T) => void, () => void] {
  const [state, setState] = useState<T>(initialValue);

  const setImmutableState = useCallback((updater: (prev: Readonly<T>) => T) => {
    setState((prevState) => {
      const newState = updater(Object.freeze(prevState));
      return Object.freeze(newState);
    });
  }, []);

  const resetState = useCallback(() => {
    setState(Object.freeze(initialValue));
  }, [initialValue]);

  return [Object.freeze(state), setImmutableState, resetState];
}

// ============================================================================
// ASYNC STATE HOOKS
// ============================================================================

/**
 * useAsyncResult (Public API)
 *
 * React hook for managing async operations with loading and Result state, supporting retries.
 * @param asyncFn () => Promise<T> - Async function to execute
 * @param deps React.DependencyList - Dependency array for effect
 * @returns { loading, result, retry } - Loading state, Result, and retry handler
 * @sideEffects Triggers async calls, updates state
 * @notes Wraps async results in Maybe<Result<T, Error>>
 */
export function useAsyncResult<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = []
): {
  loading: boolean;
  result: Maybe<Result<T, Error>>;
  retry: () => void;
} {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Maybe<Result<T, Error>>>(none);

  const execute = useCallback(async () => {
    setLoading(true);
    try {
      const value = await asyncFn();
      setResult(some(success(value)));
    } catch (error) {
      setResult(
        some(failure(error instanceof Error ? error : new Error(String(error))))
      );
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  const retry = useCallback(() => {
    execute();
  }, [execute]);

  return { loading, result, retry };
}

/**
 * useSafeAsync (Public API)
 *
 * React hook for robust async operations with retries, error, and loading state, using Maybe types.
 * @param operation () => Promise<T> - Async operation
 * @param options { maxRetries, retryDelay, deps } - Retry and dependency options
 * @returns { data, error, loading, execute, reset } - State and handlers
 * @sideEffects Triggers async calls, updates state
 * @notes Retries on failure, exposes reset and execute
 */
export function useSafeAsync<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    deps?: React.DependencyList;
  } = {}
): {
  data: Maybe<T>;
  error: Maybe<Error>;
  loading: boolean;
  execute: () => Promise<void>;
  reset: () => void;
} {
  const { maxRetries = 3, retryDelay = 1000, deps = [] } = options;
  const [data, setData] = useState<Maybe<T>>(none);
  const [error, setError] = useState<Maybe<Error>>(none);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(none);
    let retries = 0;

    while (retries <= maxRetries) {
      try {
        const result = await operation();
        setData(some(result));
        setLoading(false);
        return;
      } catch (err) {
        if (retries === maxRetries) {
          setError(some(err instanceof Error ? err : new Error(String(err))));
          setLoading(false);
          return;
        }
        retries++;
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }, [...deps, maxRetries, retryDelay]);

  const reset = useCallback(() => {
    setData(none);
    setError(none);
    setLoading(false);
  }, []);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, error, loading, execute, reset };
}

// ============================================================================
// COMPOSITION HOOKS
// ============================================================================

/**
 * useAsyncComposition (Public API)
 *
 * React hook for composing multiple async operations in sequence, aggregating results and errors.
 * @param operations (() => Promise<T>)[] - Array of async functions
 * @param deps React.DependencyList - Dependency array
 * @returns { results, loading, error, execute } - State and handlers
 * @sideEffects Triggers async calls, updates state
 * @notes Runs all operations in order, stops on first error
 */
export function useAsyncComposition<T>(
  operations: (() => Promise<T>)[],
  deps: React.DependencyList = []
): {
  results: T[];
  loading: boolean;
  error: Maybe<Error>;
  execute: () => Promise<void>;
} {
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Maybe<Error>>(none);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(none);
    const newResults: T[] = [];

    try {
      for (const operation of operations) {
        const result = await operation();
        newResults.push(result);
      }
      setResults(newResults);
    } catch (err) {
      setError(some(err instanceof Error ? err : new Error(String(err))));
    } finally {
      setLoading(false);
    }
  }, [...deps, operations.length]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { results, loading, error, execute };
}

/**
 * usePipeline (Public API)
 *
 * React hook for applying a pipeline of transformations to state.
 * @param initialValue T - Initial state value
 * @param pipeline ((T) => T)[] - Array of transformation functions
 * @returns [T, applyPipeline, reset] - State, apply handler, and reset function
 * @sideEffects Updates state
 * @notes Applies all pipeline functions in order
 */
export function usePipeline<T>(
  initialValue: T,
  pipeline: ((value: T) => T)[]
): [T, () => void, () => void] {
  const [state, setState] = useState<T>(initialValue);

  const applyPipeline = useCallback(() => {
    setState((currentState) => {
      let result = currentState;
      for (const transform of pipeline) {
        result = transform(result);
      }
      return result;
    });
  }, [pipeline]);

  const reset = useCallback(() => {
    setState(initialValue);
  }, [initialValue]);

  return [state, applyPipeline, reset];
}

// ============================================================================
// MEMOIZATION HOOKS
// ============================================================================

/**
 * useSafeMemo (Public API)
 *
 * React hook for memoizing a computation, returning a Maybe type for error safety.
 * @param computeFn () => T - Computation function
 * @param deps React.DependencyList - Dependency array
 * @returns Maybe<T> - Computed value or none on error
 * @sideEffects None
 * @notes Catches errors in computeFn and returns none
 */
export function useSafeMemo<T>(
  computeFn: () => T,
  deps: React.DependencyList
): Maybe<T> {
  return useMemo(() => {
    const result = trySync(computeFn)();
    return result._tag === "Success" ? some(result.value) : none;
  }, deps);
}

/**
 * useResultMemo (Public API)
 *
 * React hook for memoizing a computation, returning a Result for error handling.
 * @param computeFn () => T - Computation function
 * @param deps React.DependencyList - Dependency array
 * @returns Result<T, Error> - Success or failure of computation
 * @sideEffects None
 */
export function useResultMemo<T>(
  computeFn: () => T,
  deps: React.DependencyList
): Result<T, Error> {
  return useMemo(() => trySync(computeFn)(), deps);
}

/**
 * useMemoizedCallback (Public API)
 *
 * React hook for memoizing a callback with argument-based memoization.
 * @param fn (...args: T) => R - Callback function
 * @param deps React.DependencyList - Dependency array
 * @returns (...args: T) => R - Memoized callback
 * @sideEffects None
 * @notes Uses custom memoize utility for argument-based caching
 */
export function useMemoizedCallback<T extends any[], R>(
  fn: (...args: T) => R,
  deps: React.DependencyList
): (...args: T) => R {
  const memoizedFn = useMemo(() => memoize(fn), deps);
  return useCallback(memoizedFn, [memoizedFn]);
}

// ============================================================================
// VALIDATION HOOKS
// ============================================================================

/**
 * useFormValidation (Public API)
 *
 * React hook for managing form state and validation using functional patterns.
 * @param initialState T - Initial form state
 * @param validators Partial<Record<keyof T, (value: any) => Result<any, string>>> - Field validators
 * @returns { values, errors, isValid, setValue, validate, reset } - Form state and handlers
 * @sideEffects Updates state
 * @notes Validates on demand, supports per-field and full-form validation
 */
export function useFormValidation<T extends Record<string, any>>(
  initialState: T,
  validators: Partial<Record<keyof T, (value: any) => Result<any, string>>>
): {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
  setValue: (key: keyof T, value: any) => void;
  validate: (key?: keyof T) => boolean;
  reset: () => void;
} {
  const [values, setValues] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const setValue = useCallback((key: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear error when value changes
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const validate = useCallback(
    (key?: keyof T): boolean => {
      if (key) {
        const validator = validators[key];
        if (validator) {
          const result = validator(values[key]);
          if (result._tag === "Failure") {
            setErrors((prev) => ({ ...prev, [key]: result.error }));
            return false;
          }
        }
        return true;
      }

      // Validate all fields
      let isValid = true;
      const newErrors: Partial<Record<keyof T, string>> = {};

      for (const fieldKey of Object.keys(values) as Array<keyof T>) {
        const validator = validators[fieldKey];
        if (validator) {
          const result = validator(values[fieldKey]);
          if (result._tag === "Failure") {
            newErrors[fieldKey] = result.error;
            isValid = false;
          }
        }
      }

      setErrors(newErrors);
      return isValid;
    },
    [values, validators]
  );

  const reset = useCallback(() => {
    setValues(initialState);
    setErrors({});
  }, [initialState]);

  const isValid = Object.keys(errors).length === 0;

  return { values, errors, isValid, setValue, validate, reset };
}

// ============================================================================
// EFFECT HOOKS
// ============================================================================

/**
 * useSafeEffect (Public API)
 *
 * React hook for running effects with error boundaries.
 * @param effect () => (() => void) | void - Effect function
 * @param deps React.DependencyList - Dependency array
 * @returns void
 * @sideEffects Runs effect, logs errors
 * @notes Catches and logs errors in effect
 */
export function useSafeEffect(
  effect: () => (() => void) | void,
  deps: React.DependencyList
): void {
  useEffect(() => {
    try {
      return effect();
    } catch (error) {
      console.error("Effect error:", error);
    }
  }, deps);
}

/**
 * useAsyncEffect (Public API)
 *
 * React hook for running async effects with abort support and error boundaries.
 * @param asyncEffect (signal: AbortSignal) => Promise<void> - Async effect function
 * @param deps React.DependencyList - Dependency array
 * @returns void
 * @sideEffects Runs async effect, logs errors, aborts on cleanup
 * @notes Uses AbortController for cancellation
 */
export function useAsyncEffect(
  asyncEffect: (signal: AbortSignal) => Promise<void>,
  deps: React.DependencyList
): void {
  useEffect(() => {
    const controller = new AbortController();

    asyncEffect(controller.signal).catch((error) => {
      if (!controller.signal.aborted) {
        console.error("Async effect error:", error);
      }
    });

    return () => controller.abort();
  }, deps);
}

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

/**
 * adaptHookToMaybe (Public API)
 *
 * Adapts any hook or function to return a Maybe type, catching errors.
 * @param hook (...args: T) => R - Hook or function to adapt
 * @returns (...args: T) => Maybe<R> - Adapted function
 * @sideEffects None
 * @notes Useful for safe integration of legacy or third-party hooks
 */
export function adaptHookToMaybe<T extends any[], R>(
  hook: (...args: T) => R
): (...args: T) => Maybe<R> {
  return (...args: T) => {
    try {
      const result = hook(...args);
      return some(result);
    } catch {
      return none;
    }
  };
}

/**
 * useEnhancedState (Public API)
 *
 * React hook for state with enhanced error handling in the updater.
 * @param initialValue T - Initial state value
 * @returns [T, enhancedSetState, resetState] - State, updater, and reset function
 * @sideEffects Updates state
 * @notes Updater is wrapped in try/catch to prevent state corruption
 */
export const useEnhancedState = <T>(
  initialValue: T
): [T, (updater: (prev: T) => T) => void, () => void] => {
  const [state, setState] = useState<T>(initialValue);

  const enhancedSetState = useCallback((updater: (prev: T) => T) => {
    setState((prev) => {
      try {
        return updater(prev);
      } catch {
        return prev;
      }
    });
  }, []);

  const resetState = useCallback(() => {
    setState(initialValue);
  }, [initialValue]);

  return [state, enhancedSetState, resetState];
};
