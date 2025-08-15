/**
 * @file loggingMiddleware.ts
 *
 * Purpose: Provides development-mode logging middleware for functional contexts.
 *
 * Main Responsibilities:
 * - Logs context actions and state changes in development
 * - Provides optional context naming for log clarity
 * - Follows established middleware pattern
 *
 * Architectural Role:
 * - Debug middleware for context state management
 * - Development tooling for state flow visibility
 */

import { FunctionalAction, ContextMiddleware } from "@/utils/fp-contexts";

/**
 * loggingMiddleware (Public API)
 *
 * Creates middleware that logs context actions and state changes in development mode.
 * @param contextName string | undefined - Optional name for context identification in logs
 * @returns ContextMiddleware function
 * @sideEffects Logs to console (development only)
 * @notes Only active in development environment; silent in production
 */
export const loggingMiddleware = <S, A extends FunctionalAction>(
  contextName?: string
): ContextMiddleware<S, A> => {
  return (action: A, state: S): A => {
    if (process.env.NODE_ENV === "development") {
      const prefix = `[${contextName || "Context"}]`;
      console.log(`${prefix} Action:`, action);
      console.log(`${prefix} State:`, state);
    }

    return action;
  };
};
