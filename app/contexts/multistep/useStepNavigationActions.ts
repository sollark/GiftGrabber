/**
 * useStepNavigationActions.ts
 * Purpose: Custom hook for dispatching navigation actions in multistep context.
 * Responsibilities: Exposes action dispatchers for step navigation.
 * Architecture: Public API for multistep-related components.
 */
// ...existing code...
/**
 * useStepNavigationActions - Encapsulates navigation logic for multistep context
 * Not intended for reuse outside MultistepContext consumers
 * Returns navigation actions and error handling for current step
 */
import EnhancedMultistepContextExports from "./MultistepContext";

export function useStepNavigationActions() {
  const navResult = EnhancedMultistepContextExports.useStepNavigation();

  /**
   * Go to next step, returns error string if navigation fails
   */
  function goToNextStep(): string | null {
    if (navResult._tag === "Success") {
      const result = navResult.value.goToNextStep();
      if (result._tag === "Success") {
        return null;
      } else {
        return result.error;
      }
    }
    return "Navigation context unavailable";
  }

  /**
   * Jump to a specific step by ID, returns error string if navigation fails
   */
  function jumpToStep(stepId: string): string | null {
    if (navResult._tag === "Success") {
      const result = navResult.value.jumpToStep(stepId);
      if (result._tag === "Success") {
        return null;
      } else {
        return result.error;
      }
    }
    return "Navigation context unavailable";
  }

  /**
   * Go to previous step, returns error string if navigation fails
   */
  function goToPreviousStep(): string | null {
    if (navResult._tag === "Success") {
      const result = navResult.value.goToPreviousStep();
      // goToPreviousStep always returns an object, not Result, so no error
      return null;
    }
    return "Navigation context unavailable";
  }

  return {
    goToNextStep,
    jumpToStep,
    goToPreviousStep,
    navResult,
  };
}
