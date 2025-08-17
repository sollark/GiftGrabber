/**
 * @file persistenceMiddleware.ts
 *
 * Purpose: Provides middleware for persisting functional context state to browser storage.
 *
 * Main Responsibilities:
 * - Persists context state to localStorage with field exclusions
 * - Handles browser compatibility and error cases gracefully
 * - Follows established middleware patterns
 * - Provides debounced persistence to optimize performance
 *
 * Architectural Role:
 * - Middleware layer for functional contexts
 * - Bridges context state management and browser storage
 */

import { FunctionalAction, ContextMiddleware } from "@/utils/fp-contexts";

/**
 * Debounce map to track pending persistence operations by storage key.
 */
const debounceMap = new Map<string, NodeJS.Timeout>();

/**
 * Performs the actual persistence operation to localStorage.
 * @param key - Storage key for localStorage
 * @param state - State object to persist
 * @param excludeFields - Fields to exclude from persistence
 */
const persistToStorage = <S>(
  key: string,
  state: S,
  excludeFields: string[] = []
): void => {
  if (typeof window !== "undefined") {
    try {
      const dataToStore = { ...state } as any;

      for (const field of excludeFields) {
        if (field in dataToStore) {
          delete dataToStore[field];
        }
      }

      window.localStorage.setItem(key, JSON.stringify(dataToStore));
    } catch (error) {
      console.warn(`Failed to persist state for key "${key}":`, error);
    }
  }
};

/**
 * persistenceMiddleware (Public API)
 *
 * Creates middleware that persists context state to localStorage with optional field exclusions.
 * @param key string - Storage key for localStorage
 * @param options { exclude?: string[], debounceMs?: number } - Configuration options
 * @returns ContextMiddleware function
 * @sideEffects Writes to localStorage (browser only)
 * @notes Silently handles storage errors; excludes specified fields; debounces writes for performance
 */
export const persistenceMiddleware = <S, A extends FunctionalAction>(
  key: string,
  options: { exclude?: string[]; debounceMs?: number } = {}
): ContextMiddleware<S, A> => {
  const { exclude = [], debounceMs = 300 } = options;

  return (action: A, state: S): A => {
    // Clear existing debounce timer
    const existingTimer = debounceMap.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounced persistence
    const timer = setTimeout(() => {
      persistToStorage(key, state, exclude);
      debounceMap.delete(key);
    }, debounceMs);

    debounceMap.set(key, timer);

    return action;
  };
};
