/**
 * Enhanced MultistepContext with functional programming patterns
 * Provides immutable state management for multistep form navigation
 */

import React from "react";
import {
  createFunctionalContext,
  FunctionalAction,
  FunctionalState,
} from "@/lib/fp-contexts";
import { loggingMiddleware } from "@/lib/fp-contexts";
import { validationMiddleware } from "@/lib/fp-contexts";
import { persistenceMiddleware } from "@/app/middleware/persistenceMiddleware";
import { Result, Maybe, some, none, success, failure } from "@/lib/fp-utils";

// ============================================================================

import {
  MultistepAction,
  MultistepProviderProps,
  StepDefinition,
  ValidationRule,
  StepValidationResult,
  NavigationHistoryEntry,
} from "./types";

export interface MultistepData {
  steps: StepDefinition[];
  currentStepIndex: number;
  currentStepId: string;
  completedSteps: Set<string>;
  skippedSteps: Set<string>;
  stepData: Record<string, unknown>;
  validationResults: Record<string, StepValidationResult>;
  canGoBack: boolean;
  canGoNext: boolean;
  canComplete: boolean;
  navigationHistory: NavigationHistoryEntry[];
  formContext: Record<string, unknown>;
}

export type MultistepState = FunctionalState<MultistepData> | "RESET_FORM";

import {
  findStepIndex,
  getCurrentStep,
  validateStep,
  areStepDependenciesMet,
  isStepOptional,
  canNavigateToStep,
} from "./multistepUtils";

// ============================================================================
// INITIAL STATE AND REDUCER (IMPORTED)
// ============================================================================

import { createInitialState, multistepReducer } from "./multistepReducer";

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const multistepValidation = validationMiddleware<
  MultistepState,
  MultistepAction
>((action, state) => {
  switch (action.type) {
    case "GO_TO_NEXT_STEP": {
      const currentStep = getCurrentStep(
        state !== "RESET_FORM" ? state.data.steps : [],
        state !== "RESET_FORM" ? state.data.currentStepIndex : 0
      );
      if (currentStep._tag === "Some") {
        const currentValidation =
          state !== "RESET_FORM"
            ? state.data.validationResults[currentStep.value.id]
            : undefined;
        if (currentValidation && !currentValidation.isValid)
          return failure("Current step has validation errors");
      }

      return success(true);
    }
    case "COMPLETE_STEP": {
      const stepToComplete =
        (action.payload as string) ||
        (state !== "RESET_FORM" ? state.data.currentStepId : "");
      const stepValidation =
        state !== "RESET_FORM"
          ? state.data.validationResults[stepToComplete]
          : undefined;
      if (stepValidation && !stepValidation.isValid)
        return failure("Cannot complete step with validation errors");
      return success(true);
    }
    default:
      return success(true);
  }
});

// ============================================================================
// CONTEXT CREATION
// ============================================================================

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

export const MultistepContext: React.Context<MultistepState> = (
  contextResult as any
).Context;
export const BaseMultistepProvider = (contextResult as any).Provider;
export const useMultistepContext = (contextResult as any).useContext;
export const useMultistepContextResult = (contextResult as any)
  .useContextResult;
export const useMultistepSelector = (contextResult as any).useSelector;
export const useMultistepActions = (contextResult as any).useActions;

// ============================================================================
// ENHANCED PROVIDER WITH PROPS
// ============================================================================

export const MultistepProvider: React.FC<MultistepProviderProps> = ({
  steps,
  children,
  initialStepIndex = 0,
  initialFormContext = {},
}) => {
  const initialData = React.useMemo(() => {
    const state = createInitialState(steps);
    return {
      ...(state !== "RESET_FORM" ? state : {}),
      data: {
        // removed, already spread above
        currentStepIndex: Math.max(
          0,
          Math.min(initialStepIndex, steps.length - 1)
        ),
        formContext: initialFormContext,
      },
    };
  }, [steps, initialStepIndex, initialFormContext]);

  return (
    <BaseMultistepProvider initialState={initialData}>
      {children}
    </BaseMultistepProvider>
  );
};

// ============================================================================
// ENHANCED HOOKS FOR MULTISTEP OPERATIONS
// ============================================================================

/**
 * Hook for step data management
 */
