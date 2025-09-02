/**
 * useStepData.ts
 * Purpose: Custom hook for accessing and managing step data in multistep context.
 * Responsibilities: Exposes step data and helpers for components.
 * Architecture: Public API for consumers of MultistepContext.
 */
import React from "react";
import { success, failure } from "@/utils/fp";
import MultistepContext from "./MultistepContext";

/**
 * useStepData - Hook for step data management.
 * Returns step data and actions for setting, updating, and clearing step data.
 */
export const useStepData = (): {
  stepData: any;
  setStepData: (stepId: string, data: unknown) => any;
  updateStepData: (stepId: string, data: unknown) => any;
  clearStepData: (stepId: string) => any;
  getCurrentStepData: () => any;
  getStepData: (stepId: string) => any;
} => {
  const context = MultistepContext.useMultistepContext();
  const state = context._tag === "Some" ? context.value.state.data : {};
  const dispatch = context._tag === "Some" ? context.value.dispatch : undefined;
  // Memoize stepData and currentStepId for stable dependencies
  const stepData = React.useMemo(() => state.stepData || {}, [state.stepData]);
  const currentStepId = React.useMemo(() => state.currentStepId || "", [state.currentStepId]);

  /**
   * Sets step data for a given stepId. Returns Result<void, Error>.
   */
  const setStepData = React.useCallback(
    (stepId: string, data: unknown): any => {
      if (!dispatch)
        return failure(new Error("Multistep context not available"));
      try {
        dispatch({ type: "SET_STEP_DATA", payload: { stepId, data } });
        return success(undefined);
      } catch (e) {
        return failure(e instanceof Error ? e : new Error("Unknown error"));
      }
    },
    [dispatch]
  );

  /**
   * Updates step data for a given stepId. Returns Result<void, Error>.
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
   * Clears step data for a given stepId. Returns Result<void, Error>.
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
