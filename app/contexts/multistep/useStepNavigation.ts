/**
 * useStepNavigation.ts
 * Purpose: Custom hook for managing step navigation in multistep context.
 * Responsibilities: Exposes navigation state and actions for steps.
 * Architecture: Public API for multistep-related components.
 */
// ...existing code...
import React from "react";
import { Result, success, failure } from "@/utils/fp";
import { useMultistepActions, useMultistepSelector } from "./MultistepContext";
import { selectSteps } from "./multistepSelectors";
import { MultistepState, StepDefinition } from "./types";
import { canNavigateToStep, findStepIndex } from "./multistepUtils";

/**
 * useStepNavigation - Hook for step navigation management.
 * Returns navigation actions and current step info, or a failure Result if state is invalid.
 */
export function useStepNavigation(): Result<
  {
    currentStepIndex: number;
    currentStepId: string;
    currentStep: StepDefinition | null;
    canGoBack: boolean;
    canGoNext: boolean;
    canComplete: boolean;
    progress: number;
    goToNextStep: () => Result<{ type: string; payload?: unknown }, string>;
    goToPreviousStep: () => { type: string };
    jumpToStep: (
      stepId: string
    ) => Result<{ type: string; payload?: unknown }, string>;
    goToStep: (
      stepIndex: number
    ) => Result<{ type: string; payload?: unknown }, string>;
    stepCount: number;
  },
  Error
> {
  // Always call hooks at the top level
  const maybeData = useMultistepSelector((state: MultistepState) => state);
  const actions = useMultistepActions();

  // Extract state data, or use safe defaults if invalid
  let data: MultistepState extends { data: infer D } ? D : any = {
    steps: [],
    currentStepIndex: -1,
    currentStepId: "",
    completedSteps: new Set(),
    skippedSteps: new Set(),
    stepData: {},
    validationResults: {},
    canGoBack: false,
    canGoNext: false,
    canComplete: false,
    progress: 0,
    navigationHistory: [],
    formContext: {},
  };
  let valid = false;
  if (
    maybeData &&
    maybeData._tag === "Some" &&
    maybeData.value &&
    maybeData.value.data &&
    Array.isArray(maybeData.value.data.steps)
  ) {
    data = maybeData.value.data;
    valid = true;
  }
  const steps = data.steps;
  const currentStepIndex = data.currentStepIndex;
  const currentStep =
    Array.isArray(steps) && typeof currentStepIndex === "number"
      ? steps[currentStepIndex] ?? null
      : null;

  /**
   * Advances to the next step. Returns Result or error string.
   */
  const goToNextStep = React.useCallback((): Result<
    { type: string },
    string
  > => {
    const safeActions = actions._tag === "Some" && actions.value;
    if (!safeActions) return failure("Navigation context unavailable");
    const nextIndex = currentStepIndex + 1;
    const navResult = canNavigateToStep(steps, nextIndex, data.completedSteps);
    if (navResult._tag === "Failure") return failure(navResult.error);
    safeActions.dispatchSafe({ type: "GO_TO_NEXT_STEP" });
    return success({ type: "GO_TO_NEXT_STEP" });
  }, [actions, currentStepIndex, steps, data.completedSteps]);

  /**
   * Goes to the previous step.
   */
  const goToPreviousStep = React.useCallback(() => {
    const safeActions = actions._tag === "Some" && actions.value;
    if (!safeActions) return { type: "GO_TO_PREVIOUS_STEP" };
    safeActions.dispatchSafe({ type: "GO_TO_PREVIOUS_STEP" });
    return { type: "GO_TO_PREVIOUS_STEP" };
  }, [actions]);

  /**
   * Jumps to a specific step by ID. Returns Result or error string.
   */
  const jumpToStep = React.useCallback(
    (stepId: string): Result<{ type: string; payload: string }, string> => {
      const safeActions = actions._tag === "Some" && actions.value;
      if (!safeActions) return failure("Multistep context not available");
      const jumpIndex = findStepIndex(steps, stepId);
      const navResult = canNavigateToStep(
        steps,
        jumpIndex,
        data.completedSteps
      );
      if (navResult._tag === "Failure") return failure(navResult.error);
      safeActions.dispatchSafe({ type: "JUMP_TO_STEP", payload: stepId });
      return success({ type: "JUMP_TO_STEP", payload: stepId });
    },
    [actions, steps, data.completedSteps]
  );

  /**
   * Goes to a specific step by index. Returns Result or error string.
   */
  const goToStep = React.useCallback(
    (stepIndex: number): Result<{ type: string; payload: number }, string> => {
      const safeActions = actions._tag === "Some" && actions.value;
      if (!safeActions) return failure("Multistep context not available");
      const navResult = canNavigateToStep(
        steps,
        stepIndex,
        data.completedSteps
      );
      if (navResult._tag === "Failure") return failure(navResult.error);
      safeActions.dispatchSafe({ type: "GO_TO_STEP", payload: stepIndex });
      return success({ type: "GO_TO_STEP", payload: stepIndex });
    },
    [actions, steps, data.completedSteps]
  );

  /**
   * Returns progress as a number between 0 and 1.
   */
  const progress = React.useMemo(() => {
    return steps.length > 0 ? (currentStepIndex + 1) / steps.length : 0;
  }, [steps, currentStepIndex]);
  const stepCount = steps.length;

  // Only return after all hooks are called
  if (!valid) {
    return failure(new Error("Multistep state data not available"));
  }

  return success({
    currentStepIndex,
    currentStepId: data.currentStepId,
    currentStep,
    canGoBack: data.canGoBack,
    canGoNext: data.canGoNext,
    canComplete: data.canComplete,
    progress,
    goToNextStep,
    goToPreviousStep,
    jumpToStep,
    goToStep,
    stepCount,
  });
}
