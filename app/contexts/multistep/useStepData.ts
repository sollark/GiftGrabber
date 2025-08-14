/**
 * useStepData.ts
 * Purpose: Custom hook for accessing and managing step data in multistep context.
 * Responsibilities: Exposes step data and helpers for components.
 * Architecture: Public API for consumers of MultistepContext.
 */
// ...existing code...
import React from "react";
import { Result, success, failure } from "@/utils/fp";
import MultistepContext from "./MultistepContext";
import { selectStepData, selectCurrentStepId } from "./multistepSelectors";

/**
 * useStepData - Hook for step data management.
 * Returns step data and actions for setting, updating, and clearing step data.
 */
export const useStepData = () => {
  const actions = MultistepContext.useMultistepActions();
  const stepData = MultistepContext.useMultistepSelector(selectStepData);
  const currentStepId =
    MultistepContext.useMultistepSelector(selectCurrentStepId);

  /**
   * Sets step data for a given stepId. Returns Result<void, Error>.
   */
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

  /**
   * Updates step data for a given stepId. Returns Result<void, Error>.
   */
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

  /**
   * Clears step data for a given stepId. Returns Result<void, Error>.
   */
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

  /**
   * Returns data for the current step, or null if unavailable.
   */
  const getCurrentStepData = React.useCallback(() => {
    if (!currentStepId) return null;
    return stepData?.[currentStepId] ?? null;
  }, [stepData, currentStepId]);

  /**
   * Returns data for a specific stepId, or null if unavailable.
   */
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
