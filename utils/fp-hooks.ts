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
 * Enhanced functional hooks with Result/Maybe types and functional composition
 * Provides safe, composable state management patterns
 */

// ============================================================================
// SAFE STATE MANAGEMENT HOOKS
// ============================================================================

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

export function useSafeMemo<T>(
  computeFn: () => T,
  deps: React.DependencyList
): Maybe<T> {
  return useMemo(() => {
    const result = trySync(computeFn)();
    return result._tag === "Success" ? some(result.value) : none;
  }, deps);
}

export function useResultMemo<T>(
  computeFn: () => T,
  deps: React.DependencyList
): Result<T, Error> {
  return useMemo(() => trySync(computeFn)(), deps);
}

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
