import type { FunctionalAction } from "@/lib/fp-contexts";

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

export interface MultistepProviderProps {
  steps: StepDefinition[];
  children: React.ReactNode;
  initialStepIndex?: number;
  initialFormContext?: Record<string, unknown>;
}
/**
 * Types and interfaces for MultistepContext
 * Decomposed from MultistepContext.tsx for modularity and clarity
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

export interface ValidationRule {
  id: string;
  message: string;
  validator: (data: unknown) => boolean;
}

export interface StepValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface NavigationHistoryEntry {
  fromStepId: string;
  toStepId: string;
  timestamp: number;
  action: "next" | "back" | "jump" | "skip";
  data?: unknown;
}

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
