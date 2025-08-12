/**
 * multistepSelectors.ts
 * Purpose: Provides selector functions for extracting data from multistep state.
 * Responsibilities: Encapsulates logic for querying step state, progress, and validation.
 * Architecture: Used by context, hooks, and components for modular state access.
 */
// ...existing code...
/**
 * Selector functions for MultistepContext state.
 * Encapsulate state access for improved modularity and testability.
 */
import { MultistepState } from "./types";

/**
 * Selects step data from multistep state.
 * @param state MultistepState
 * @returns stepData or undefined
 */
export const selectStepData = (state: MultistepState) =>
  state !== "RESET_FORM" ? state.data.stepData : undefined;

/**
 * Selects current step ID from multistep state.
 * @param state MultistepState
 * @returns currentStepId or undefined
 */
export const selectCurrentStepId = (state: MultistepState) =>
  state !== "RESET_FORM" ? state.data.currentStepId : undefined;

/**
 * Selects validation results from multistep state.
 * @param state MultistepState
 * @returns validationResults or undefined
 */
export const selectValidationResults = (state: MultistepState) =>
  state !== "RESET_FORM" ? state.data.validationResults : undefined;

/**
 * Selects steps array from multistep state.
 * @param state MultistepState
 * @returns steps array or empty array
 */
export const selectSteps = (state: MultistepState) =>
  state !== "RESET_FORM" ? state.data.steps : [];

/**
 * Selects completed steps set from multistep state.
 * @param state MultistepState
 * @returns completedSteps or empty set
 */
export const selectCompletedSteps = (state: MultistepState) =>
  state !== "RESET_FORM" ? state.data.completedSteps : new Set();

/**
 * Selects skipped steps set from multistep state.
 * @param state MultistepState
 * @returns skippedSteps or empty set
 */
export const selectSkippedSteps = (state: MultistepState) =>
  state !== "RESET_FORM" ? state.data.skippedSteps : new Set();

/**
 * Selects navigation history from multistep state.
 * @param state MultistepState
 * @returns navigationHistory or empty array
 */
export const selectNavigationHistory = (state: MultistepState) =>
  state !== "RESET_FORM" ? state.data.navigationHistory : [];

/**
 * Selects form context from multistep state.
 * @param state MultistepState
 * @returns formContext or empty object
 */
export const selectFormContext = (state: MultistepState) =>
  state !== "RESET_FORM" ? state.data.formContext : {};

/**
 * Selects current step index from multistep state.
 * @param state MultistepState
 * @returns currentStepIndex or -1
 */
export const selectCurrentStepIndex = (state: MultistepState) =>
  state !== "RESET_FORM" ? state.data.currentStepIndex : -1;

/**
 * Selects canGoBack flag from multistep state.
 * @param state MultistepState
 * @returns canGoBack or false
 */
export const selectCanGoBack = (state: MultistepState) =>
  state !== "RESET_FORM" ? state.data.canGoBack : false;

/**
 * Selects canGoNext flag from multistep state.
 * @param state MultistepState
 * @returns canGoNext or false
 */
export const selectCanGoNext = (state: MultistepState) =>
  state !== "RESET_FORM" ? state.data.canGoNext : false;

/**
 * Selects canComplete flag from multistep state.
 * @param state MultistepState
 * @returns canComplete or false
 */
export const selectCanComplete = (state: MultistepState) =>
  state !== "RESET_FORM" ? state.data.canComplete : false;
