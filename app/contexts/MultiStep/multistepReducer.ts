/**
 * Reducer for MultistepContext
 * Handles state transitions for multistep form navigation
 * @param state - Current MultistepState
 * @param action - MultistepAction to process
 * @returns Result<MultistepState, Error>
 */
import { MultistepState } from "./MultistepContext";
import {
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

export const multistepReducer = (
  state: MultistepState,
  action: MultistepAction
): Result<MultistepState, Error> => {
  // Defensive guard: if state is RESET_FORM, only allow RESET_FORM action
  if (state === "RESET_FORM") {
    if (action.type === "RESET_FORM") {
      const resetSteps = (action.payload as StepDefinition[]) || [];
      return success(createInitialState(resetSteps));
    }
    // For any other action, return failure or re-initialize
    return failure(
      new Error("State is RESET_FORM. Only RESET_FORM action is allowed.")
    );
  }
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
      const stepToSkip = state.data.steps.find(
        (s: StepDefinition) => s.id === skipStepId
      );
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
        (s: StepDefinition) => s.id === validateStepId
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
