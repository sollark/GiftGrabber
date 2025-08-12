/**
 * Utility functions for MultistepContext
 * Pure, functional helpers for step navigation and validation
 */
import { StepDefinition, StepValidationResult } from "./types";
import { Result, Maybe, some, none, success, failure } from "@/lib/fp-utils";

/**
 * Finds the index of a step by ID
 */
export const findStepIndex = (
  steps: StepDefinition[],
  stepId: string
): number => steps.findIndex((step) => step.id === stepId);

/**
 * Gets the current step by index
 */
export const getCurrentStep = (
  steps: StepDefinition[],
  currentStepIndex: number
): Maybe<StepDefinition> =>
  currentStepIndex >= 0 && currentStepIndex < steps.length
    ? some(steps[currentStepIndex])
    : none;

/**
 * Validates a step using its rules
 */
export const validateStep = (
  step: StepDefinition | undefined,
  stepData: unknown
): StepValidationResult => {
  const errors: string[] = [];
  if (!step || !step.validationRules) return { isValid: true, errors };
  for (const rule of step.validationRules) {
    try {
      if (!rule.validator(stepData)) errors.push(rule.message);
    } catch (error) {
      errors.push(
        `Validation error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
  return { isValid: errors.length === 0, errors };
};

/**
 * Checks if step dependencies are met
 */
export const areStepDependenciesMet = (
  step: StepDefinition,
  completedSteps: Set<string>,
  steps: StepDefinition[]
): Result<boolean, string> => {
  if (!step.dependencies) return success(true);
  for (const depId of step.dependencies) {
    if (!completedSteps.has(depId)) {
      const depStep = steps.find((s) => s.id === depId);
      return failure(
        `Step "${step.title}" requires "${
          depStep?.title || depId
        }" to be completed first`
      );
    }
  }
  return success(true);
};

/**
 * Checks if a step is optional
 */
export const isStepOptional = (step: StepDefinition): boolean =>
  Boolean(step.isOptional);

/**
 * Checks if navigation to a step is allowed
 */
export const canNavigateToStep = (
  steps: StepDefinition[],
  targetStepIndex: number,
  completedSteps: Set<string>
): Result<boolean, string> => {
  if (targetStepIndex < 0 || targetStepIndex >= steps.length)
    return failure("Invalid step index");
  const targetStep = steps[targetStepIndex];
  return areStepDependenciesMet(targetStep, completedSteps, steps);
};
