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
// TYPES AND INTERFACES
// ============================================================================

export interface StepDefinition {
  id: string;
  title: string;
  description?: string;
  isOptional?: boolean;
  validationRules?: ValidationRule[];
  dependencies?: string[];
  metadata?: Record<string, unknown>;
}

export interface ValidationRule {
  id: string;
  message: string;
  validator: (data: unknown) => boolean;
}

export interface StepValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface MultistepState
  extends FunctionalState<{
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
  }> {}

export interface NavigationHistoryEntry {
  fromStepId: string;
  toStepId: string;
  timestamp: number;
  action: "next" | "back" | "jump" | "skip";
  data?: unknown;
}

export interface MultistepAction extends FunctionalAction {
  type:
    | "SET_STEPS"
    | "GO_TO_STEP"
    | "GO_TO_NEXT_STEP"
    | "GO_TO_PREVIOUS_STEP"
    | "JUMP_TO_STEP"
    | "COMPLETE_STEP"
    | "SKIP_STEP"
    | "UNSKIP_STEP"
    | "SET_STEP_DATA"
    | "UPDATE_STEP_DATA"
    | "CLEAR_STEP_DATA"
    | "VALIDATE_STEP"
    | "VALIDATE_ALL_STEPS"
    | "SET_FORM_CONTEXT"
    | "UPDATE_FORM_CONTEXT"
    | "RESET_FORM"
    | "ADD_NAVIGATION_ENTRY";
  payload?: unknown;
}

// ============================================================================
// UTILITY FUNCTIONS (PURE, FUNCTIONAL)
// ============================================================================

const findStepIndex = (steps: StepDefinition[], stepId: string): number =>
  steps.findIndex((step) => step.id === stepId);

const getCurrentStep = (
  steps: StepDefinition[],
  currentStepIndex: number
): Maybe<StepDefinition> =>
  currentStepIndex >= 0 && currentStepIndex < steps.length
    ? some(steps[currentStepIndex])
    : none;

const validateStep = (
  step: StepDefinition,
  stepData: unknown
): StepValidationResult => {
  const errors: string[] = [];
  if (!step.validationRules) return { isValid: true, errors };
  for (const rule of step.validationRules) {
    try {
      if (!rule.validator(stepData)) errors.push(rule.message);
    } catch (error) {
      errors.push(
        `Validation error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
  return { isValid: errors.length === 0, errors };
};

const areStepDependenciesMet = (
  step: StepDefinition,
  completedSteps: Set<string>,
  steps: StepDefinition[]
): Result<boolean, string> => {
  if (!step.dependencies) return success(true);
  for (const depId of step.dependencies) {
    if (!completedSteps.has(depId)) {
      const depStep = steps.find((s) => s.id === depId);
      return failure(
        `Step "${step.title}" requires "${
          depStep?.title || depId
        }" to be completed first`
      );
    }
  }
  return success(true);
};

const isStepOptional = (step: StepDefinition): boolean =>
  Boolean(step.isOptional);

const canNavigateToStep = (
  steps: StepDefinition[],
  targetStepIndex: number,
  completedSteps: Set<string>
): Result<boolean, string> => {
  if (targetStepIndex < 0 || targetStepIndex >= steps.length)
    return failure("Invalid step index");
  const targetStep = steps[targetStepIndex];
  return areStepDependenciesMet(targetStep, completedSteps, steps);
};

// ============================================================================
// INITIAL STATE AND REDUCER
// ============================================================================

const createInitialState = (steps: StepDefinition[] = []): MultistepState => {
  const currentStepIndex = steps.length > 0 ? 0 : -1;
  return {
    data: {
      steps,
      currentStepIndex,
      currentStepId: steps[currentStepIndex]?.id ?? "",
      completedSteps: new Set(),
      skippedSteps: new Set(),
      stepData: {},
      validationResults: {},
      canGoBack: false,
      canGoNext: steps.length > 1,
      canComplete: false,
      navigationHistory: [],
      formContext: {},
    },
    loading: false,
    error: none,
    lastUpdated: Date.now(),
    version: 0,
  };
};

