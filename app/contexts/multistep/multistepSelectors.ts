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
