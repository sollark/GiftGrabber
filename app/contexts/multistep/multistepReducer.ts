/**
 * multistepReducer.ts
 * Purpose: Contains the reducer function for multistep state transitions.
 * Responsibilities: Handles all step-related actions and updates state accordingly.
 * Architecture: Used by MultistepContext to manage step changes in a functional, predictable way.
 */

/**
 * Multistep reducer and initial state for multistep form navigation.
 * All logic is pure, functional, and type-safe.
 * Simplified to core navigation and step data management only.
 */
import type {
  MultistepState,
  MultistepAction,
  StepDefinition,
  MultistepData,
} from "./types";
import { Result, success, failure } from "@/utils/fp";
import {
  canNavigateToStep,
  findStepIndex,
  isStepOptional,
} from "./multistepUtils";

/**
 * Creates the initial state for the multistep context.
 * @param steps Array of step definitions
 * @returns MultistepState with core navigation data
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
      canGoBack: false,
      canGoNext: steps.length > 1,
      canComplete: false,
    },
    loading: false,
    error: { _tag: "None" },
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
      // Handle both index (number) and stepId (string) payloads
      const payload = action.payload;
      let targetIndex: number;

      if (typeof payload === "string") {
        // JUMP_TO_STEP functionality - find by stepId
        targetIndex = findStepIndex(data.steps, payload);
        if (targetIndex === -1)
          return failure(new Error(`Step with id "${payload}" not found`));
      } else if (typeof payload === "number") {
        // GO_TO_STEP functionality - use index directly
        targetIndex = payload;
      } else {
        return failure(
          new Error("Payload must be step index (number) or step ID (string)")
        );
      }

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

    default:
      return failure(new Error(`Unknown action type: ${(action as any).type}`));
  }
};
