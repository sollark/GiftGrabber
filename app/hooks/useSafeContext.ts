import { fromPromise } from "@/utils/fp";
/**
 * Async safe context hook that returns a Promise<Result<T, Error>>
 * Useful if context value is fetched asynchronously (e.g., from storage or API)
 * @param fetchContext - Async function to fetch context value
 * @param contextName - Name for error messages
 * @returns Promise<Result<T, Error>>
 */
export async function useAsyncContextResult<T>(
  fetchContext: () => Promise<T>,
  contextName: string
): Promise<Result<T, Error>> {
  return fromPromise(
    fetchContext().catch((error) =>
      Promise.reject(
        error instanceof Error
          ? error
          : new Error(
              `Failed to fetch ${contextName} context: ${String(error)}`
            )
      )
    )
  );
}
import React, { useContext, Context } from "react";
import { Maybe, some, none, Result, success, failure } from "@/utils/fp";

/**
 * Enhanced safe context hook with functional error handling
 * Provides Result/Maybe types for context access with comprehensive error handling
 */

// ============================================================================
// SAFE CONTEXT HOOKS WITH RESULT/MAYBE TYPES
// ============================================================================

/**
 * Enhanced safe context hook that returns Maybe<T> instead of throwing errors
 * @param context - React context to access
 * @param contextName - Optional name for better error messages
 * @returns Maybe<T> - Some(value) if context exists, None if not available
 */
export function useSafeContext<T>(
  context: Context<T | undefined>,
  contextName?: string
): Maybe<T> {
  try {
    const value = useContext(context);
    return value !== undefined ? some(value) : none;
  } catch (error) {
    if (contextName) {
      console.warn(`Context "${contextName}" access failed:`, error);
    }
    return none;
  }
}

/**
 * Safe context hook that returns Result<T, Error> for explicit error handling
 * @param context - React context to access
 * @param contextName - Name for error messages
 * @returns Result<T, Error> - Success(value) if available, Failure(error) if not
 */
export function useContextResult<T>(
  context: Context<T | undefined>,
  contextName: string
): Result<T, Error> {
  try {
    const value = useContext(context);
    if (value === undefined) {
      return failure(
        new Error(
          `${contextName} context is not available. Make sure component is wrapped with ${contextName}Provider.`
        )
      );
    }
    return success(value);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error
        : new Error(`Failed to access ${contextName} context: ${String(error)}`)
    );
  }
}

/**
 * Safe context hook with default value fallback
 * @param context - React context to access
 * @param defaultValue - Default value to return if context is unavailable
 * @param contextName - Optional name for error logging
 * @returns T - Context value or default value
 */
export function useContextWithDefault<T>(
  context: Context<T | undefined>,
  defaultValue: T,
  contextName?: string
): T {
  try {
    const value = useContext(context);
    if (value === undefined) {
      if (contextName) {
        console.warn(
          `${contextName} context not available, using default value`
        );
      }
      return defaultValue;
    }
    return value;
  } catch (error) {
    if (contextName) {
      console.warn(
        `${contextName} context access failed, using default value:`,
        error
      );
    }
    return defaultValue;
  }
}

/**
 * Context hook that validates the context value with a type guard
 * @param context - React context to access
 * @param validator - Function to validate the context value
 * @param contextName - Name for error messages
 * @returns Result<T, Error> - Success(value) if valid, Failure(error) if invalid
 */
export function useValidatedContext<T, U extends T>(
  context: Context<T | undefined>,
  validator: (value: T) => value is U,
  contextName: string
): Result<U, Error> {
  try {
    const value = useContext(context);
    if (value === undefined) {
      return failure(new Error(`${contextName} context is not available`));
    }

    if (!validator(value)) {
      return failure(
        new Error(`${contextName} context value failed validation`)
      );
    }

    return success(value);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error
        : new Error(`${contextName} context validation error: ${String(error)}`)
    );
  }
}

// ============================================================================
// TYPED CONTEXT CREATORS
// ============================================================================

/**
 * Creates a safe context with built-in error handling
 * @param contextName - Name of the context for error messages
 * @param defaultValue - Optional default value
 * @returns Object with context, provider, and safe hook
 */
export function createSafeContext<T>(contextName: string, defaultValue?: T) {
  const Context = React.createContext<T | undefined>(defaultValue);
  Context.displayName = contextName;

  const useSafe = () => useSafeContext(Context, contextName);
  const useResult = () => useContextResult(Context, contextName);
  const useWithDefault = (fallback: T) =>
    useContextWithDefault(Context, fallback, contextName);

  return {
    Context,
    useSafe,
    useResult,
    useWithDefault,
    Provider: Context.Provider,
  };
}

/**
 * Creates a context with validation support
 * @param contextName - Name of the context
 * @param validator - Validation function
 * @returns Object with context, provider, and validated hook
 */
