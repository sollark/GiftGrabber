/**
 * useStepNavigation.ts
 * Purpose: Business logic hook for multistep navigation operations.
 * Responsibilities: Provides high-level step actions and state.
 * Architecture: Business layer that uses foundation context hooks.
 */

import React from "react";
import { Result, success, failure } from "@/utils/fp";
import { useMultistepContext } from "./MultistepContext";
import { canNavigateToStep, findStepIndex } from "./multistepUtils";
import { StepDefinition } from "./types";

/**
 * Business logic hook for multistep navigation.
 * Provides high-level step operations using foundation context hooks.
 * @returns Step navigation state and actions
 */
export const useStepNavigation = () => {
  const context = useMultistepContext();
  const state = context._tag === "Some" ? context.value.state.data : undefined;
  const dispatch = context._tag === "Some" ? context.value.dispatch : undefined;

  // Destructure for cleaner access
  const {
    currentStepIndex,
    currentStepId,
    steps,
    canGoBack,
    canGoNext,
    completedSteps,
    skippedSteps,
  } = state || {};

  /**
   * Navigate to next step with validation.
   * @returns Result indicating success or failure
   */
  const goToNextStep = React.useCallback((): Result<void, string> => {
    if (!dispatch) {
      return failure("Multistep context not available");
    }
    try {
      dispatch({ type: "GO_TO_NEXT_STEP" });
      return success(undefined);
    } catch {
      return failure("Failed to navigate to next step");
    }
  }, [dispatch]);

  /**
   * Navigate to previous step.
   * @returns Result indicating success or failure
   */
  const goToPreviousStep = React.useCallback((): Result<void, string> => {
    if (!dispatch) {
      return failure("Multistep context not available");
    }
    try {
      dispatch({ type: "GO_TO_PREVIOUS_STEP" });
      return success(undefined);
    } catch {
      return failure("Failed to navigate to previous step");
    }
  }, [dispatch]);

  /**
   * Jump to specific step by ID.
   * @param stepId - Target step identifier
   * @returns Result indicating success or failure
   */
  const jumpToStep = React.useCallback(
    (stepId: string): Result<void, string> => {
      if (!dispatch) {
        return failure("Multistep context not available");
      }
      if (!steps || steps.length === 0) {
        return failure("No steps available");
      }
      const stepIndex = findStepIndex(steps, stepId);
      if (stepIndex === -1) {
        return failure(`Step with id "${stepId}" not found`);
      }
      const navigationCheck = canNavigateToStep(
        steps,
        stepIndex,
        completedSteps || new Set()
      );
      if (navigationCheck._tag === "Failure") {
        return failure(navigationCheck.error);
      }
      try {
        dispatch({ type: "GO_TO_STEP", payload: stepId });
        return success(undefined);
      } catch {
        return failure(`Failed to navigate to step "${stepId}"`);
      }
    },
    [dispatch, steps, completedSteps]
  );

  /**
   * Navigate to specific step by index.
   * @param stepIndex - Target step index
   * @returns Result indicating success or failure
   */
  const goToStep = React.useCallback(
    (stepIndex: number): Result<void, string> => {
      if (!dispatch) {
        return failure("Multistep context not available");
      }
      if (!steps || stepIndex < 0 || stepIndex >= steps.length) {
        return failure("Invalid step index");
      }
      try {
        dispatch({ type: "GO_TO_STEP", payload: stepIndex });
        return success(undefined);
      } catch {
        return failure(`Failed to navigate to step ${stepIndex}`);
      }
    },
    [dispatch, steps]
  );

  /**
   * Complete current step.
   * @param stepId - Optional step ID, defaults to current step
   * @returns Result indicating success or failure
   */
  const completeStep = React.useCallback(
    (stepId?: string): Result<void, string> => {
      if (!dispatch) {
        return failure("Multistep context not available");
      }
      try {
        dispatch({
          type: "COMPLETE_STEP",
          payload: stepId || currentStepId,
        });
        return success(undefined);
      } catch {
        return failure("Failed to complete step");
      }
    },
    [dispatch, currentStepId]
  );

  /**
   * Skip optional step.
   * @param stepId - Optional step ID, defaults to current step
   * @returns Result indicating success or failure
   */
  const skipStep = React.useCallback(
    (stepId?: string): Result<void, string> => {
      if (!dispatch) {
        return failure("Multistep context not available");
      }
      try {
        dispatch({
          type: "SKIP_STEP",
          payload: stepId || currentStepId,
        });
        return success(undefined);
      } catch {
        return failure("Failed to skip step");
      }
    },
    [dispatch, currentStepId]
  );

  /**
   * Calculate management progress as decimal (0-1).
   * @returns Progress as decimal between 0 and 1
   */
  const progress = React.useMemo((): number => {
    if (!steps || steps.length === 0) return 0;
    return ((currentStepIndex || 0) + 1) / steps.length;
  }, [currentStepIndex, steps]);

  /**
   * Determine if workflow can be completed.
   * @returns True if all required steps are completed or on final step
   */
  const canComplete = React.useMemo((): boolean => {
    if (!steps || steps.length === 0) return false;

    // Can complete if on last step
    if (currentStepIndex === steps.length - 1) return true;

    // Or if all required steps are completed
    const requiredSteps = steps.filter(
      (step: StepDefinition) => !step.isOptional
    );
    const completedStepsSet = completedSteps || new Set();

    return requiredSteps.every((step: StepDefinition) =>
      completedStepsSet.has(step.id)
    );
  }, [steps, currentStepIndex, completedSteps]);

  /**
   * Get current step definition.
   * @returns Current step or null if invalid index
   */
  const currentStep = React.useMemo(() => {
    if (
      !steps ||
      !currentStepIndex ||
      currentStepIndex < 0 ||
      currentStepIndex >= steps.length
    ) {
      return null;
    }
    return steps[currentStepIndex];
  }, [steps, currentStepIndex]);

  return {
    // State
    currentStepIndex: currentStepIndex || 0,
    currentStepId: currentStepId || "",
    currentStep,
    steps: steps || [],
    canGoBack: canGoBack || false,
    canGoNext: canGoNext || false,
    canComplete,
    totalSteps: steps?.length || 0,
    progress,
    completedSteps: Array.from(completedSteps || new Set()),
    skippedSteps: Array.from(skippedSteps || new Set()),

    // Actions
    goToNextStep,
    goToPreviousStep,
    jumpToStep,
    goToStep,
    completeStep,
    skipStep,
  };
};
