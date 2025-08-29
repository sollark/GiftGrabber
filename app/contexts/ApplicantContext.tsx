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
import { Person } from "@/database/models/person.model";
import { Result, Maybe, some, none, success, failure } from "@/utils/fp";
import {
  createFunctionalContext,
  FunctionalAction,
  FunctionalState,
  loggingMiddleware,
  validationMiddleware,
} from "@/utils/fp-contexts";
import { persistenceMiddleware } from "@/app/middleware/persistenceMiddleware";
import { withErrorBoundary } from "@/components/ErrorBoundary";
import { isPersonInList } from "@/utils/utils";

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
export interface ApplicantAction extends FunctionalAction {
  type: "SET_EVENT_APPLICANTS" | "SELECT_APPLICANT" | "CLEAR_APPLICANT";
  payload?: unknown;
}

// ============================================================================
// REDUCER HELPERS
// ============================================================================

/**
 * Type guard for event data payload
 */
const isEventDataPayload = (
  payload: unknown
): payload is { applicantList?: Person[] } => {
  return typeof payload === "object" && payload !== null;
};

/**
 * Type guard for person payload
 * Checks if payload has the required sourceFormat field (only required field in Person)
 */
const isPersonPayload = (payload: unknown): payload is Person => {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "sourceFormat" in payload &&
    typeof (payload as any).sourceFormat === "string"
  );
};

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
  action: ApplicantAction
): Result<ApplicantState, Error> => {
  switch (action.type) {
    case "SET_EVENT_APPLICANTS": {
      if (!isEventDataPayload(action.payload)) {
        return failure(new Error("Invalid event data payload"));
      }
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
      if (!isPersonPayload(action.payload)) {
        return failure(new Error("Invalid applicant data"));
      }
      return success({
        ...state,
        data: {
          ...state.data,
          selectedApplicant: some(action.payload),
        },
      });
    }

    case "CLEAR_APPLICANT":
      return success({
        ...state,
        data: {
          ...state.data,
          selectedApplicant: none,
        },
      });
    default:
      return failure(new Error(`Unknown action type: ${action.type}`));
  }
};

// CONTEXT CREATION is below, after applicantValidation is defined

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
export const BaseApplicantProvider = contextResult.Provider;
export const useApplicantContext = contextResult.useContext;
export const useApplicantContextResult = contextResult.useContextResult;

/**
 * useApplicantSelector
 * A typed selector hook for accessing specific slices of the ApplicantContext state.
 * @param selector - Function to select part of the state
 * @returns Maybe<TSelected>
 */
export const useApplicantSelector = contextResult.useSelector as <
  TSelected = unknown
>(
  selector: (state: ApplicantState) => TSelected
) => Maybe<TSelected>;

/**
 * useApplicantActions
 * Hook to access action creators and safe/async dispatchers for the ApplicantContext.
 * @returns Maybe<{ dispatch, dispatchSafe, dispatchAsync, createAction, getState }>
 */
export const useApplicantActions = contextResult.useActions;

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
  <div>Failed to load Applicant context. Please refresh the page.</div>
);

// ============================================================================
// ENHANCED HOOKS FOR COMMON OPERATIONS
// ============================================================================

/**
 * useApplicantSelection
 * Hook for applicant selection operations.
 * @returns Object with selection state and actions
 */
export const useApplicantSelection = () => {
  const actions = useApplicantActions();
  const selectedApplicant = useApplicantSelector(
    (state) => state.data.selectedApplicant
  );
  const applicantList = useApplicantSelector(
    (state) => state.data.applicantList
  );

  const selectApplicant = React.useCallback(
    (person: Person) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "SELECT_APPLICANT",
          payload: person,
        });
      }
      return failure(new Error("Applicant context not available"));
    },
    [actions]
  );

  const clearApplicant = React.useCallback(() => {
    if (actions._tag === "Some") {
      return actions.value.dispatchSafe({
        type: "CLEAR_APPLICANT",
      });
    }
    return failure(new Error("Applicant context not available"));
  }, [actions]);

  return {
    selectedApplicant,
    applicantList,
    selectApplicant,
    clearApplicant,
    hasSelection:
      selectedApplicant._tag === "Some" &&
      selectedApplicant.value._tag === "Some",
  };
};

// ============================================================================
// COMPUTED VALUES AND SELECTORS
// ============================================================================

const ApplicantContextExports = {
  ApplicantProvider,
  useApplicantContext,
  useApplicantContextResult,
  useApplicantSelector,
  useApplicantActions,
  useApplicantSelection,
};

export default ApplicantContextExports;
