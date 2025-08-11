/**
 * MultistepContext - Provides context, provider, and hooks for multistep form navigation.
 * All types are imported from types.ts for consistency and maintainability.
 */

import React from "react";
import {
  MultistepData,
  MultistepState,
  StepDefinition,
  StepValidationResult,
  NavigationHistoryEntry,
  MultistepProviderProps,
  MultistepAction,
} from "./types";
import {
  findStepIndex,
  getCurrentStep,
  validateStep,
  areStepDependenciesMet,
  isStepOptional,
  canNavigateToStep,
} from "./multistepUtils";
import { createInitialState, multistepReducer } from "./multistepReducer";
import { loggingMiddleware } from "@/lib/fp-contexts";
import { validationMiddleware } from "@/lib/fp-contexts";
import { persistenceMiddleware } from "@/app/middleware/persistenceMiddleware";
import { Result, Maybe, some, none, success, failure } from "@/lib/fp-utils";
import { createFunctionalContext } from "@/lib/fp-contexts";
import {
  selectStepData,
  selectCurrentStepId,
  selectValidationResults,
  selectSteps,
  selectCompletedSteps,
  selectSkippedSteps,
  selectNavigationHistory,
  selectFormContext,
  selectCurrentStepIndex,
  selectCanGoBack,
  selectCanGoNext,
  selectCanComplete,
} from "./multistepSelectors";

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
 * MultistepProvider - Enhanced provider with props for initial steps and form context.
 */
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

/**
 * useStepData - Hook for step data management.
 * Returns step data and actions for setting, updating, and clearing step data.
 */
export const useStepData = () => {
  const actions = useMultistepActions();
  const stepData = useMultistepSelector(selectStepData);
  const currentStepId = useMultistepSelector(selectCurrentStepId);

  /** Sets step data for a given stepId. Returns Result<void, Error>. */
  const setStepData = React.useCallback(
    (stepId: string, data: unknown): Result<void, Error> => {
      const safeActions = actions._tag === "Some" && actions.value;
      if (safeActions) {
        safeActions.dispatchSafe({
          type: "SET_STEP_DATA",
          payload: { stepId, data },
        });
        return success(undefined);
      }
      return failure(new Error("Multistep context not available"));
    },
    [actions]
  );

  /** Updates step data for a given stepId. Returns Result<void, Error>. */
  const updateStepData = React.useCallback(
    (stepId: string, data: unknown): Result<void, Error> => {
      const safeActions = actions._tag === "Some" && actions.value;
      if (safeActions) {
        safeActions.dispatchSafe({
          type: "UPDATE_STEP_DATA",
          payload: { stepId, data },
        });
        return success(undefined);
      }
      return failure(new Error("Multistep context not available"));
    },
    [actions]
  );

  /** Clears step data for a given stepId. Returns Result<void, Error>. */
  const clearStepData = React.useCallback(
    (stepId: string): Result<void, Error> => {
      const safeActions = actions._tag === "Some" && actions.value;
      if (safeActions) {
        safeActions.dispatchSafe({ type: "CLEAR_STEP_DATA", payload: stepId });
        return success(undefined);
      }
      return failure(new Error("Multistep context not available"));
    },
    [actions]
  );

  const getCurrentStepData = React.useCallback(() => {
    if (!currentStepId) return null;
    return stepData?.[currentStepId] ?? null;
  }, [stepData, currentStepId]);

  const getStepData = React.useCallback(
    (stepId: string) => {
      return stepData?.[stepId] ?? null;
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
 * useStepValidation - Hook for step validation management.
 * Returns validation results and actions for validating steps.
 */
export const useStepValidation = () => {
  const actions = useMultistepActions();
  const validationResults = useMultistepSelector(selectValidationResults);
  const currentStepId = useMultistepSelector(selectCurrentStepId);
  const steps = useMultistepSelector(selectSteps);
  const stepData = useMultistepSelector(selectStepData);

  /** Validates a single step by stepId. Returns Result<void, Error>. */
  const validateStepAction = React.useCallback(
    (stepId: string, data?: unknown): Result<void, Error> => {
      const safeActions = actions._tag === "Some" && actions.value;
      if (!safeActions)
        return failure(new Error("Multistep context not available"));
      const step = steps.find((s: StepDefinition) => s.id === stepId);
      if (!step) return failure(new Error("Step not found"));
      validateStep(step, data ?? stepData?.[stepId]);
      safeActions.dispatchSafe({
        type: "VALIDATE_STEP",
        payload: { stepId, data },
      });
      return success(undefined);
    },
    [actions, steps, stepData]
  );

  /** Validates all steps in the form. Returns Result<void, Error>. */
  const validateAllSteps = React.useCallback((): Result<void, Error> => {
    const safeActions = actions._tag === "Some" && actions.value;
    if (!safeActions)
      return failure(new Error("Multistep context not available"));
    safeActions.dispatchSafe({ type: "VALIDATE_ALL_STEPS" });
    return success(undefined);
  }, [actions]);

  const getCurrentStepValidation = React.useCallback(() => {
    if (!currentStepId) return null;
    return validationResults?.[currentStepId] ?? null;
  }, [validationResults, currentStepId]);

  const getStepValidation = React.useCallback(
    (stepId: string) => {
      return validationResults?.[stepId] ?? null;
    },
    [validationResults]
  );

  const hasValidationErrors = React.useMemo(() => {
    const results = Object.values(
      validationResults ?? {}
    ) as StepValidationResult[];
    return results.some((result) => !result.isValid);
  }, [validationResults]);

  const allStepsValid = React.useMemo(() => {
    const results = Object.values(
      validationResults ?? {}
    ) as StepValidationResult[];
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
 * useStepNavigation - Hook for step navigation management.
 * Returns navigation actions and current step info.
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
  const maybeData = useMultistepSelector((state: MultistepState) => state);
  const actions = useMultistepActions();
  if (
    !maybeData ||
    maybeData._tag !== "Some" ||
    !maybeData.value ||
    !maybeData.value.data ||
    !Array.isArray(maybeData.value.data.steps)
  ) {
    console.error(
      "useStepNavigation: state data is missing or invalid",
      maybeData
    );
    return failure(new Error("Multistep state data not available"));
  }
  const data = maybeData.value.data;
  const steps = data.steps;
  const currentStepIndex = data.currentStepIndex;
  const currentStep =
    Array.isArray(steps) && typeof currentStepIndex === "number"
      ? steps[currentStepIndex] ?? null
      : null;

  const goToNextStep = React.useCallback((): Result<
    { type: string },
    string
  > => {
    const safeActions = actions._tag === "Some" && actions.value;
    if (!safeActions) return failure("Navigation context unavailable");
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

/**
 * EnhancedMultistepContextExports - Encapsulated export object for all context APIs.
 */
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
