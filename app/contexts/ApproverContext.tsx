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
  persistenceMiddleware,
} from "@/lib/fp-contexts";
import { Result, Maybe, some, none, success, failure } from "@/lib/fp-utils";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ApproverState
  extends FunctionalState<{
    eventId: string;
    approverList: Person[];
    selectedApprover: Maybe<Person>;
  }> {}

export interface ApproverAction extends FunctionalAction {
  type: "SET_EVENT_DATA" | "SELECT_APPROVER" | "CLEAR_APPROVER";
  payload?: unknown;
}

// ============================================================================
// INITIAL STATE AND REDUCER
// ============================================================================

const createInitialState = (
  eventId: string,
  approverList: Person[] = []
): ApproverState => ({
  data: {
    eventId,
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
    case "SET_EVENT_DATA":
      return success({
        ...state,
        data: {
          ...state.data,
          eventId:
            typeof action.payload === "object" &&
            action.payload !== null &&
            "eventId" in action.payload
              ? (action.payload as { eventId?: string }).eventId ??
                state.data.eventId
              : state.data.eventId,
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
          !state.data.approverList.some(
            (p) =>
              "_id" in p &&
              "_id" in (action.payload as Person) &&
              p._id === (action.payload as Person)._id
          )
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
  initialState: createInitialState("", []),
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

interface ApproverProviderProps {
  eventId: string;
  approverList: Person[];
  children: React.ReactNode;
}

export const ApproverProvider: React.FC<ApproverProviderProps> = ({
  eventId,
  approverList,
  children,
}) => {
  const initialData = React.useMemo(
    () => createInitialState(eventId, approverList),
    [eventId, approverList]
  );

  return (
    <BaseApproverProvider initialState={initialData}>
      {children}
    </BaseApproverProvider>
  );
};

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
