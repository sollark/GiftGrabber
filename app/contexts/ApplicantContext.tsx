"use client";
/**
 * ApplicantContext.tsx
 *
 * Purpose: Functional React context for applicant selection and management with type-safe operations
 *
 * Main Responsibilities:
 * - Manages applicant list state and individual applicant selection
 * - Provides type-safe applicant selection with Maybe types for null safety
 * - Implements functional programming patterns with immutable state updates
 * - Offers middleware integration for logging, validation, and persistence
 * - Enables safe applicant operations with proper error handling
 *
 * Architecture Role:
 * - Core context for gift recipient management throughout the application
 * - Foundation for gift assignment and order creation workflows
 * - Provides isolated state management for applicant-specific operations
 * - Enables component-level applicant selection without prop drilling
 * - Critical for multi-step gift selection and order processing flows
 *
 * @businessLogic
 * - Maintains list of eligible gift recipients (applicants) for events
 * - Tracks currently selected applicant for gift assignment operations
 * - Validates applicant data integrity through type guards
 * - Prevents duplicate applicant entries in the list
 * - Supports applicant clearing for workflow resets
 *
 * ApplicantContext: Functional context for managing applicant state and actions.
 * Follows functional programming principles: immutability, pure functions, composable hooks.
 * Provides: ApplicantProvider, useApplicantContext, useApplicantSelector, useApplicantActions, useApplicantSelection.
 */

import React from "react";
import useSafeContext from "@/app/hooks/useSafeContext";
import { Person } from "@/database/models/person.model";
import { Result, Maybe, some, none, success, failure } from "@/utils/fp";
import {
  createFunctionalContext,
  FunctionalState,
  loggingMiddleware,
  validationMiddleware,
} from "@/utils/fp-contexts";
import { persistenceMiddleware } from "@/app/middleware/persistenceMiddleware";
import { withErrorBoundary } from "@/components/ErrorBoundary";
import { isPersonInList } from "@/utils/utils";
import ErrorMessage from "@/components/ui/ErrorMessage";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * ApplicantState: State structure for the applicant context.
 * - applicantList: list of Person objects
 * - selectedApplicant: Maybe<Person> for safe selection
 */
export interface ApplicantState
  extends FunctionalState<{
    applicantList: Person[];
    selectedApplicant: Maybe<Person>;
  }> {}

/**
 * ApplicantAction: Action types for the applicant reducer.
 */
/**
 * ApplicantAction: Discriminated union for type-safe actions
 */
export type ApplicantAction =
  | { type: "SET_EVENT_APPLICANTS"; payload: { applicantList: Person[] } }
  | { type: "SELECT_APPLICANT"; payload: Person };

// ============================================================================
// INITIAL STATE AND REDUCER
// ============================================================================

/**
 * createInitialState
 * @param eventId - Event identifier
 * @param applicantList - List of Person objects
 * @returns ApplicantState
 */
/**
 * Creates the initial state for ApplicantContext.
 * @param applicantList - List of applicants
 * @returns ApplicantState
 */
const createInitialState = (applicantList: Person[] = []): ApplicantState => ({
  data: {
    applicantList,
    selectedApplicant: none,
  },
  loading: false,
  error: none,
  lastUpdated: Date.now(),
  version: 0,
});

/**
 * applicantReducer
 * Pure reducer for applicant state.
 * @param state - Current ApplicantState
 * @param action - ApplicantAction to process
 * @returns Result<ApplicantState, Error>
 */
const applicantReducer = (
  state: ApplicantState,
  action: ApplicantAction | { type: string; payload?: any }
): Result<ApplicantState, Error> => {
  switch (action.type) {
    case "SET_EVENT_APPLICANTS": {
      const { applicantList } = action.payload;
      return success({
        ...state,
        data: {
          ...state.data,
          applicantList: applicantList ?? state.data.applicantList,
        },
      });
    }
    case "SELECT_APPLICANT": {
      // Return none if payload is null/undefined, otherwise wrap in some()
      const selected = action.payload ? some(action.payload) : none;
      return success({
        ...state,
        data: {
          ...state.data,
          selectedApplicant: selected,
        },
      });
    }
    default:
      return failure(new Error(`Unknown action type: ${action.type}`));
  }
};

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

/**
 * applicantValidation
 * Middleware to validate applicant actions.
 */
const applicantValidation = validationMiddleware<
  ApplicantState,
  ApplicantAction
>((action, state) => {
  switch (action.type) {
    case "SELECT_APPLICANT":
      if (!action.payload) {
        return failure("Applicant data is required");
      }
      if (!isPersonInList(state.data.applicantList, action.payload as Person)) {
        return failure("Applicant not found in applicant list");
      }
      return success(true);
    default:
      return success(true);
  }
});

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const contextResult = createFunctionalContext<ApplicantState, ApplicantAction>({
  name: "Applicant",
  initialState: createInitialState([]),
  reducer: applicantReducer,
  middleware: [
    loggingMiddleware,
    applicantValidation,
    persistenceMiddleware("applicant-context", {
      exclude: ["loading", "error", "lastUpdated", "version"],
    }),
  ],
  debugMode: process.env.NODE_ENV === "development",
});

export const ApplicantContext = contextResult.Context;
const BaseApplicantProvider = contextResult.Provider;
export function useApplicantContext() {
  return useSafeContext(ApplicantContext, "ApplicantContext");
}

// ============================================================================
// ENHANCED PROVIDER WITH ERROR BOUNDARY
// ============================================================================

/**
 * ApplicantProvider
 * Provider component for ApplicantContext with error boundary protection.
 * @param eventId - Event identifier
 * @param applicantList - List of Person objects
 * @param children - React children
 */

type ApplicantProviderProps = {
  applicantList?: Person[];
  children: React.ReactNode;
};

const ApplicantProviderComponent: React.FC<ApplicantProviderProps> = ({
  applicantList = [],
  children,
}) => {
  const initialData = React.useMemo(
    () => createInitialState(applicantList),
    [applicantList]
  );
  return (
    <BaseApplicantProvider initialState={initialData}>
      {children}
    </BaseApplicantProvider>
  );
};

// Apply error boundary to the provider
export const ApplicantProvider = withErrorBoundary(
  ApplicantProviderComponent,
  "ApplicantContext",
  <ErrorMessage message="Failed to load Applicant context. Please refresh the page." />
);

// ============================================================================
// ENHANCED HOOKS FOR COMMON OPERATIONS
// ============================================================================

/**
 * useApplicantList
 * Hook for accessing the applicant list from context.
 * @returns Maybe<Person[]> - The current applicant list
 */
/**
 * useApplicantList
 * Hook for accessing the applicant list from context.
 * @returns Person[] - The current applicant list
 */
export const useApplicantList = () => {
  const context = useApplicantContext();
  return context.state.data.applicantList;
};

/**
 * useSelectedApplicant
 * Hook for accessing the selected applicant from context (read-only).
 * @returns Maybe<Person> - The currently selected applicant
 */
/**
 * useSelectedApplicant
 * Hook for accessing the selected applicant from context (read-only).
 * @returns Maybe<Person> - The currently selected applicant
 */
export const useSelectedApplicant = (): Maybe<Person> => {
  const context = useApplicantContext();
  return context.state.data.selectedApplicant;
};

// ============================================================================
// COMPUTED VALUES AND SELECTORS
// ============================================================================

const ApplicantContextExports = {
  ApplicantProvider,
  useApplicantContext,
  useApplicantList,
  useSelectedApplicant,
};

export default ApplicantContextExports;
