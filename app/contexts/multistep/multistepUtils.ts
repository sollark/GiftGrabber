/**
 * multistepUtils.ts
 * Purpose: Utility functions for multistep context (navigation helpers, step management).
 * Responsibilities: Encapsulates reusable logic for step workflows.
 * Architecture: Used by reducer, context, and hooks.
 */

/**
 * Utility functions for MultistepContext
 * Pure, functional helpers for step navigation and management
 */
import { StepDefinition } from "./types";
import { Result, Maybe, some, none, success, failure } from "@/utils/fp";

/**
 * Finds the index of a step by ID
 * @param steps Array of step definitions
 * @param stepId Step ID to find
 * @returns Index of the step or -1 if not found
 */
export const findStepIndex = (
  steps: StepDefinition[],
  stepId: string
): number => steps.findIndex((step) => step.id === stepId);

/**
 * Gets the current step by index
 * @param steps Array of step definitions
 * @param currentStepIndex Current step index
 * @returns Maybe containing the current step or none
 */
export const getCurrentStep = (
  steps: StepDefinition[],
  currentStepIndex: number
): Maybe<StepDefinition> =>
  currentStepIndex >= 0 && currentStepIndex < steps.length
    ? some(steps[currentStepIndex])
    : none;

/**
 * Checks if step dependencies are met
 * @param step Step to check dependencies for
 * @param completedSteps Set of completed step IDs
 * @param steps Array of all steps for reference
 * @returns Result indicating if dependencies are satisfied
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
 * @param step Step definition to check
 * @returns True if the step is optional
 */
export const isStepOptional = (step: StepDefinition): boolean =>
  Boolean(step.isOptional);

/**
 * Checks if navigation to a step is allowed
 * @param steps Array of step definitions
 * @param targetStepIndex Index of the target step
 * @param completedSteps Set of completed step IDs
 * @returns Result indicating if navigation is allowed
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
