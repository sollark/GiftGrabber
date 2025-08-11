import React from "react";
import { Result, success, failure } from "@/lib/fp-utils";
import MultistepContext from "./MultistepContext";
import {
  selectValidationResults,
  selectCurrentStepId,
  selectSteps,
  selectStepData,
} from "./multistepSelectors";
import { StepDefinition, StepValidationResult } from "./types";
import { validateStep } from "./multistepUtils";

/**
 * useStepValidation - Hook for step validation management.
 * Returns validation results and actions for validating steps.
 */
export const useStepValidation = () => {
  const actions = MultistepContext.useMultistepActions();
  const validationResults = MultistepContext.useMultistepSelector(
    selectValidationResults
  );
  const currentStepId =
    MultistepContext.useMultistepSelector(selectCurrentStepId);
  const steps = MultistepContext.useMultistepSelector(selectSteps);
  const stepData = MultistepContext.useMultistepSelector(selectStepData);

  /**
   * Validates a single step by stepId. Returns Result<void, Error>.
   */
  const validateStepAction = React.useCallback(
    (stepId: string, data?: unknown): Result<void, Error> => {
      const safeActions = actions._tag === "Some" && actions.value;
      if (!safeActions)
        return failure(new Error("Multistep context not available"));
      const step = steps.find((s: StepDefinition) => s.id === stepId);
      if (!step) return failure(new Error("Step not found"));
      validateStep(step, data ?? stepData?.[stepId]);
      safeActions.dispatchSafe({
        type: "VALIDATE_STEP",
        payload: { stepId, data },
      });
      return success(undefined);
    },
    [actions, steps, stepData]
  );

  /**
   * Validates all steps in the form. Returns Result<void, Error>.
   */
  const validateAllSteps = React.useCallback((): Result<void, Error> => {
    const safeActions = actions._tag === "Some" && actions.value;
    if (!safeActions)
      return failure(new Error("Multistep context not available"));
    safeActions.dispatchSafe({ type: "VALIDATE_ALL_STEPS" });
    return success(undefined);
  }, [actions]);

  /**
   * Returns validation result for the current step, or null if unavailable.
   */
  const getCurrentStepValidation = React.useCallback(() => {
    if (!currentStepId) return null;
    return validationResults?.[currentStepId] ?? null;
  }, [validationResults, currentStepId]);

  /**
   * Returns validation result for a specific stepId, or null if unavailable.
   */
  const getStepValidation = React.useCallback(
    (stepId: string) => {
      return validationResults?.[stepId] ?? null;
    },
    [validationResults]
  );

  /**
   * Returns true if any step has validation errors.
   */
  const hasValidationErrors = React.useMemo(() => {
    const results = Object.values(
      validationResults ?? {}
    ) as StepValidationResult[];
    return results.some((result) => !result.isValid);
  }, [validationResults]);

  /**
   * Returns true if all steps are valid.
   */
  const allStepsValid = React.useMemo(() => {
    const results = Object.values(
      validationResults ?? {}
    ) as StepValidationResult[];
    return results.every((result) => result.isValid);
  }, [validationResults]);

  return {
    validationResults,
    validateStep: validateStepAction,
    validateAllSteps,
    getCurrentStepValidation,
    getStepValidation,
    hasValidationErrors,
    allStepsValid,
  };
};
