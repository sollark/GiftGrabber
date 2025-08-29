"use client";
/**
 * ApproverContext: Functional context for managing approver state and actions.
 * Follows functional programming principles: immutability, pure functions, composable hooks.
 * Provides: ApproverProvider, useApproverContext, useApproverSelector, useApproverActions, useApproverSelection.
 */

import React from "react";
import { Person } from "@/database/models/person.model";

import {
  createFunctionalContext,
  FunctionalAction,
  FunctionalState,
  loggingMiddleware,
  validationMiddleware,
} from "@/utils/fp-contexts";
import { persistenceMiddleware } from "@/app/middleware/persistenceMiddleware";
import { Result, Maybe, some, none, success, failure } from "@/utils/fp";
import { withErrorBoundary } from "@/components/ErrorBoundary";
import { isPersonInList } from "@/utils/utils";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ApproverState
  extends FunctionalState<{
    approverList: Person[];
    selectedApprover: Maybe<Person>;
  }> {}

export interface ApproverAction extends FunctionalAction {
  type: "SET_EVENT_APPROVERS" | "SELECT_APPROVER" | "CLEAR_APPROVER";
  payload?: unknown;
}

// ============================================================================
// INITIAL STATE AND REDUCER
// ============================================================================

/**
 * Creates the initial state for ApproverContext.
 * @param approverList - List of approvers
 * @returns ApproverState
 */
const createInitialState = (approverList: Person[] = []): ApproverState => ({
  data: {
    approverList,
    selectedApprover: none,
  },
  loading: false,
  error: none,
  lastUpdated: Date.now(),
  version: 0,
});

const approverReducer = (
  state: ApproverState,
  action: ApproverAction
): Result<ApproverState, Error> => {
  switch (action.type) {
    case "SET_EVENT_APPROVERS":
      return success({
        ...state,
        data: {
          ...state.data,
          approverList:
            typeof action.payload === "object" &&
            action.payload !== null &&
            "approverList" in action.payload
              ? (action.payload as { approverList?: Person[] }).approverList ??
                state.data.approverList
              : state.data.approverList,
        },
      });

    case "SELECT_APPROVER":
      if (!action.payload || typeof action.payload !== "object") {
        return failure(new Error("Invalid approver data"));
      }
      return success({
        ...state,
        data: {
          ...state.data,
          selectedApprover: some(action.payload as Person),
        },
      });

    case "CLEAR_APPROVER":
      return success({
        ...state,
        data: {
          ...state.data,
          selectedApprover: none,
        },
      });

    default:
      return failure(new Error(`Unknown action type: ${action.type}`));
  }
};

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const approverValidation = validationMiddleware<ApproverState, ApproverAction>(
  (action, state) => {
    switch (action.type) {
      case "SELECT_APPROVER":
        if (!action.payload) {
          return failure("Approver data is required");
        }
        if (
          !isPersonInList(state.data.approverList, action.payload as Person)
        ) {
          return failure("Approver not found in approver list");
        }
        return success(true);
      default:
        return success(true);
    }
  }
);

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const contextResult = createFunctionalContext<ApproverState, ApproverAction>({
  name: "Approver",
  initialState: createInitialState([]),
  reducer: approverReducer,
  middleware: [
    loggingMiddleware,
    approverValidation,
    persistenceMiddleware("approver-context", {
      exclude: ["loading", "error", "lastUpdated", "version"],
    }),
  ],
  debugMode: process.env.NODE_ENV === "development",
});

export const ApproverContext = contextResult.Context;
export const BaseApproverProvider = contextResult.Provider;
export const useApproverContext = contextResult.useContext;
export const useApproverContextResult = contextResult.useContextResult;

/**
 * useApproverSelector
 *
 * A typed selector hook for accessing specific slices of the ApproverContext state.
 * Usage:
 *   - Pass a selector function that receives the context state and returns the value you want.
 *   - The return value is always wrapped in a Maybe (Some/None) for safe functional access.
 */
export const useApproverSelector = contextResult.useSelector as <
  TSelected = unknown
>(
  selector: (state: ApproverState) => TSelected
) => Maybe<TSelected>;

export const useApproverActions = contextResult.useActions;

// ============================================================================
// ENHANCED PROVIDER WITH PROPS
// ============================================================================

type ApproverProviderProps = {
  approverList?: Person[];
  children: React.ReactNode;
};

const ApproverProviderComponent: React.FC<ApproverProviderProps> = ({
  approverList = [],
  children,
}) => {
  const initialData = React.useMemo(
    () => createInitialState(approverList),
    [approverList]
  );
  return (
    <BaseApproverProvider initialState={initialData}>
      {children}
    </BaseApproverProvider>
  );
};

// Apply error boundary to the provider
export const ApproverProvider = withErrorBoundary(
  ApproverProviderComponent,
  "ApproverContext",
  <div>Failed to load Approver context. Please refresh the page.</div>
);

// ============================================================================
// ENHANCED HOOKS FOR COMMON OPERATIONS
// ============================================================================

/**
 * Hook for approver selection operations
 */
export const useApproverSelection = () => {
  const actions = useApproverActions();
  const selectedApprover = useApproverSelector(
    (state) => state.data.selectedApprover
  );
  const approverList = useApproverSelector((state) => state.data.approverList);

  const selectApprover = React.useCallback(
    (person: Person) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "SELECT_APPROVER",
          payload: person,
        });
      }
      return failure(new Error("Approver context not available"));
    },
    [actions]
  );

  const clearApprover = React.useCallback(() => {
    if (actions._tag === "Some") {
      return actions.value.dispatchSafe({
        type: "CLEAR_APPROVER",
      });
    }
    return failure(new Error("Approver context not available"));
  }, [actions]);

  return {
    selectedApprover,
    approverList,
    selectApprover,
    clearApprover,
    hasSelection:
      selectedApprover._tag === "Some" &&
      selectedApprover.value._tag === "Some",
  };
};

// ============================================================================
// COMPUTED VALUES AND SELECTORS
// ============================================================================

const ApproverContextExports = {
  ApproverProvider,
  useApproverContext,
  useApproverContextResult,
  useApproverSelector,
  useApproverActions,
  useApproverSelection,
};

export default ApproverContextExports;
