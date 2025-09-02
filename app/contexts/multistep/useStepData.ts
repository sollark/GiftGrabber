/**
 * useStepData.ts
 * Purpose: Provides a custom React hook for accessing and managing step-specific data within a multistep form context.
 * Main Responsibilities:
 *   - Exposes step data and helper functions for setting, updating, clearing, and retrieving step data.
 *   - Acts as the public API for consumers of the MultistepContext, abstracting context internals.
 *   - Ensures safe access to context state and dispatch, handling missing context gracefully.
 * Architectural Role:
 *   - Sits at the boundary between UI components and the multistep context state management.
 *   - Promotes encapsulation and separation of concerns by hiding context details from consumers.
 *   - Relies on functional programming patterns for error handling (success/failure).
 */
import React from "react";
import { success, failure } from "@/utils/fp";
import { useMultistepContext } from "./MultistepContext";

/**
 * useStepData (Public API)
 * Custom hook for step data management in multistep forms.
 *
 * Returns:
 *   - stepData: object mapping step IDs to their data.
 *   - updateStepData: function to update data for a step.
 *   - updateStepData: function to update data for a step.
 *   - clearStepData: function to clear data for a step.
 *   - getCurrentStepData: function to get data for the current step.
 *   - getStepData: function to get data for a specific step.
 *
 * Side Effects:
 *   - Dispatches actions to the MultistepContext to update state.
 *   - Returns functional Result objects for error handling.
 *
 * Special Notes:
 *   - Uses React.memo and React.callback for performance and stable dependencies.
 *   - Handles missing context gracefully, returning failure results.
 */
export const useStepData = (): {
  stepData: any;
  updateStepData: (stepId: string, data: unknown) => any;
  clearStepData: (stepId: string) => any;
  getCurrentStepData: () => any;
  getStepData: (stepId: string) => any;
} => {
  // Internal: Access context state and dispatch, fallback to empty if missing.
  const context = useMultistepContext();
  const state = context._tag === "Some" ? context.value.state.data : {};
  const dispatch = context._tag === "Some" ? context.value.dispatch : undefined;
  // Internal: Memoize stepData and currentStepId for stable dependencies.
  const stepData = React.useMemo(() => state.stepData || {}, [state.stepData]);
  const currentStepId = React.useMemo(
    () => state.currentStepId || "",
    [state.currentStepId]
  );

  /**
   * updateStepData (Public API)
   * Updates data for a given step ID.
   * @param stepId {string} - The identifier for the step.
   * @param data {unknown} - The new data to merge/update for the step.
   * @returns {Result<void, Error>} - Success or failure result.
   * Side Effects: Dispatches UPDATE_STEP_DATA action to context.
   * Notes: Returns failure if context is unavailable.
   */
  const updateStepData = React.useCallback(
    (stepId: string, data: unknown): any => {
      if (!dispatch)
        return failure(new Error("Multistep context not available"));
      try {
        dispatch({ type: "UPDATE_STEP_DATA", payload: { stepId, data } });
        return success(undefined);
      } catch (e) {
        return failure(e instanceof Error ? e : new Error("Unknown error"));
      }
    },
    [dispatch]
  );

  /**
   * clearStepData (Public API)
   * Clears data for a given step ID.
   * @param stepId {string} - The identifier for the step.
   * @returns {Result<void, Error>} - Success or failure result.
   * Side Effects: Dispatches CLEAR_STEP_DATA action to context.
   * Notes: Returns failure if context is unavailable.
   */
  const clearStepData = React.useCallback(
    (stepId: string): any => {
      if (!dispatch)
        return failure(new Error("Multistep context not available"));
      try {
        dispatch({ type: "CLEAR_STEP_DATA", payload: stepId });
        return success(undefined);
      } catch (e) {
        return failure(e instanceof Error ? e : new Error("Unknown error"));
      }
    },
    [dispatch]
  );

  /**
   * getCurrentStepData (Public API)
   * Retrieves data for the current step.
   * @returns {any} - Data for the current step, or null if unavailable.
   * Side Effects: None.
   * Notes: Returns null if currentStepId is not set.
   */
  const getCurrentStepData = React.useCallback(() => {
    if (!currentStepId) return null;
    return stepData?.[currentStepId] ?? null;
  }, [stepData, currentStepId]);

  /**
   * getStepData (Public API)
   * Retrieves data for a specific step ID.
   * @param stepId {string} - The identifier for the step.
   * @returns {any} - Data for the step, or null if unavailable.
   * Side Effects: None.
   */
  const getStepData = React.useCallback(
    (stepId: string) => {
      return stepData?.[stepId] ?? null;
    },
    [stepData]
  );

  return {
    stepData,
    updateStepData,
    clearStepData,
    getCurrentStepData,
    getStepData,
  };
};
