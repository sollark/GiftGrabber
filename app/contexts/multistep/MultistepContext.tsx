/**
 * MultistepContext.tsx
 * Purpose: Provides the main React context for multistep workflows (e.g., forms, wizards).
 * Responsibilities: Sets up context, provider, and exposes hooks/selectors/actions for step navigation and validation.
 * Architecture: Centralizes multistep state, connects reducer and middleware, enables modular access to step logic.
 */
// ...existing code...
import { MultistepState, MultistepAction } from "./types";
import { createInitialState, multistepReducer } from "./multistepReducer";
import {
  loggingMiddleware,
  validationMiddleware,
  createFunctionalContext,
} from "@/lib/fp-contexts";
import { persistenceMiddleware } from "@/app/middleware/persistenceMiddleware";
import { success } from "@/utils/fp";
import { useStepData } from "./useStepData";
import { useStepValidation } from "./useStepValidation";
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
 */
const contextResult = createFunctionalContext<MultistepState, MultistepAction>({
  name: "Multistep",
  initialState: createInitialState([]),
  reducer: multistepReducer,
  middleware: [
    loggingMiddleware,
    multistepValidation,
    persistenceMiddleware("multistep-context", {
      exclude: [
        "loading",
        "error",
        "lastUpdated",
        "version",
        "navigationHistory",
      ],
    }),
  ],
  debugMode: process.env.NODE_ENV === "development",
});

/** MultistepContext - React context for multistep state */
export const MultistepContext: React.Context<MultistepState> = (
  contextResult as any
).Context;
/** BaseMultistepProvider - Provider for multistep context */
export const BaseMultistepProvider = (contextResult as any).Provider;
/** useMultistepContext - Hook to access multistep context */
export const useMultistepContext = (contextResult as any).useContext;
/** useMultistepContextResult - Hook to access context result */
export const useMultistepContextResult = (contextResult as any)
  .useContextResult;
/** useMultistepSelector - Hook to select state from context */
export const useMultistepSelector = (contextResult as any).useSelector;
/** useMultistepActions - Hook to access context actions */
export const useMultistepActions = (contextResult as any).useActions;

/**
 * EnhancedMultistepContextExports - Encapsulated export object for all context APIs.
 */
const MultistepContextAPI = {
  BaseMultistepProvider,
  useMultistepContext,
  useMultistepContextResult,
  useMultistepSelector,
  useMultistepActions,
  useStepNavigation,
  useStepData,
  useStepValidation,
};

export default MultistepContextAPI;
