/**
 * types.ts
 * Purpose: Declares TypeScript types and interfaces for multistep context.
 * Responsibilities: Defines shape of state, actions, steps, and related entities.
 * Architecture: Shared by reducer, context, selectors, and hooks for type safety.
 */
// ...existing code...
import type { FunctionalAction, FunctionalState } from "@/utils/fp-contexts";

/**
 * MultistepAction - Action type for multistep context reducer.
 * Core navigation and data management actions only.
 */
export interface MultistepAction extends FunctionalAction {
  type:
    | "SET_STEPS"
    | "GO_TO_STEP"
    | "GO_TO_NEXT_STEP"
    | "GO_TO_PREVIOUS_STEP"
    | "COMPLETE_STEP"
    | "SKIP_STEP"
    | "UNSKIP_STEP"
    | "SET_STEP_DATA"
    | "UPDATE_STEP_DATA"
    | "CLEAR_STEP_DATA";
  payload?: unknown;
}

/**
 * MultistepProviderProps - Props for MultistepProvider component.
 * Simplified to only include essential step configuration.
 */
export interface MultistepProviderProps {
  steps: StepDefinition[];
  children: React.ReactNode;
  initialStepIndex?: number;
}

/**
 * StepDefinition - Defines a single step in the multistep form.
 * Simplified to core navigation and metadata only.
 */
export interface StepDefinition {
  id: string;
  title: string;
  description?: string;
  isOptional?: boolean;
  dependencies?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * MultistepData - Core state shape for multistep context.
 * Contains only essential navigation and step data management.
 */
export interface MultistepData {
  steps: StepDefinition[];
  currentStepIndex: number;
  currentStepId: string;
  completedSteps: Set<string>;
  skippedSteps: Set<string>;
  stepData: Record<string, unknown>;
  canGoBack: boolean;
  canGoNext: boolean;
  canComplete: boolean;
}

/**
 * MultistepState - Simplified state type for multistep context.
 */
export type MultistepState = FunctionalState<MultistepData>;
