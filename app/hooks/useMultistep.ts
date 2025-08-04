"use client";

import { useState, useCallback, useMemo } from "react";
import { Maybe, some, none, Result, success, failure } from "@/lib/fp-utils";
import { useImmutableState, useResultState } from "@/lib/fp-hooks";

/**
 * Enhanced multi-step form navigation with functional patterns
 * Provides immutable state management and Result-based operations
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface StepConfig {
  id: string;
  component: React.ReactElement;
  title?: string;
  description?: string;
  validation?: () => Result<boolean, string>;
  canSkip?: boolean;
  onEnter?: () => void | Promise<void>;
  onExit?: () => void | Promise<void>;
}

export interface MultistepState {
  readonly currentStepIndex: number;
  readonly visitedSteps: readonly number[];
  readonly stepData: Readonly<Record<string, any>>;
  readonly isCompleted: boolean;
  readonly errors: Readonly<Record<string, string>>;
}

export interface MultistepNavigation {
  currentStep: Maybe<StepConfig>;
  currentStepIndex: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  canGoPrev: boolean;
  visitedSteps: readonly number[];
  totalSteps: number;
  progress: number;
  nextStep: () => Promise<Result<boolean, string>>;
  prevStep: () => Promise<Result<boolean, string>>;
  goToStep: (index: number) => Promise<Result<boolean, string>>;
  goToStepById: (id: string) => Promise<Result<boolean, string>>;
  reset: () => void;
  setStepData: (stepId: string, data: any) => void;
  getStepData: (stepId: string) => Maybe<any>;
  validateCurrentStep: () => Result<boolean, string>;
  validateAllSteps: () => Result<boolean, string[]>;
  complete: () => Promise<Result<boolean, string>>;
}

// ============================================================================
// ENHANCED MULTISTEP HOOK
// ============================================================================

/**
 * Enhanced multi-step form navigation with functional patterns
 * @param stepsConfig - Array of step configurations
 * @param options - Configuration options
 * @returns MultistepNavigation object
 */
