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
  const stepsRaw = MultistepContext.useMultistepSelector(selectSteps);
  // Memoize steps to ensure stable reference for useCallback dependencies
  const steps = React.useMemo(
    () => (Array.isArray(stepsRaw) ? stepsRaw : []),
    [stepsRaw]
  );
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
   * Gets validation result for a step.
   */
  const getStepValidation = React.useCallback(
    (stepId: string): StepValidationResult | null => {
      if (!validationResults) return null;
      return validationResults[stepId] ?? null;
    },
    [validationResults]
  );

  /**
   * Validates all steps.
   */
  const validateAllSteps = React.useCallback((): Result<void, Error> => {
    const safeActions = actions._tag === "Some" && actions.value;
    if (!safeActions)
      return failure(new Error("Multistep context not available"));
    steps.forEach((step: StepDefinition) => {
      validateStep(step, stepData?.[step.id]);
      safeActions.dispatchSafe({
        type: "VALIDATE_STEP",
        payload: { stepId: step.id, data: stepData?.[step.id] },
      });
    });
    return success(undefined);
  }, [actions, steps, stepData]);

  return {
    validateStep: validateStepAction,
    getStepValidation,
    validateAllSteps,
    currentStepId,
    validationResults,
    steps,
    stepData,
  };
};