export const useStepData = () => {
  const actions = useMultistepActions();
  // Type-safe context access
  const stepData = useMultistepSelector((state: MultistepState) =>
    state !== "RESET_FORM" ? state.data.stepData : undefined
  );
  const currentStepId = useMultistepSelector((state: MultistepState) =>
    state !== "RESET_FORM" ? state.data.currentStepId : undefined
  );

  const setStepData = React.useCallback(
    (stepId: string, data: unknown) => {
      const safeActions = actions._tag === "Some" && actions.value;
      if (safeActions) {
        return safeActions.dispatchSafe({
          type: "SET_STEP_DATA",
          payload: { stepId, data },
        });
      }
      return failure(new Error("Multistep context not available"));
    },
    [actions]
  );

  const updateStepData = React.useCallback(
    (stepId: string, data: unknown) => {
      const safeActions = actions._tag === "Some" && actions.value;
      if (safeActions) {
        return safeActions.dispatchSafe({
          type: "UPDATE_STEP_DATA",
          payload: { stepId, data },
        });
      }
      return failure(new Error("Multistep context not available"));
    },
    [actions]
  );

  const clearStepData = React.useCallback(
    (stepId: string) => {
      const safeActions = actions._tag === "Some" && actions.value;
      if (safeActions) {
        return safeActions.dispatchSafe({
          type: "CLEAR_STEP_DATA",
          payload: stepId,
        });
      }
      return failure(new Error("Multistep context not available"));
    },
    [actions]
  );

  const getCurrentStepData = React.useCallback(() => {
    if (!currentStepId) return null;
    return stepData[currentStepId] ?? null;
  }, [stepData, currentStepId]);

  const getStepData = React.useCallback(
    (stepId: string) => {
      return stepData[stepId] ?? null;
    },
    [stepData]
  );

  return {
    stepData,
    setStepData,
    updateStepData,
    clearStepData,
    getCurrentStepData,
    getStepData,
  };
};

/**
 * Hook for step validation
 */
export const useStepValidation = () => {
  const actions = useMultistepActions();
  // Type-safe context access
  const validationResults = useMultistepSelector((state: MultistepState) =>
    state !== "RESET_FORM" ? state.data.validationResults : undefined
  );
  const currentStepId = useMultistepSelector((state: MultistepState) =>
    state !== "RESET_FORM" ? state.data.currentStepId : undefined
  );
  // Unwrap Maybe for steps
  const maybeSteps = useMultistepSelector((state: MultistepState) =>
    state !== "RESET_FORM" ? state.data.steps : []
  );
  const steps = Array.isArray(maybeSteps) ? maybeSteps : [];
  const stepData = useMultistepSelector((state: MultistepState) =>
    state !== "RESET_FORM" ? state.data.stepData : undefined
  );

  // Validate a single step using pure utility
  const validateStepAction = React.useCallback(
    (stepId: string, data?: unknown) => {
      const safeActions = actions._tag === "Some" && actions.value;
      if (!safeActions)
        return failure(new Error("Multistep context not available"));
      const step = steps.find((s: StepDefinition) => s.id === stepId);
      if (!step)
        return failure(new Error(`Step with id "${stepId}" not found`));
      const validationResult = validateStep(step, data ?? stepData[stepId]);
      return safeActions.dispatchSafe({
        type: "VALIDATE_STEP",
        payload: { stepId, data },
      });
    },
    [actions, steps, stepData]
  );

  // Validate all steps
  const validateAllSteps = React.useCallback(() => {
    const safeActions = actions._tag === "Some" && actions.value;
    if (!safeActions)
      return failure(new Error("Multistep context not available"));
    return safeActions.dispatchSafe({ type: "VALIDATE_ALL_STEPS" });
  }, [actions]);

  // Get validation result for current step
  const getCurrentStepValidation = React.useCallback(() => {
    if (!currentStepId) return null;
    return validationResults[currentStepId] ?? null;
  }, [validationResults, currentStepId]);

  // Get validation result for a specific step
  const getStepValidation = React.useCallback(
    (stepId: string) => {
      return validationResults[stepId] ?? null;
    },
    [validationResults]
  );

  // Computed values
  const hasValidationErrors = React.useMemo(() => {
    const results = Object.values(validationResults) as StepValidationResult[];
    return results.some((result) => !result.isValid);
  }, [validationResults]);

  // Computed: are all steps valid?
  const allStepsValid = React.useMemo(() => {
    const results = Object.values(validationResults) as StepValidationResult[];
    return results.every((result) => result.isValid);
  }, [validationResults]);

  return {
    validationResults,
    validateStep: validateStepAction,
    validateAllSteps,
    getCurrentStepValidation,
    getStepValidation,
    hasValidationErrors,
    allStepsValid,
  };
};

/**
 * Hook for step navigation
 */