export function useMultistep(
  stepsConfig: StepConfig[],
  options: {
    initialStep?: number;
    allowSkipping?: boolean;
    persistState?: boolean;
    onComplete?: (data: Record<string, any>) => void | Promise<void>;
  } = {}
): MultistepNavigation {
  const {
    initialStep = 0,
    allowSkipping = false,
    persistState = false,
    onComplete,
  } = options;

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const initialState: MultistepState = useMemo(
    () => ({
      currentStepIndex: Math.max(
        0,
        Math.min(initialStep, stepsConfig.length - 1)
      ),
      visitedSteps: [initialStep],
      stepData: {},
      isCompleted: false,
      errors: {},
    }),
    [initialStep, stepsConfig.length]
  );

  const [state, setState] = useImmutableState<MultistepState>(initialState);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const currentStep: Maybe<StepConfig> = useMemo(() => {
    const step = stepsConfig[state.currentStepIndex];
    return step ? some(step) : none;
  }, [stepsConfig, state.currentStepIndex]);

  const isFirstStep = useMemo(
    () => state.currentStepIndex === 0,
    [state.currentStepIndex]
  );

  const isLastStep = useMemo(
    () => state.currentStepIndex === stepsConfig.length - 1,
    [state.currentStepIndex, stepsConfig.length]
  );

  const totalSteps = useMemo(() => stepsConfig.length, [stepsConfig.length]);

  const progress = useMemo(
    () =>
      totalSteps > 0 ? ((state.currentStepIndex + 1) / totalSteps) * 100 : 0,
    [state.currentStepIndex, totalSteps]
  );

  const canGoNext = useMemo(() => {
    if (isLastStep) return false;
    if (allowSkipping) return true;

    if (currentStep._tag === "Some" && currentStep.value.validation) {
      const validationResult = currentStep.value.validation();
      return validationResult._tag === "Success";
    }

    return true; // No validation means step is valid
  }, [isLastStep, allowSkipping, currentStep]);

  const canGoPrev = useMemo(() => !isFirstStep, [isFirstStep]);

  // ============================================================================
  // VALIDATION FUNCTIONS
  // ============================================================================

  const validateStep = useCallback(
    (stepIndex: number): Result<boolean, string> => {
      const step = stepsConfig[stepIndex];
      if (!step) {
        return failure("Invalid step index");
      }

      if (step.validation) {
        return step.validation();
      }

      return success(true);
    },
    [stepsConfig]
  );

  const validateCurrentStep = useCallback((): Result<boolean, string> => {
    return validateStep(state.currentStepIndex);
  }, [validateStep, state.currentStepIndex]);

  const validateAllSteps = useCallback((): Result<boolean, string[]> => {
    const errors: string[] = [];

    for (let i = 0; i < stepsConfig.length; i++) {
      const result = validateStep(i);
      if (result._tag === "Failure") {
        errors.push(`Step ${i + 1}: ${result.error}`);
      }
    }

    return errors.length > 0 ? failure(errors) : success(true);
  }, [stepsConfig, validateStep]);

  // ============================================================================
  // NAVIGATION FUNCTIONS
  // ============================================================================

  const updateStepIndex = useCallback(
    async (
      newIndex: number,
      skipValidation: boolean = false
    ): Promise<Result<boolean, string>> => {
      if (newIndex < 0 || newIndex >= stepsConfig.length) {
        return failure("Invalid step index");
      }

      if (newIndex === state.currentStepIndex) {
        return success(true);
      }

      // Validate current step before leaving (unless skipping validation)
      if (!skipValidation && newIndex > state.currentStepIndex) {
        const validationResult = validateCurrentStep();
        if (validationResult._tag === "Failure") {
          setState((prev) => ({
            ...prev,
            errors: {
              ...prev.errors,
              [state.currentStepIndex]: validationResult.error,
            },
          }));
          return failure(validationResult.error);
        }
      }

      // Execute current step's onExit if exists
      if (currentStep._tag === "Some" && currentStep.value.onExit) {
        try {
          await currentStep.value.onExit();
        } catch (error) {
          return failure(`Error exiting step: ${error}`);
        }
      }

      // Update state
      setState((prev) => ({
        ...prev,
        currentStepIndex: newIndex,
        visitedSteps: prev.visitedSteps.includes(newIndex)
          ? prev.visitedSteps
          : [...prev.visitedSteps, newIndex].sort((a, b) => a - b),
        errors: { ...prev.errors, [state.currentStepIndex]: undefined },
      }));

      // Execute new step's onEnter if exists
      const newStep = stepsConfig[newIndex];
      if (newStep.onEnter) {
        try {
          await newStep.onEnter();
        } catch (error) {
          return failure(`Error entering step: ${error}`);
        }
      }

      return success(true);
    },
    [
      stepsConfig,
      state.currentStepIndex,
      currentStep,
      validateCurrentStep,
      setState,
    ]
  );

  const nextStep = useCallback(async (): Promise<Result<boolean, string>> => {
    if (isLastStep) {
      return failure("Already at last step");
    }

    return await updateStepIndex(state.currentStepIndex + 1);
  }, [isLastStep, state.currentStepIndex, updateStepIndex]);

  const prevStep = useCallback(async (): Promise<Result<boolean, string>> => {
    if (isFirstStep) {
      return failure("Already at first step");
    }

    return await updateStepIndex(state.currentStepIndex - 1, true);
  }, [isFirstStep, state.currentStepIndex, updateStepIndex]);

  const goToStep = useCallback(
    async (index: number): Promise<Result<boolean, string>> => {
      if (!allowSkipping && index > Math.max(...state.visitedSteps) + 1) {
        return failure("Cannot skip to unvisited step");
      }

      return await updateStepIndex(index);
    },
    [allowSkipping, state.visitedSteps, updateStepIndex]
  );

  const goToStepById = useCallback(
    async (id: string): Promise<Result<boolean, string>> => {
      const stepIndex = stepsConfig.findIndex((step) => step.id === id);
      if (stepIndex === -1) {
        return failure(`Step with id "${id}" not found`);
      }

      return await goToStep(stepIndex);
    },
    [stepsConfig, goToStep]
  );

  // ============================================================================
  // DATA MANAGEMENT
  // ============================================================================

  const setStepData = useCallback(
    (stepId: string, data: any) => {
      setState((prev) => ({
        ...prev,
        stepData: { ...prev.stepData, [stepId]: data },
      }));
    },
    [setState]
  );

  const getStepData = useCallback(
    (stepId: string): Maybe<any> => {
      const data = state.stepData[stepId];
      return data !== undefined ? some(data) : none;
    },
    [state.stepData]
  );

  // ============================================================================
  // COMPLETION AND RESET
  // ============================================================================

  const complete = useCallback(async (): Promise<Result<boolean, string>> => {
    const validationResult = validateAllSteps();
    if (validationResult._tag === "Failure") {
      return failure(`Validation failed: ${validationResult.error.join(", ")}`);
    }

    setState((prev) => ({ ...prev, isCompleted: true }));

    if (onComplete) {
      try {
        await onComplete(state.stepData);
      } catch (error) {
        return failure(`Error during completion: ${error}`);
      }
    }

    return success(true);
  }, [validateAllSteps, setState, onComplete, state.stepData]);

  const reset = useCallback(() => {
    setState(() => initialState);
  }, [setState, initialState]);

  // ============================================================================
  // RETURN NAVIGATION OBJECT
  // ============================================================================

  return {
    currentStep,
    currentStepIndex: state.currentStepIndex,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrev,
    visitedSteps: state.visitedSteps,
    totalSteps,
    progress,
    nextStep,
    prevStep,
    goToStep,
    goToStepById,
    reset,
    setStepData,
    getStepData,
    validateCurrentStep,
    validateAllSteps,
    complete,
  };
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy multi-step hook for backward compatibility
 * @param steps - Array of step components
 * @returns Legacy navigation object
 */
export function useLegacyMultistep(steps: React.ReactElement[]) {
  const stepsConfig: StepConfig[] = steps.map((step, index) => ({
    id: `step-${index}`,
    component: step,
  }));

  const navigation = useMultistep(stepsConfig);

  return {
    currentStepIndex: navigation.currentStepIndex,
    step:
      navigation.currentStep._tag === "Some"
        ? navigation.currentStep.value.component
        : steps[0],
    steps,
    isFirstStep: navigation.isFirstStep,
    isLastStep: navigation.isLastStep,
    nextStep: async () => {
      const result = await navigation.nextStep();
      if (result._tag === "Failure") {
        console.warn("Next step failed:", result.error);
      }
    },
    prevStep: async () => {
      const result = await navigation.prevStep();
      if (result._tag === "Failure") {
        console.warn("Previous step failed:", result.error);
      }
    },
    goToStep: async (index: number) => {
      const result = await navigation.goToStep(index);
      if (result._tag === "Failure") {
        console.warn("Go to step failed:", result.error);
      }
    },
  };
}

export default useMultistep;
