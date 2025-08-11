/**
 * Multistep reducer and initial state for multistep form navigation.
 * All logic is pure, functional, and type-safe.
 */
import type {
  MultistepState,
  MultistepAction,
  StepDefinition,
  StepValidationResult,
  NavigationHistoryEntry,
  MultistepData,
} from "./types";
import { Result, success, failure, none } from "@/lib/fp-utils";
import {
  canNavigateToStep,
  findStepIndex,
  isStepOptional,
  validateStep,
} from "./multistepUtils";

/**
 * Creates the initial state for the multistep context.
 * @param steps Array of step definitions
 * @returns MultistepState
 */
export const createInitialState = (
  steps: StepDefinition[] = []
): MultistepState => {
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

/**
 * Reducer for multistep context.
 * Handles all state transitions for multistep form navigation.
 * @param state Current MultistepState
 * @param action MultistepAction to process
 * @returns Result<MultistepState, Error>
 */
export const multistepReducer = (
  state: MultistepState,
  action: MultistepAction
): Result<MultistepState, Error> => {
  // Defensive: Only allow RESET_FORM if state is RESET_FORM
  if (state === "RESET_FORM") {
    if (action.type === "RESET_FORM") {
      const resetSteps = (action.payload as StepDefinition[]) || [];
      return success(createInitialState(resetSteps));
    }
    return failure(
      new Error("State is RESET_FORM. Only RESET_FORM action is allowed.")
    );
  }

  // Destructure data for readability
  const { data } = state;

  switch (action.type) {
    case "SET_STEPS": {
      if (!Array.isArray(action.payload))
        return failure(new Error("Steps must be an array"));
      const newSteps = action.payload as StepDefinition[];
      const newCurrentIndex = newSteps.length > 0 ? 0 : -1;
      return success({
        ...state,
        data: {
          ...data,
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
        data.steps,
        targetIndex,
        data.completedSteps
      );
      if (navigationCheck._tag === "Failure")
        return failure(new Error(navigationCheck.error));
      const targetStep = data.steps[targetIndex];
      return success({
        ...state,
        data: {
          ...data,
          currentStepIndex: targetIndex,
          currentStepId: targetStep.id,
          canGoBack: targetIndex > 0,
          canGoNext: targetIndex < data.steps.length - 1,
          canComplete: data.completedSteps.size === data.steps.length - 1,
          navigationHistory: [
            ...data.navigationHistory,
            {
              fromStepId: data.currentStepId,
              toStepId: targetStep.id,
              timestamp: Date.now(),
              action: "jump",
            },
          ],
        },
      });
    }

    case "GO_TO_NEXT_STEP": {
      const nextIndex = data.currentStepIndex + 1;
      if (nextIndex >= data.steps.length)
        return failure(new Error("Already at the last step"));
      const nextNavigationCheck = canNavigateToStep(
        data.steps,
        nextIndex,
        data.completedSteps
      );
      if (nextNavigationCheck._tag === "Failure")
        return failure(new Error(nextNavigationCheck.error));
      const nextStep = data.steps[nextIndex];
      return success({
        ...state,
        data: {
          ...data,
          currentStepIndex: nextIndex,
          currentStepId: nextStep.id,
          canGoBack: true,
          canGoNext: nextIndex < data.steps.length - 1,
          canComplete: data.completedSteps.size === data.steps.length - 1,
          navigationHistory: [
            ...data.navigationHistory,
            {
              fromStepId: data.currentStepId,
              toStepId: nextStep.id,
              timestamp: Date.now(),
              action: "next",
            },
          ],
        },
      });
    }

    case "GO_TO_PREVIOUS_STEP": {
      const prevIndex = data.currentStepIndex - 1;
      if (prevIndex < 0) return failure(new Error("Already at the first step"));
      const prevStep = data.steps[prevIndex];
      return success({
        ...state,
        data: {
          ...data,
          currentStepIndex: prevIndex,
          currentStepId: prevStep.id,
          canGoBack: prevIndex > 0,
          canGoNext: true,
          canComplete: false,
          navigationHistory: [
            ...data.navigationHistory,
            {
              fromStepId: data.currentStepId,
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
      const jumpIndex = findStepIndex(data.steps, jumpStepId);
      if (jumpIndex === -1)
        return failure(new Error(`Step with id "${jumpStepId}" not found`));
      const jumpNavigationCheck = canNavigateToStep(
        data.steps,
        jumpIndex,
        data.completedSteps
      );
      if (jumpNavigationCheck._tag === "Failure")
        return failure(new Error(jumpNavigationCheck.error));
      return success({
        ...state,
        data: {
          ...data,
          currentStepIndex: jumpIndex,
          currentStepId: jumpStepId,
          canGoBack: jumpIndex > 0,
          canGoNext: jumpIndex < data.steps.length - 1,
          canComplete: data.completedSteps.size === data.steps.length - 1,
          navigationHistory: [
            ...data.navigationHistory,
            {
              fromStepId: data.currentStepId,
              toStepId: jumpStepId,
              timestamp: Date.now(),
              action: "jump",
            },
          ],
        },
      });
    }

    case "COMPLETE_STEP": {
      const completeStepId = (action.payload as string) || data.currentStepId;
      const newCompletedSteps = new Set(data.completedSteps);
      newCompletedSteps.add(completeStepId);
      return success({
        ...state,
        data: {
          ...data,
          completedSteps: newCompletedSteps,
          canComplete: newCompletedSteps.size === data.steps.length,
        },
      });
    }

    case "SKIP_STEP": {
      const skipStepId = (action.payload as string) || data.currentStepId;
      const stepToSkip = data.steps.find(
        (s: StepDefinition) => s.id === skipStepId
      );
      if (!isStepOptional(stepToSkip!))
        return failure(new Error("Cannot skip required step"));
      const newSkippedSteps = new Set(data.skippedSteps);
      newSkippedSteps.add(skipStepId);
      return success({
        ...state,
        data: {
          ...data,
          skippedSteps: newSkippedSteps,
          navigationHistory: [
            ...data.navigationHistory,
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
      const newUnskippedSteps = new Set(data.skippedSteps);
      newUnskippedSteps.delete(unskipStepId);
      return success({
        ...state,
        data: {
          ...data,
          skippedSteps: newUnskippedSteps,
        },
      });
    }

    case "SET_STEP_DATA": {
      const { stepId, data: stepDataValue } = action.payload as {
        stepId: string;
        data: unknown;
      };
      if (!stepId)
        return failure(new Error("Step ID required for setting data"));
      return success({
        ...state,
        data: {
          ...data,
          stepData: {
            ...data.stepData,
            [stepId]: stepDataValue,
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
          ...data,
          stepData: {
            ...data.stepData,
            [updateStepId]: {
              ...(data.stepData[updateStepId] ?? {}),
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
      const { [clearStepId]: _, ...remainingStepData } = data.stepData;
      return success({
        ...state,
        data: {
          ...data,
          stepData: remainingStepData,
        },
      });
    }

    case "VALIDATE_STEP": {
      const { stepId: validateStepId, data: validateData } = action.payload as {
        stepId: string;
        data?: unknown;
      };
      const stepToValidate = data.steps.find(
        (s: StepDefinition) => s.id === validateStepId
      );
      if (!stepToValidate)
        return failure(new Error(`Step with id "${validateStepId}" not found`));
      const validationResult = validateStep(
        stepToValidate,
        validateData ?? data.stepData[validateStepId]
      );
      return success({
        ...state,
        data: {
          ...data,
          validationResults: {
            ...data.validationResults,
            [validateStepId]: validationResult,
          },
        },
      });
    }

    case "VALIDATE_ALL_STEPS": {
      const allValidationResults: Record<string, StepValidationResult> = {};
      for (const step of data.steps) {
        allValidationResults[step.id] = validateStep(
          step,
          data.stepData[step.id]
        );
      }
      return success({
        ...state,
        data: {
          ...data,
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
          ...data,
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
          ...data,
          formContext: {
            ...data.formContext,
            ...(action.payload as Record<string, unknown>),
          },
        },
      });
    }

    case "RESET_FORM": {
      const resetSteps = (action.payload as StepDefinition[]) || data.steps;
      return success(createInitialState(resetSteps));
    }

    case "ADD_NAVIGATION_ENTRY": {
      if (!action.payload || typeof action.payload !== "object")
        return failure(new Error("Navigation entry must be an object"));
      return success({
        ...state,
        data: {
          ...data,
          navigationHistory: [
            ...data.navigationHistory,
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
