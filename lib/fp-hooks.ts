import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Result,
  Maybe,
  success,
  failure,
  some,
  none,
  pipe,
  compose,
  trySync,
  tryAsync,
  memoize,
} from "./fp-utils";

/**
 * Enhanced functional hooks with Result/Maybe types and functional composition
 * Provides safe, composable state management patterns
 */

// ============================================================================
// SAFE STATE MANAGEMENT HOOKS
// ============================================================================

/**
 * Enhanced useState with Result-based state updates
 * @param initialValue - Initial state value
 * @returns [state, setState with Result handling, resetState]
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
 * Safe state hook with Maybe type for nullable values
 * @param initialValue - Initial Maybe value
 * @returns [maybe state, safe setter, reset function]
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
 * Immutable state hook that prevents direct mutations
 * @param initialValue - Initial state value
 * @returns [readonly state, immutable setter, reset function]
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
 * Enhanced async state with Result-based error handling
 * @param asyncFn - Async function to execute
 * @param deps - Dependencies array
 * @returns Loading state, Result data, retry function
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
 * Safe async operation hook with automatic retries
 * @param operation - Async operation function
 * @param options - Configuration options
 * @returns Async state management object
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
 * Hook for composing multiple async operations in sequence
 * @param operations - Array of async operations
 * @param deps - Dependencies array
 * @returns Composition result state
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
 * Hook for functional pipeline operations on state
 * @param initialValue - Initial state value
 * @param pipeline - Array of transformation functions
 * @returns [state, apply pipeline, reset]
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
 * Enhanced useMemo with Result-based computation
 * @param computeFn - Computation function that may fail
 * @param deps - Dependencies array
 * @returns Maybe<T> result
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
 * Memoized computation with Result error handling
 * @param computeFn - Computation function
 * @param deps - Dependencies array
 * @returns Result<T, Error>
 */
export function useResultMemo<T>(
  computeFn: () => T,
  deps: React.DependencyList
): Result<T, Error> {
  return useMemo(() => trySync(computeFn)(), deps);
}

/**
 * Cached callback with memoization
 * @param fn - Callback function
 * @param deps - Dependencies array
 * @returns Memoized callback
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
 * Form validation hook with functional composition
 * @param initialState - Initial form state
 * @param validators - Object of validator functions
 * @returns Form state management object
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

  const validate = useCallback(
    (key?: keyof T) => {
      const fieldsToValidate = key
        ? [key]
        : (Object.keys(validators) as (keyof T)[]);
      const newErrors: Partial<Record<keyof T, string>> = { ...errors };
      let isValid = true;

      for (const field of fieldsToValidate) {
        const validator = validators[field];
        if (validator) {
          const result = validator(values[field]);
          if (result._tag === "Failure") {
            newErrors[field] = result.error;
            isValid = false;
          } else {
            delete newErrors[field];
          }
        }
      }

      setErrors(newErrors);
      return isValid;
    },
    [values, validators, errors]
  );

  const setValue = useCallback((key: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialState);
    setErrors({});
  }, [initialState]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  return { values, errors, isValid, setValue, validate, reset };
}

// ============================================================================
// EFFECT HOOKS
// ============================================================================

/**
 * Safe effect hook with cleanup and error handling
 * @param effect - Effect function
 * @param deps - Dependencies array
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
 * Async effect hook with cancellation
 * @param asyncEffect - Async effect function
 * @param deps - Dependencies array
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
 * Adapter for existing hooks to use Maybe types
 * @param hook - Original hook function
 * @returns Enhanced hook with Maybe support
 */
export function adaptHookToMaybe<T extends any[], R>(
  hook: (...args: T) => R
): (...args: T) => Maybe<R> {
  return (...args: T): Maybe<R> => {
    try {
      const result = hook(...args);
      return result != null ? some(result) : none;
    } catch {
      return none;
    }
  };
}

/**
 * Migration helper for legacy state hooks
 * @param useState - React useState hook
 * @returns Enhanced state hook with functional patterns
 */
export const enhanceState = <T>(
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

export default {
  useResultState,
  useMaybeState,
  useImmutableState,
  useAsyncResult,
  useSafeAsync,
  useAsyncComposition,
  usePipeline,
  useSafeMemo,
  useResultMemo,
  useMemoizedCallback,
  useFormValidation,
  useSafeEffect,
  useAsyncEffect,
  adaptHookToMaybe,
  enhanceState,
};
