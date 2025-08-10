/**
 * Context-aware logging middleware for functional contexts
 * Logs actions and state transitions in development mode
 * @param contextName - Optional name for context (for log prefix)
 */
export const loggingMiddleware =
  <A, S>(contextName?: string) =>
  (action: A, state: S): S => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[${contextName || "Context"}] Action:`, action);
      console.log(`[${contextName || "Context"}] State:`, state);
    }
    return state;
  };
