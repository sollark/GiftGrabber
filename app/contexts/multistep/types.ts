/**
 * types.ts
 * Purpose: Declares TypeScript types and interfaces for multistep context.
 * Responsibilities: Defines shape of state, actions, steps, and related entities.
 * Architecture: Shared by reducer, context, selectors, and hooks for type safety.
 */
// ...existing code...
import type { FunctionalAction, FunctionalState } from "@/lib/fp-contexts";

/**
 * MultistepAction - Action type for multistep context reducer.
 */
export interface MultistepAction extends FunctionalAction {
  type:
    | "SET_STEPS"
    | "GO_TO_STEP"
    | "GO_TO_NEXT_STEP"
    | "GO_TO_PREVIOUS_STEP"
    | "JUMP_TO_STEP"
    | "COMPLETE_STEP"
    | "SKIP_STEP"
    | "UNSKIP_STEP"
    | "SET_STEP_DATA"
    | "UPDATE_STEP_DATA"
    | "CLEAR_STEP_DATA"
    | "VALIDATE_STEP"
    | "VALIDATE_ALL_STEPS"
    | "SET_FORM_CONTEXT"
    | "UPDATE_FORM_CONTEXT"
    | "RESET_FORM"
    | "ADD_NAVIGATION_ENTRY";
  payload?: unknown;
}

/**
 * MultistepProviderProps - Props for MultistepProvider component.
 */
export interface MultistepProviderProps {
  steps: StepDefinition[];
  children: React.ReactNode;
  initialStepIndex?: number;
  initialFormContext?: Record<string, unknown>;
}

/**
 * StepDefinition - Defines a single step in the multistep form.
 */
export interface StepDefinition {
  id: string;
  title: string;
  description?: string;
  isOptional?: boolean;
  validationRules?: ValidationRule[];
  dependencies?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * ValidationRule - Rule for validating a step.
 */
export interface ValidationRule {
  id: string;
  message: string;
  validator: (data: unknown) => boolean;
}

/**
 * StepValidationResult - Result of validating a step.
 */
export interface StepValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * NavigationHistoryEntry - Entry for navigation history in multistep context.
 */
export interface NavigationHistoryEntry {
  fromStepId: string;
  toStepId: string;
  timestamp: number;
  action: "next" | "back" | "jump" | "skip";
  data?: unknown;
}

/**
 * MultistepData - State shape for multistep context.
 */
export interface MultistepData {
  steps: StepDefinition[];
  currentStepIndex: number;
  currentStepId: string;
  completedSteps: Set<string>;
  skippedSteps: Set<string>;
  stepData: Record<string, unknown>;
  validationResults: Record<string, StepValidationResult>;
  canGoBack: boolean;
  canGoNext: boolean;
  canComplete: boolean;
  navigationHistory: NavigationHistoryEntry[];
  formContext: Record<string, unknown>;
}

/**
 * MultistepState - State type for multistep context.
 */
export type MultistepState = FunctionalState<MultistepData> | "RESET_FORM";
