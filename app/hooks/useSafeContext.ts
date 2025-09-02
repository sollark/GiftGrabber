/**
 * useSafeContext.ts
 *
 * Purpose: Safe React context access hooks with functional error handling and type safety
 *
 * Main Responsibilities:
 * - Provides safe context access preventing runtime errors from undefined contexts
 * - Implements Maybe and Result types for explicit null handling and error management
 * - Offers async context operations with automatic error wrapping
 * - Enables functional composition of context operations without exception handling
 * - Supports multiple context access patterns with proper error messaging
 *
 * Architecture Role:
 * - Foundation utility for all context-consuming components in the application
 * - Prevents context-related runtime errors through compile-time type safety
 * - Enables functional programming patterns in React component trees
 * - Critical infrastructure for context provider hierarchy error handling
 * - Base layer for building complex context composition and validation patterns
 *
 * @businessLogic
 * - Maybe<T> pattern eliminates null pointer exceptions in context access
 * - Result<T, E> pattern provides explicit error handling for async context operations
 * - Context name parameters enable detailed error messages for debugging
 * - Multiple access patterns support different error handling strategies
 * - Async context support enables context values from external sources
 */

import { fromPromise } from "@/utils/fp";
/**
 * Async context hook returning Promise<Result<T, Error>> for safe async context operations
 *
 * @param fetchContext - Async function to fetch context value from external source
 * @param contextName - Descriptive name for error messages and debugging
 * @returns Promise<Result<T, Error>> with fetched context value or detailed error
 *
 * @sideEffects Executes async context fetching function with error handling
 * @performance Dependent on fetchContext implementation and external data sources
 * @notes Useful for contexts populated from APIs, localStorage, or other async sources
 * @publicAPI Specialized hook for async context initialization patterns
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
 * Safe context access hook returning Maybe<T> for null-safe context operations
 *
 * @param context - React Context<T | undefined> to access safely
 * @param contextName - Optional descriptive name for error messages and debugging
 * @returns Maybe<T> - Some(value) if context available, None if undefined or error
 *
 * @sideEffects None - pure function reading React context state
 * @performance O(1) - simple context access with minimal error handling overhead
 * @notes Prevents runtime errors from undefined context access patterns
 * @publicAPI Primary safe context hook used throughout component hierarchy
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

export default useSafeContext;
