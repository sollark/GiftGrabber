/**
 * @file persistenceMiddleware.ts
 *
 * Purpose: Provides middleware for persisting functional context state to browser storage.
 *
 * Main Responsibilities:
 * - Persists context state to localStorage with field exclusions
 * - Handles browser compatibility and error cases gracefully
 * - Follows established middleware patterns
 *
 * Architectural Role:
 * - Middleware layer for functional contexts
 * - Bridges context state management and browser storage
 */

import { FunctionalAction, ContextMiddleware } from "@/utils/fp-contexts";

/**
 * persistenceMiddleware (Public API)
 *
 * Creates middleware that persists context state to localStorage with optional field exclusions.
 * @param key string - Storage key for localStorage
 * @param options { exclude?: string[] } - Configuration options
 * @returns ContextMiddleware function
 * @sideEffects Writes to localStorage (browser only)
 * @notes Silently handles storage errors; excludes specified fields
 */
export const persistenceMiddleware = <S, A extends FunctionalAction>(
  key: string,
  options: { exclude?: string[] } = {}
): ContextMiddleware<S, A> => {
  return (action: A, state: S): A => {
    if (typeof window !== "undefined") {
      try {
        const dataToStore = { ...state } as any;

        if (options.exclude) {
          for (const field of options.exclude) {
            if (field in dataToStore) {
              delete dataToStore[field];
            }
          }
        }

        window.localStorage.setItem(key, JSON.stringify(dataToStore));
      } catch (error) {
        console.warn(`Failed to persist state for key "${key}":`, error);
      }
    }

    return action;
  };
};
