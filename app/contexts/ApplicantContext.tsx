/**
 * ApplicantContext: Functional context for managing applicant state and actions.
 * Follows functional programming principles: immutability, pure functions, composable hooks.
 * Provides: ApplicantProvider, useApplicantContext, useApplicantSelector, useApplicantActions, useApplicantSelection.
 */

import React from "react";
import { Person } from "@/database/models/person.model";
import {
  createFunctionalContext,
  FunctionalAction,
  FunctionalState,
} from "@/lib/fp-contexts";
import { loggingMiddleware } from "@/lib/fp-contexts";
import { validationMiddleware } from "@/lib/fp-contexts";
import { persistenceMiddleware } from "@/app/middleware/persistenceMiddleware";
import { Result, Maybe, some, none, success, failure } from "@/lib/fp-utils";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

type ApplicantDataState = FunctionalState<
  Omit<
    ApplicantState["data"],
    "giftList" | "applicantGifts" | "searchQuery" | "filters"
  >
>;

export interface ApplicantState
  extends FunctionalState<{
    eventId: string;
    applicantList: Person[];
    selectedApplicant: Maybe<Person>;
  }> {}

export interface ApplicantAction extends FunctionalAction {
  type: "SET_EVENT_DATA" | "SELECT_APPLICANT" | "CLEAR_APPLICANT";
  payload?: unknown;
}

// ============================================================================
// INITIAL STATE AND REDUCER
// ============================================================================

const createInitialState = (
  eventId: string,
  applicantList: Person[] = []
): ApplicantState => ({
  data: {
    eventId,
    applicantList,
    selectedApplicant: none,
  },
  loading: false,
  error: none,
  lastUpdated: Date.now(),
  version: 0,
});

const applicantReducer = (
  state: ApplicantState,
  action: ApplicantAction
): Result<ApplicantState, Error> => {
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
          applicantList:
            typeof action.payload === "object" &&
            action.payload !== null &&
            "applicantList" in action.payload
              ? (action.payload as { applicantList?: Person[] })
                  .applicantList ?? state.data.applicantList
              : state.data.applicantList,
        },
      });

    case "SELECT_APPLICANT":
      if (!action.payload || typeof action.payload !== "object") {
        return failure(new Error("Invalid applicant data"));
      }
      return success({
        ...state,
        data: {
          ...state.data,
          selectedApplicant: some(action.payload as Person),
        },
      });

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

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const applicantValidation = validationMiddleware<
  ApplicantState,
  ApplicantAction
>((action, state) => {
  switch (action.type) {
    case "SELECT_APPLICANT":
      if (!action.payload) {
        return failure("Applicant data is required");
      }
      if (
        !state.data.applicantList.some(
          (p) => p._id === (action.payload as Person)._id
        )
      ) {
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
  initialState: createInitialState("", []),
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
 *
 * A typed selector hook for accessing specific slices of the ApplicantContext state.
 *
 * Usage:
 *   - Pass a selector function that receives the context state and returns the value you want.
 *   - The return value is always wrapped in a Maybe (Some/None) for safe functional access.
 *   - Example: const selectedPersonMaybe = useApplicantSelector(state => state.data.selectedPerson)
 *
 * This enables robust, type-safe, and composable state selection from the ApplicantContext.
 */
export const useApplicantSelector = contextResult.useSelector as <
  TSelected = unknown
>(
  selector: (state: ApplicantState) => TSelected
) => Maybe<TSelected>;

export const useApplicantActions = contextResult.useActions;

// ============================================================================
// ENHANCED PROVIDER WITH PROPS
// ============================================================================

interface ApplicantProviderProps {
  eventId: string;
  applicantList: Person[];
  children: React.ReactNode;
}

export const ApplicantProvider: React.FC<ApplicantProviderProps> = ({
  eventId,
  applicantList,
  children,
}) => {
  const initialData = React.useMemo(
    () => createInitialState(eventId, applicantList),
    [eventId, applicantList]
  );

  return (
    <BaseApplicantProvider initialState={initialData}>
      {children}
    </BaseApplicantProvider>
  );
};

// ============================================================================
// ENHANCED HOOKS FOR COMMON OPERATIONS
// ============================================================================

/**
 * Hook for applicant selection operations
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