export function createValidatedContext<T, U extends T>(
  contextName: string,
  validator: (value: T) => value is U
) {
  const Context = React.createContext<T | undefined>(undefined);
  Context.displayName = contextName;

  const useValidated = () =>
    useValidatedContext(Context, validator, contextName);

  return {
    Context,
    useValidated,
    Provider: Context.Provider,
  };
}

// ============================================================================
// CONTEXT COMPOSITION UTILITIES
// ============================================================================

/**
 * Combines multiple contexts into a single hook
 * @param contexts - Array of context access functions
 * @returns Combined context values as Maybe<T[]>
 */
export function useCombinedContexts<T extends any[]>(
  ...contexts: (() => Maybe<any>)[]
): Maybe<T> {
  try {
    const values: any[] = [];

    for (const contextHook of contexts) {
      const maybeValue = contextHook();
      if (maybeValue._tag === "None") {
        return none;
      }
      values.push(maybeValue.value);
    }

    return some(values as T);
  } catch {
    return none;
  }
}

/**
 * Safely accesses multiple contexts and returns results
 * @param contexts - Array of context result functions
 * @returns Result containing array of values or error
 */
export function useMultipleContextResults<T extends any[]>(
  ...contexts: (() => Result<any, Error>)[]
): Result<T, Error[]> {
  try {
    const values: any[] = [];
    const errors: Error[] = [];

    for (const contextHook of contexts) {
      const result = contextHook();
      if (result._tag === "Success") {
        values.push(result.value);
      } else {
        errors.push(result.error);
      }
    }

    if (errors.length > 0) {
      return failure(errors);
    }

    return success(values as T);
  } catch (error) {
    return failure([error instanceof Error ? error : new Error(String(error))]);
  }
}

// ============================================================================
// CONTEXT DEBUGGING UTILITIES - DEV ONLY
// ============================================================================

/**
 * Debug wrapper for context hooks (development only)
 * @param contextHook - Context hook to wrap with debug logging
 * @param contextName - Name for logging
 * @returns Wrapped hook with debug logging
 */
export function withContextDebug<T>(
  contextHook: () => Maybe<T>,
  contextName: string
): () => Maybe<T> {
  return () => {
    const result = contextHook();

    if (process.env.NODE_ENV === "development") {
      console.debug(`Context "${contextName}":`, {
        available: result._tag === "Some",
        value: result._tag === "Some" ? result.value : undefined,
      });
    }

    return result;
  };
}

/**
 * Performance monitoring wrapper for context hooks (development only)
 * @param contextHook - Context hook to wrap with performance monitoring
 * @param contextName - Name for monitoring
 * @returns Wrapped hook with performance tracking
 */
export function withContextMonitoring<T>(
  contextHook: () => Maybe<T>,
  contextName: string
): () => Maybe<T> {
  return () => {
    const startTime = performance.now();
    const result = contextHook();
    const endTime = performance.now();

    if (process.env.NODE_ENV === "development") {
      console.debug(
        `Context "${contextName}" access took ${endTime - startTime}ms`
      );
    }

    return result;
  };
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy context hook that throws errors (for backward compatibility)
 * @param context - React context
 * @param errorMessage - Error message to throw
 * @returns Context value or throws error
 */
export function useLegacyContext<T>(
  context: Context<T | undefined>,
  errorMessage?: string
): T {
  const value = useContext(context);

  if (value === undefined) {
    throw new Error(
      errorMessage ||
        "Context value is undefined. Make sure component is wrapped with the appropriate Provider."
    );
  }

  return value;
}

/**
 * Adapter to convert new safe context hooks to legacy throwing hooks
 * @param safeContextHook - Safe context hook that returns Maybe<T>
 * @param errorMessage - Error message for when context is not available
 * @returns Context value or throws error
 */
export function adaptSafeToLegacy<T>(
  safeContextHook: () => Maybe<T>,
  errorMessage?: string
): T {
  const maybeValue = safeContextHook();

  if (maybeValue._tag === "None") {
    throw new Error(errorMessage || "Context is not available");
  }

  return maybeValue.value;
}

/**
 * Migration helper for transitioning between legacy and safe context patterns
 * @param context - React context to consume
 * @param contextName - Name for error messages
 * @param useLegacy - Whether to use legacy throwing behavior
 * @returns Context value (throws if legacy mode and undefined)
 */
export function useMigrationContext<T>(
  context: Context<T | undefined>,
  contextName: string,
  useLegacy: boolean = false
): T | Maybe<T> {
  const legacyValue = useLegacyContext(
    context,
    `${contextName} context is not available`
  );
  const safeValue = useSafeContext(context, contextName);

  if (useLegacy) {
    return legacyValue;
  }

  return safeValue;
}

export default useSafeContext;
