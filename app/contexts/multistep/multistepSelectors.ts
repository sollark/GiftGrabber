/**
 * multistepSelectors.ts
 * Purpose: Provides selector functions for extracting data from multistep state.
 * Responsibilities: Encapsulates logic for querying step state and progress.
 * Architecture: Used by context, hooks, and components for modular state access.
 */

/**
 * Selector functions for MultistepContext state.
 * Encapsulate state access for improved modularity and testability.
 * Simplified to core navigation and step data only.
 */
import { MultistepState } from "./types";

/**
 * Selects step data from multistep state.
 * @param state MultistepState
 * @returns stepData object
 */
export const selectStepData = (state: MultistepState) => state.data.stepData;

/**
 * Selects current step ID from multistep state.
 * @param state MultistepState
 * @returns currentStepId string
 */
export const selectCurrentStepId = (state: MultistepState) =>
  state.data.currentStepId;

/**
 * Selects steps array from multistep state.
 * @param state MultistepState
 * @returns steps array
 */
export const selectSteps = (state: MultistepState) => state.data.steps;

/**
 * Selects completed steps set from multistep state.
 * @param state MultistepState
 * @returns completedSteps set
 */
export const selectCompletedSteps = (state: MultistepState) =>
  state.data.completedSteps;

/**
 * Selects skipped steps set from multistep state.
 * @param state MultistepState
 * @returns skippedSteps set
 */
export const selectSkippedSteps = (state: MultistepState) =>
  state.data.skippedSteps;

/**
 * Selects current step index from multistep state.
 * @param state MultistepState
 * @returns currentStepIndex number
 */
export const selectCurrentStepIndex = (state: MultistepState) =>
  state.data.currentStepIndex;

/**
 * Selects canGoBack flag from multistep state.
 * @param state MultistepState
 * @returns canGoBack boolean
 */
export const selectCanGoBack = (state: MultistepState) => state.data.canGoBack;

/**
 * Selects canGoNext flag from multistep state.
 * @param state MultistepState
 * @returns canGoNext boolean
 */
export const selectCanGoNext = (state: MultistepState) => state.data.canGoNext;

/**
 * Selects canComplete flag from multistep state.
 * @param state MultistepState
 * @returns canComplete boolean
 */
export const selectCanComplete = (state: MultistepState) =>
  state.data.canComplete;

// Convenience selectors for common UI patterns

/**
 * Selects whether current step is the first step.
 * @param state MultistepState
 * @returns True if on first step
 */
export const selectIsFirstStep = (state: MultistepState) =>
  state.data.currentStepIndex === 0;

/**
 * Selects whether current step is the last step.
 * @param state MultistepState
 * @returns True if on last step
 */
export const selectIsLastStep = (state: MultistepState) =>
  state.data.currentStepIndex === state.data.steps.length - 1;

/**
 * Selects detailed progress information for UI display.
 * @param state MultistepState
 * @returns Progress object with current, total, and percentage
 */
export const selectStepProgress = (state: MultistepState) => ({
  current: state.data.currentStepIndex + 1,
  total: state.data.steps.length,
  percentage:
    state.data.steps.length > 0
      ? ((state.data.currentStepIndex + 1) / state.data.steps.length) * 100
      : 0,
  decimal:
    state.data.steps.length > 0
      ? (state.data.currentStepIndex + 1) / state.data.steps.length
      : 0,
});

/**
 * Selects current step with navigation state for UI components.
 * @param state MultistepState
 * @returns Combined current step and navigation info
 */
export const selectCurrentStepWithNavigation = (state: MultistepState) => ({
  step: state.data.steps[state.data.currentStepIndex] || null,
  index: state.data.currentStepIndex,
  id: state.data.currentStepId,
  canGoBack: state.data.canGoBack,
  canGoNext: state.data.canGoNext,
  isFirst: state.data.currentStepIndex === 0,
  isLast: state.data.currentStepIndex === state.data.steps.length - 1,
});
