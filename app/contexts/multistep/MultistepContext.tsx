/**
 * MultistepContext.tsx
 * Purpose: Provides the main React context for multistep workflows (e.g., forms, wizards).
 * Responsibilities: Sets up context, provider, and exposes hooks/selectors/actions for step navigation.
 * Architecture: Centralizes multistep state, connects reducer and middleware, enables modular access to step logic.
 */

import React from "react";
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
} from "@/lib/fp-contexts";
import { persistenceMiddleware } from "@/app/middleware/persistenceMiddleware";
import { success } from "@/utils/fp";
import { useStepData } from "./useStepData";
import { useStepNavigation } from "./useStepNavigation";

/**
 * Validation middleware for multistep context.
 * Ensures steps are validated before navigation.
 */
const multistepValidation = validationMiddleware<
  MultistepState,
  MultistepAction
>((action, state) => {
  switch (action.type) {
    case "GO_TO_NEXT_STEP": {
      // You can add your validation logic here if needed
      return success(true);
    }
    case "COMPLETE_STEP": {
      // You can add your validation logic here if needed
      return success(true);
    }
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

/** MultistepContext - React context for multistep state */
export const MultistepContext: React.Context<MultistepState> = (
  contextResult as any
).Context;

/** BaseMultistepProvider - Low-level provider for advanced usage */
export const BaseMultistepProvider = (contextResult as any).Provider;

/**
 * MultistepProvider - Convenience provider component for easy setup.
 * Automatically initializes context with provided steps and optional starting index.
 * @param steps - Array of step definitions
 * @param children - React children to render within provider
 * @param initialStepIndex - Optional starting step index (defaults to 0)
 */
export const MultistepProvider: React.FC<MultistepProviderProps> = ({
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

/** useMultistepContext - Hook to access multistep context */
export const useMultistepContext = (contextResult as any).useContext;

/** useMultistepContextResult - Hook to access context result */
export const useMultistepContextResult = (contextResult as any)
  .useContextResult;

/** useMultistepSelector - Hook to select state from context */
export const useMultistepSelector = (contextResult as any).useSelector;

/** useMultistepActions - Hook to access context actions */
export const useMultistepActions = (contextResult as any).useActions;

// Export all hooks and components with consistent named exports
export { useStepNavigation, useStepData };

// For backward compatibility, maintain default export
const MultistepContextAPI = {
  // Foundation components and hooks
  MultistepProvider,
  BaseMultistepProvider,
  useMultistepContext,
  useMultistepContextResult,
  useMultistepSelector,
  useMultistepActions,

  // Business logic hooks
  useStepNavigation,
  useStepData,
};

export default MultistepContextAPI;