export function useStepNavigation(): Result<
  {
    currentStepIndex: number;
    currentStepId: string;
    currentStep: StepDefinition | null;
    canGoBack: boolean;
    canGoNext: boolean;
    canComplete: boolean;
    progress: number;
    goToNextStep: () => Result<{ type: string; payload?: unknown }, string>;
    goToPreviousStep: () => { type: string };
    jumpToStep: (
      stepId: string
    ) => Result<{ type: string; payload?: unknown }, string>;
    goToStep: (
      stepIndex: number
    ) => Result<{ type: string; payload?: unknown }, string>;
    stepCount: number;
  },
  Error
> {
  // Use selector to get state data (unwrap Maybe)
  // Selector returns Maybe<MultistepState>, need .value.data
  const maybeData = useMultistepSelector((state: MultistepState) => state);
  const actions = useMultistepActions();
  if (
    !maybeData ||
    maybeData._tag !== "Some" ||
    !maybeData.value ||
    !maybeData.value.data ||
    !Array.isArray(maybeData.value.data.steps)
  ) {
    // Debug output for context issues
    // eslint-disable-next-line no-console
    console.error(
      "useStepNavigation: state data is missing or invalid",
      maybeData
    );
    return failure(new Error("Multistep state data not available"));
  }
  const data = maybeData.value.data;

  // Debug output for steps and state
  // eslint-disable-next-line no-console
  console.log("useStepNavigation: steps", data.steps);
  // eslint-disable-next-line no-console
  console.log("useStepNavigation: currentStepIndex", data.currentStepIndex);
  const steps = data.steps;
  const currentStepIndex = data.currentStepIndex;
  const currentStep =
    Array.isArray(steps) && typeof currentStepIndex === "number"
      ? steps[currentStepIndex] ?? null
      : null;

  // Navigation actions now dispatch
  const goToNextStep = React.useCallback((): Result<
    { type: string },
    string
  > => {
    const safeActions = actions._tag === "Some" && actions.value;
    if (!safeActions) return failure("Multistep context not available");
    const nextIndex = currentStepIndex + 1;
    const navResult = canNavigateToStep(steps, nextIndex, data.completedSteps);
    if (navResult._tag === "Failure") return failure(navResult.error);
    safeActions.dispatchSafe({ type: "GO_TO_NEXT_STEP" });
    return success({ type: "GO_TO_NEXT_STEP" });
  }, [actions, currentStepIndex, steps, data.completedSteps]);

  const goToPreviousStep = React.useCallback(() => {
    const safeActions = actions._tag === "Some" && actions.value;
    if (!safeActions) return { type: "GO_TO_PREVIOUS_STEP" };
    safeActions.dispatchSafe({ type: "GO_TO_PREVIOUS_STEP" });
    return { type: "GO_TO_PREVIOUS_STEP" };
  }, [actions]);

  const jumpToStep = React.useCallback(
    (stepId: string): Result<{ type: string; payload: string }, string> => {
      const safeActions = actions._tag === "Some" && actions.value;
      if (!safeActions) return failure("Multistep context not available");
      const jumpIndex = findStepIndex(steps, stepId);
      const navResult = canNavigateToStep(
        steps,
        jumpIndex,
        data.completedSteps
      );
      if (navResult._tag === "Failure") return failure(navResult.error);
      safeActions.dispatchSafe({ type: "JUMP_TO_STEP", payload: stepId });
      return success({ type: "JUMP_TO_STEP", payload: stepId });
    },
    [actions, steps, data.completedSteps]
  );

  const goToStep = React.useCallback(
    (stepIndex: number): Result<{ type: string; payload: number }, string> => {
      const safeActions = actions._tag === "Some" && actions.value;
      if (!safeActions) return failure("Multistep context not available");
      const navResult = canNavigateToStep(
        steps,
        stepIndex,
        data.completedSteps
      );
      if (navResult._tag === "Failure") return failure(navResult.error);
      safeActions.dispatchSafe({ type: "GO_TO_STEP", payload: stepIndex });
      return success({ type: "GO_TO_STEP", payload: stepIndex });
    },
    [actions, steps, data.completedSteps]
  );

  const progress = React.useMemo(() => {
    return steps.length > 0 ? (currentStepIndex + 1) / steps.length : 0;
  }, [steps, currentStepIndex]);
  const stepCount = steps.length;

  return success({
    currentStepIndex,
    currentStepId: data.currentStepId,
    currentStep,
    canGoBack: data.canGoBack,
    canGoNext: data.canGoNext,
    canComplete: data.canComplete,
    progress,
    goToNextStep,
    goToPreviousStep,
    jumpToStep,
    goToStep,
    stepCount,
  });
}

const EnhancedMultistepContextExports = {
  MultistepProvider,
  useMultistepContext,
  useMultistepContextResult,
  useMultistepSelector,
  useMultistepActions,
  useStepNavigation,
  useStepData,
  useStepValidation,
};

export default EnhancedMultistepContextExports;
