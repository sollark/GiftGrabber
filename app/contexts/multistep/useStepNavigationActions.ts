/**
 * useStepNavigationActions.ts
 * Purpose: Custom hook for dispatching navigation actions in multistep context.
 * Responsibilities: Exposes action dispatchers for step navigation.
 * Architecture: Wrapper around business management hook for component simplicity.
 */

import { Result } from "@/utils/fp";
import { useStepNavigation } from "./useStepNavigation";

/**
 * useStepNavigationActions - Simplified navigation actions hook.
 * Uses the business navigation hook for cleaner architecture.
 * Returns navigation actions with Result pattern for consistency.
 */
export function useStepNavigationActions() {
  const navigation = useStepNavigation();

  /**
   * Go to next step using Result pattern.
   * @returns Result indicating success or failure
   */
  function goToNextStep(): Result<void, string> {
    return navigation.goToNextStep();
  }

  /**
   * Jump to a specific step by ID using Result pattern.
   * @param stepId - Target step identifier
   * @returns Result indicating success or failure
   */
  function jumpToStep(stepId: string): Result<void, string> {
    return navigation.jumpToStep(stepId);
  }

  /**
   * Go to previous step using Result pattern.
   * @returns Result indicating success or failure
   */
  function goToPreviousStep(): Result<void, string> {
    return navigation.goToPreviousStep();
  }

  // For backward compatibility, provide navResult-like structure
  const navResult = {
    _tag: "Success" as const,
    value: {
      currentStepIndex: navigation.currentStepIndex,
      currentStepId: navigation.currentStepId,
      currentStep: navigation.currentStep,
      canGoBack: navigation.canGoBack,
      canGoNext: navigation.canGoNext,
      canComplete: navigation.canComplete,
      totalSteps: navigation.totalSteps,
      progress: navigation.progress,
    },
  };

  return {
    goToNextStep,
    jumpToStep,
    goToPreviousStep,
    navResult,
  };
}
