/**
 * useStepNavigation.ts
 * Purpose: Business logic hook for multistep navigation operations.
 * Responsibilities: Provides high-level step actions and state.
 * Architecture: Business layer that uses foundation context hooks.
 */

import React from "react";
import { Result, success, failure } from "@/utils/fp";
import { useMultistepActions, useMultistepSelector } from "./MultistepContext";
import {
  selectCurrentStepIndex,
  selectCurrentStepId,
  selectSteps,
  selectCanGoBack,
  selectCanGoNext,
  selectCompletedSteps,
  selectSkippedSteps,
} from "./multistepSelectors";
import { canNavigateToStep, findStepIndex } from "./multistepUtils";
import { StepDefinition, MultistepState } from "./types";

/**
 * Business logic hook for multistep navigation.
 * Provides high-level step operations using foundation context hooks.
 * @returns Step navigation state and actions
 */
export const useStepNavigation = () => {
  const actions = useMultistepActions();

  // Single memoized selector to reduce re-renders - performance optimization
  const multistepState = useMultistepSelector(
    React.useCallback(
      (state: MultistepState) => ({
        currentStepIndex: state.data.currentStepIndex,
        currentStepId: state.data.currentStepId,
        steps: state.data.steps,
        canGoBack: state.data.canGoBack,
        canGoNext: state.data.canGoNext,
        completedSteps: state.data.completedSteps,
        skippedSteps: state.data.skippedSteps,
      }),
      []
    )
  );

  // Destructure for cleaner access
  const {
    currentStepIndex,
    currentStepId,
    steps,
    canGoBack,
    canGoNext,
    completedSteps,
    skippedSteps,
  } = multistepState || {};

  /**
   * Navigate to next step with validation.
   * @returns Result indicating success or failure
   */
  const goToNextStep = React.useCallback((): Result<void, string> => {
    if (actions._tag !== "Some") {
      return failure("Multistep context not available");
    }

    const result = actions.value.dispatchSafe({ type: "GO_TO_NEXT_STEP" });
    return result._tag === "Success"
      ? success(undefined)
      : failure("Failed to navigate to next step");
  }, [actions]);

  /**
   * Navigate to previous step.
   * @returns Result indicating success or failure
   */
  const goToPreviousStep = React.useCallback((): Result<void, string> => {
    if (actions._tag !== "Some") {
      return failure("Multistep context not available");
    }

    const result = actions.value.dispatchSafe({ type: "GO_TO_PREVIOUS_STEP" });
    return result._tag === "Success"
      ? success(undefined)
      : failure("Failed to navigate to previous step");
  }, [actions]);

  /**
   * Jump to specific step by ID.
   * @param stepId - Target step identifier
   * @returns Result indicating success or failure
   */
  const jumpToStep = React.useCallback(
    (stepId: string): Result<void, string> => {
      if (actions._tag !== "Some") {
        return failure("Multistep context not available");
      }

      if (!steps || steps.length === 0) {
        return failure("No steps available");
      }

      const stepIndex = findStepIndex(steps, stepId);
      if (stepIndex === -1) {
        return failure(`Step with id "${stepId}" not found`);
      }

      // Check if navigation is allowed
      const navigationCheck = canNavigateToStep(
        steps,
        stepIndex,
        completedSteps || new Set()
      );
      if (navigationCheck._tag === "Failure") {
        return failure(navigationCheck.error);
      }

      const result = actions.value.dispatchSafe({
        type: "GO_TO_STEP",
        payload: stepId,
      });

      return result._tag === "Success"
        ? success(undefined)
        : failure(`Failed to navigate to step "${stepId}"`);
    },
    [actions, steps, completedSteps]
  );

  /**
   * Navigate to specific step by index.
   * @param stepIndex - Target step index
   * @returns Result indicating success or failure
   */
  const goToStep = React.useCallback(
    (stepIndex: number): Result<void, string> => {
      if (actions._tag !== "Some") {
        return failure("Multistep context not available");
      }

      if (!steps || stepIndex < 0 || stepIndex >= steps.length) {
        return failure("Invalid step index");
      }

      const result = actions.value.dispatchSafe({
        type: "GO_TO_STEP",
        payload: stepIndex,
      });

      return result._tag === "Success"
        ? success(undefined)
        : failure(`Failed to navigate to step ${stepIndex}`);
    },
    [actions, steps]
  );

  /**
   * Complete current step.
   * @param stepId - Optional step ID, defaults to current step
   * @returns Result indicating success or failure
   */
  const completeStep = React.useCallback(
    (stepId?: string): Result<void, string> => {
      if (actions._tag !== "Some") {
        return failure("Multistep context not available");
      }

      const result = actions.value.dispatchSafe({
        type: "COMPLETE_STEP",
        payload: stepId || currentStepId,
      });

      return result._tag === "Success"
        ? success(undefined)
        : failure("Failed to complete step");
    },
    [actions, currentStepId]
  );

  /**
   * Skip optional step.
   * @param stepId - Optional step ID, defaults to current step
   * @returns Result indicating success or failure
   */
  const skipStep = React.useCallback(
    (stepId?: string): Result<void, string> => {
      if (actions._tag !== "Some") {
        return failure("Multistep context not available");
      }

      const result = actions.value.dispatchSafe({
        type: "SKIP_STEP",
        payload: stepId || currentStepId,
      });

      return result._tag === "Success"
        ? success(undefined)
        : failure("Failed to skip step");
    },
    [actions, currentStepId]
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
