"use client";
/**
 * MultistepContext.tsx
 * Purpose: Provides the main React context for multistep workflows (e.g., forms, wizards).
 * Responsibilities: Sets up context, provider, and exposes hooks/selectors/actions for step navigation.
 * Architecture: Centralizes multistep state, connects reducer and middleware, enables modular access to step logic.
 */

import React from "react";
import useSafeContext from "@/app/hooks/useSafeContext";
import {
  MultistepState,
  MultistepAction,
  MultistepProviderProps,
} from "./types";
import { createInitialState, multistepReducer } from "./multistepReducer";
import {
  loggingMiddleware,
  validationMiddleware,
  createFunctionalContext,
} from "@/utils/fp-contexts";
import { persistenceMiddleware } from "@/app/middleware/persistenceMiddleware";
import { success } from "@/utils/fp";
import { useStepData } from "./useStepData";
import { useStepNavigation } from "./useStepNavigation";
import { withErrorBoundary } from "@/components/ErrorBoundary";
import ErrorMessage from "@/components/ui/ErrorMessage";

/**
 * Validation middleware for multistep context.
 * Ensures steps are validated before navigation.
 * If business rules grow, move validation logic to a dedicated utility.
 */
const multistepValidation = validationMiddleware<
  MultistepState,
  MultistepAction
>((action, state) => {
  // TODO: Centralize validation logic if business rules expand
  switch (action.type) {
    case "GO_TO_NEXT_STEP":
    case "COMPLETE_STEP":
      return success(true);
    default:
      return success(true);
  }
});

/**
 * Create context and provider for multistep state.
 * Configured with logging and persistence middleware for core navigation data.
 */
const contextResult = createFunctionalContext<MultistepState, MultistepAction>({
  name: "Multistep",
  initialState: createInitialState([]),
  reducer: multistepReducer,
  middleware: [
    loggingMiddleware,
    multistepValidation,
    persistenceMiddleware("multistep-context", {
      exclude: ["loading", "error", "lastUpdated", "version"],
    }),
  ],
  debugMode: process.env.NODE_ENV === "development",
});

/**
 * MultistepContext - React context for multistep state
 * @public
 */
export const MultistepContext: React.Context<MultistepState | undefined> =
  React.createContext<MultistepState | undefined>(undefined);

// Assign context value from contextResult
MultistepContext.displayName = "MultistepContext";

/**
 * BaseMultistepProvider - Low-level provider for advanced usage
 * @public
 */
export const BaseMultistepProvider = (contextResult as any).Provider;

/**
 * MultistepProvider - Convenience provider component for easy setup.
 * Automatically initializes context with provided steps and optional starting index.
 * @param steps - Array of step definitions
 * @param children - React children to render within provider
 * @param initialStepIndex - Optional starting step index (defaults to 0)
 * @public
 */
const MultistepProviderComponent: React.FC<MultistepProviderProps> = ({
  steps,
  children,
  initialStepIndex = 0,
}) => {
  const initialState = React.useMemo(() => createInitialState(steps), [steps]);
  return (
    <BaseMultistepProvider initialState={initialState}>
      {children}
    </BaseMultistepProvider>
  );
};

/**
 * MultistepProvider - Provider component wrapped in error boundary.
 * @see MultistepProviderComponent
 * @public
 */
export const MultistepProvider = withErrorBoundary(
  MultistepProviderComponent,
  "MultistepContext",
  <ErrorMessage message="Failed to load Multistep context. Please refresh the page." />
);

/**
 * useMultistepContext - Hook to access multistep context.
 * @returns {MultistepState} Current multistep state
 * @public
 */
export function useMultistepContext() {
  // Use contextResult.Context, which is the correct context shape
  return useSafeContext(contextResult.Context, "MultistepContext");
}

/**
 * useStepNavigation - Hook for step navigation actions.
 * @returns Navigation helpers for multistep workflow
 * @public
 */
export { useStepNavigation };

/**
 * useStepData - Hook for accessing and managing step data.
 * @returns Step data helpers for multistep workflow
 * @public
 */
export { useStepData };

// Removed deprecated default export. Use named exports instead.