const multistepReducer = (
  state: MultistepState,
  action: MultistepAction
): Result<MultistepState, Error> => {
  switch (action.type) {
    case "SET_STEPS": {
      if (!Array.isArray(action.payload))
        return failure(new Error("Steps must be an array"));
      const newSteps = action.payload as StepDefinition[];
      const newCurrentIndex = newSteps.length > 0 ? 0 : -1;
      return success({
        ...state,
        data: {
          ...state.data,
          steps: newSteps,
          currentStepIndex: newCurrentIndex,
          currentStepId: newSteps[newCurrentIndex]?.id ?? "",
          canGoBack: false,
          canGoNext: newSteps.length > 1,
          canComplete: false,
        },
      });
    }
    case "GO_TO_STEP": {
      const targetIndex = action.payload as number;
      const navigationCheck = canNavigateToStep(
        state.data.steps,
        targetIndex,
        state.data.completedSteps
      );
      if (navigationCheck._tag === "Failure")
        return failure(new Error(navigationCheck.error));
      const targetStep = state.data.steps[targetIndex];

      return success({
        ...state,
        data: {
          ...state.data,
          currentStepIndex: targetIndex,
          currentStepId: targetStep.id,
          canGoBack: targetIndex > 0,
          canGoNext: targetIndex < state.data.steps.length - 1,
          canComplete:
            state.data.completedSteps.size === state.data.steps.length - 1,
          navigationHistory: [
            ...state.data.navigationHistory,
            {
              fromStepId: state.data.currentStepId,
              toStepId: targetStep.id,
              timestamp: Date.now(),
              action: "jump",
            },
          ],
        },
      });
    }
    case "GO_TO_NEXT_STEP": {
      const nextIndex = state.data.currentStepIndex + 1;
      if (nextIndex >= state.data.steps.length)
        return failure(new Error("Already at the last step"));
      const nextNavigationCheck = canNavigateToStep(
        state.data.steps,
        nextIndex,
        state.data.completedSteps
      );
      if (nextNavigationCheck._tag === "Failure")
        return failure(new Error(nextNavigationCheck.error));
      const nextStep = state.data.steps[nextIndex];

      return success({
        ...state,
        data: {
          ...state.data,
          currentStepIndex: nextIndex,
          currentStepId: nextStep.id,
          canGoBack: true,
          canGoNext: nextIndex < state.data.steps.length - 1,
          canComplete:
            state.data.completedSteps.size === state.data.steps.length - 1,
          navigationHistory: [
            ...state.data.navigationHistory,
            {
              fromStepId: state.data.currentStepId,
              toStepId: nextStep.id,
              timestamp: Date.now(),
              action: "next",
            },
          ],
        },
      });
    }
    case "GO_TO_PREVIOUS_STEP": {
      const prevIndex = state.data.currentStepIndex - 1;
      if (prevIndex < 0) return failure(new Error("Already at the first step"));
      const prevStep = state.data.steps[prevIndex];

      return success({
        ...state,
        data: {
          ...state.data,
          currentStepIndex: prevIndex,
          currentStepId: prevStep.id,
          canGoBack: prevIndex > 0,
          canGoNext: true,
          canComplete: false,
          navigationHistory: [
            ...state.data.navigationHistory,
            {
              fromStepId: state.data.currentStepId,
              toStepId: prevStep.id,
              timestamp: Date.now(),
              action: "back",
            },
          ],
        },
      });
    }
    case "JUMP_TO_STEP": {
      const jumpStepId = action.payload as string;
      const jumpIndex = findStepIndex(state.data.steps, jumpStepId);
      if (jumpIndex === -1)
        return failure(new Error(`Step with id "${jumpStepId}" not found`));
      const jumpNavigationCheck = canNavigateToStep(
        state.data.steps,
        jumpIndex,
        state.data.completedSteps
      );
      if (jumpNavigationCheck._tag === "Failure")
        return failure(new Error(jumpNavigationCheck.error));

      return success({
        ...state,
        data: {
          ...state.data,
          currentStepIndex: jumpIndex,
          currentStepId: jumpStepId,
          canGoBack: jumpIndex > 0,
          canGoNext: jumpIndex < state.data.steps.length - 1,
          canComplete:
            state.data.completedSteps.size === state.data.steps.length - 1,
          navigationHistory: [
            ...state.data.navigationHistory,
            {
              fromStepId: state.data.currentStepId,
              toStepId: jumpStepId,
              timestamp: Date.now(),
              action: "jump",
            },
          ],
        },
      });
    }
    case "COMPLETE_STEP": {
      const completeStepId =
        (action.payload as string) || state.data.currentStepId;
      const newCompletedSteps = new Set(state.data.completedSteps);
      newCompletedSteps.add(completeStepId);

      return success({
        ...state,
        data: {
          ...state.data,
          completedSteps: newCompletedSteps,
          canComplete: newCompletedSteps.size === state.data.steps.length,
        },
      });
    }
    case "SKIP_STEP": {
      const skipStepId = (action.payload as string) || state.data.currentStepId;
      const stepToSkip = state.data.steps.find((s) => s.id === skipStepId);
      if (!isStepOptional(stepToSkip!))
        return failure(new Error("Cannot skip required step"));
      const newSkippedSteps = new Set(state.data.skippedSteps);
      newSkippedSteps.add(skipStepId);

      return success({
        ...state,
        data: {
          ...state.data,
          skippedSteps: newSkippedSteps,
          navigationHistory: [
            ...state.data.navigationHistory,
            {
              fromStepId: skipStepId,
              toStepId: skipStepId,
              timestamp: Date.now(),
              action: "skip",
            },
          ],
        },
      });
    }
    case "UNSKIP_STEP": {
      const unskipStepId = action.payload as string;
      const newUnskippedSteps = new Set(state.data.skippedSteps);
      newUnskippedSteps.delete(unskipStepId);

      return success({
        ...state,
        data: {
          ...state.data,
          skippedSteps: newUnskippedSteps,
        },
      });
    }
    case "SET_STEP_DATA": {
      const { stepId, data } = action.payload as {
        stepId: string;
        data: unknown;
      };
      if (!stepId)
        return failure(new Error("Step ID required for setting data"));

      return success({
        ...state,
        data: {
          ...state.data,
          stepData: {
            ...state.data.stepData,
            [stepId]: data,
          },
        },
      });
    }
    case "UPDATE_STEP_DATA": {
      const { stepId: updateStepId, data: updateData } = action.payload as {
        stepId: string;
        data: unknown;
      };
      if (!updateStepId)
        return failure(new Error("Step ID required for updating data"));

      return success({
        ...state,
        data: {
          ...state.data,
          stepData: {
            ...state.data.stepData,
            [updateStepId]: {
              ...(state.data.stepData[updateStepId] ?? {}),
              ...(typeof updateData === "object" && updateData !== null
                ? updateData
                : {}),
            },
          },
        },
      });
    }
    case "CLEAR_STEP_DATA": {
      const clearStepId = action.payload as string;
      if (!clearStepId)
        return failure(new Error("Step ID required for clearing data"));
      const { [clearStepId]: _, ...remainingStepData } = state.data.stepData;

      return success({
        ...state,
        data: {
          ...state.data,
          stepData: remainingStepData,
        },
      });
    }
    case "VALIDATE_STEP": {
      const { stepId: validateStepId, data: validateData } = action.payload as {
        stepId: string;
        data?: unknown;
      };
      const stepToValidate = state.data.steps.find(
        (s) => s.id === validateStepId
      );
      if (!stepToValidate)
        return failure(new Error(`Step with id "${validateStepId}" not found`));
      const validationResult = validateStep(
        stepToValidate,
        validateData ?? state.data.stepData[validateStepId]
      );

      return success({
        ...state,
        data: {
          ...state.data,
          validationResults: {
            ...state.data.validationResults,
            [validateStepId]: validationResult,
          },
        },
      });
    }
    case "VALIDATE_ALL_STEPS": {
      const allValidationResults: Record<string, StepValidationResult> = {};
      for (const step of state.data.steps) {
        allValidationResults[step.id] = validateStep(
          step,
          state.data.stepData[step.id]
        );
      }

      return success({
        ...state,
        data: {
          ...state.data,
          validationResults: allValidationResults,
        },
      });
    }
    case "SET_FORM_CONTEXT": {
      if (!action.payload || typeof action.payload !== "object")
        return failure(new Error("Form context must be an object"));

      return success({
        ...state,
        data: {
          ...state.data,
          formContext: action.payload as Record<string, unknown>,
        },
      });
    }
    case "UPDATE_FORM_CONTEXT": {
      if (!action.payload || typeof action.payload !== "object")
        return failure(new Error("Form context update must be an object"));

      return success({
        ...state,
        data: {
          ...state.data,
          formContext: {
            ...state.data.formContext,
            ...(action.payload as Record<string, unknown>),
          },
        },
      });
    }
    case "RESET_FORM": {
      const resetSteps =
        (action.payload as StepDefinition[]) || state.data.steps;

      return success(createInitialState(resetSteps));
    }
    case "ADD_NAVIGATION_ENTRY": {
      if (!action.payload || typeof action.payload !== "object")
        return failure(new Error("Navigation entry must be an object"));

      return success({
        ...state,
        data: {
          ...state.data,
          navigationHistory: [
            ...state.data.navigationHistory,
            {
              ...(action.payload as NavigationHistoryEntry),
              timestamp: Date.now(),
            },
          ],
        },
      });
    }
    default:
      return failure(new Error(`Unknown action type: ${action.type}`));
  }
};

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
        state.data.steps,
        state.data.currentStepIndex
      );
      if (currentStep._tag === "Some") {
        const currentValidation =
          state.data.validationResults[currentStep.value.id];
        if (currentValidation && !currentValidation.isValid)
          return failure("Current step has validation errors");
      }

      return success(true);
    }
    case "COMPLETE_STEP": {
      const stepToComplete =
        (action.payload as string) || state.data.currentStepId;
      const stepValidation = state.data.validationResults[stepToComplete];
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

interface MultistepProviderProps {
  steps: StepDefinition[];
  children: React.ReactNode;
  initialStepIndex?: number;
  initialFormContext?: Record<string, unknown>;
}

export const MultistepProvider: React.FC<MultistepProviderProps> = ({
  steps,
  children,
  initialStepIndex = 0,
  initialFormContext = {},
}) => {
  const initialData = React.useMemo(() => {
    const state = createInitialState(steps);
    return {
      ...state,
      data: {
        ...state.data,
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
  const stepData = useMultistepSelector(
    (state: MultistepState["data"]) => state.stepData
  );
  const currentStepId = useMultistepSelector(
    (state: MultistepState["data"]) => state.currentStepId
  );

  const setStepData = React.useCallback(
    (stepId: string, data: unknown) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
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
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
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
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
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
  const validationResults = useMultistepSelector(
    (state: MultistepState["data"]) => state.validationResults
  );
  const currentStepId = useMultistepSelector(
    (state: MultistepState["data"]) => state.currentStepId
  );
  // Unwrap Maybe for steps
  const maybeSteps = useMultistepSelector(
    (state: MultistepState) => state.data.steps
  );
  const steps = Array.isArray(maybeSteps) ? maybeSteps : [];
  const stepData = useMultistepSelector(
    (state: MultistepState["data"]) => state.stepData
  );

  // Validate a single step using pure utility
  const validateStepAction = React.useCallback(
    (stepId: string, data?: unknown) => {
      if (actions._tag !== "Some")
        return failure(new Error("Multistep context not available"));
      const step = steps.find((s: StepDefinition) => s.id === stepId);
      if (!step)
        return failure(new Error(`Step with id "${stepId}" not found`));
      const validationResult = validateStep(step, data ?? stepData[stepId]);
      return actions.value.dispatchSafe({
        type: "VALIDATE_STEP",
        payload: { stepId, data },
      });
    },
    [actions, steps, stepData]
  );

  // Validate all steps
  const validateAllSteps = React.useCallback(() => {
    if (actions._tag !== "Some")
      return failure(new Error("Multistep context not available"));
    return actions.value.dispatchSafe({ type: "VALIDATE_ALL_STEPS" });
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
    if (actions._tag !== "Some")
      return failure("Multistep context not available");
    const nextIndex = currentStepIndex + 1;
    const navResult = canNavigateToStep(steps, nextIndex, data.completedSteps);
    if (navResult._tag === "Failure") return failure(navResult.error);
    actions.value.dispatchSafe({ type: "GO_TO_NEXT_STEP" });
    return success({ type: "GO_TO_NEXT_STEP" });
  }, [actions, currentStepIndex, steps, data.completedSteps]);

  const goToPreviousStep = React.useCallback(() => {
    if (actions._tag !== "Some") return { type: "GO_TO_PREVIOUS_STEP" };
    actions.value.dispatchSafe({ type: "GO_TO_PREVIOUS_STEP" });
    return { type: "GO_TO_PREVIOUS_STEP" };
  }, [actions]);

  const jumpToStep = React.useCallback(
    (stepId: string): Result<{ type: string; payload: string }, string> => {
      if (actions._tag !== "Some")
        return failure("Multistep context not available");
      const jumpIndex = findStepIndex(steps, stepId);
      const navResult = canNavigateToStep(
        steps,
        jumpIndex,
        data.completedSteps
      );
      if (navResult._tag === "Failure") return failure(navResult.error);
      actions.value.dispatchSafe({ type: "JUMP_TO_STEP", payload: stepId });
      return success({ type: "JUMP_TO_STEP", payload: stepId });
    },
    [actions, steps, data.completedSteps]
  );

  const goToStep = React.useCallback(
    (stepIndex: number): Result<{ type: string; payload: number }, string> => {
      if (actions._tag !== "Some")
        return failure("Multistep context not available");
      const navResult = canNavigateToStep(
        steps,
        stepIndex,
        data.completedSteps
      );
      if (navResult._tag === "Failure") return failure(navResult.error);
      actions.value.dispatchSafe({ type: "GO_TO_STEP", payload: stepIndex });
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
