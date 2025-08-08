/**
 * Enhanced ApplicantContext with functional programming patterns
 * Provides immutable state management and action-based updates
 */

import React from "react";
import { Gift } from "@/database/models/gift.model";
import { Person } from "@/database/models/person.model";
import {
  createFunctionalContext,
  FunctionalAction,
  FunctionalState,
  loggingMiddleware,
  validationMiddleware,
  persistenceMiddleware,
} from "@/lib/fp-contexts";
import {
  Result,
  Maybe,
  isMaybe,
  some,
  none,
  success,
  failure,
} from "@/lib/fp-utils";

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
    approverList: Person[];
    applicantList: Person[];
    selectedApplicant: Maybe<Person>;
    selectedPerson: Maybe<Person>;
  }> {}

export interface ApplicantAction extends FunctionalAction {
  type:
    | "SET_EVENT_DATA"
    | "SELECT_APPLICANT"
    | "CLEAR_APPLICANT"
    | "SELECT_PERSON"
    | "CLEAR_PERSON";
  payload?: any;
}

// ============================================================================
// INITIAL STATE AND REDUCER
// ============================================================================

const createInitialState = (
  eventId: string,
  approverList: Person[] = [],
  applicantList: Person[] = []
): ApplicantState => ({
  data: {
    eventId,
    approverList,
    applicantList,
    selectedApplicant: none,
    selectedPerson: none,
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
          eventId: action.payload.eventId || state.data.eventId,
          approverList: action.payload.approverList || state.data.approverList,
          applicantList:
            action.payload.applicantList || state.data.applicantList,
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

    case "SELECT_PERSON":
      if (!action.payload || typeof action.payload !== "object") {
        return failure(new Error("Invalid person data"));
      }
      return success({
        ...state,
        data: {
          ...state.data,
          selectedPerson: some(action.payload as Person),
        },
      });

    case "CLEAR_PERSON":
      return success({
        ...state,
        data: {
          ...state.data,
          selectedPerson: none,
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
      if (!state.data.applicantList.some((p) => p._id === action.payload._id)) {
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
  initialState: createInitialState("", [], []),
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

export const ApplicantContext = (contextResult as any).Context;
export const BaseApplicantProvider = (contextResult as any).Provider;
export const useApplicantContext = (contextResult as any).useContext;
export const useApplicantContextResult = (contextResult as any)
  .useContextResult;

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
  selector: (state: ApplicantDataState) => TSelected
) => Maybe<TSelected>;

export const useApplicantActions = (contextResult as any).useActions;

// ============================================================================
// ENHANCED PROVIDER WITH PROPS
// ============================================================================

interface ApplicantProviderProps {
  eventId: string;
  approverList: Person[];
  applicantList: Person[];
  children: React.ReactNode;
}

export const ApplicantProvider: React.FC<ApplicantProviderProps> = ({
  eventId,
  approverList,
  applicantList,
  children,
}) => {
  const initialData = React.useMemo(
    () => createInitialState(eventId, approverList, applicantList),
    [eventId, approverList, applicantList]
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
    (state: any) => state.selectedApplicant
  );
  const applicantList = useApplicantSelector(
    (state: any) => state.applicantList
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

/**
 * Hook for person selection operations
 */
export const usePersonSelection = () => {
  const actions = useApplicantActions();
  const selectedPerson = useApplicantSelector(
    (state: any) => state.selectedPerson
  );
  const approverList = useApplicantSelector((state: any) => state.approverList);

  const selectPerson = React.useCallback(
    (person: Person) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "SELECT_PERSON",
          payload: person,
        });
      }
      return failure(new Error("Applicant context not available"));
    },
    [actions]
  );

  const clearPerson = React.useCallback(() => {
    if (actions._tag === "Some") {
      return actions.value.dispatchSafe({
        type: "CLEAR_PERSON",
      });
    }
    return failure(new Error("Applicant context not available"));
  }, [actions]);

  return {
    selectedPerson,
    approverList,
    selectPerson,
    clearPerson,
    hasSelection:
      selectedPerson._tag === "Some" && selectedPerson.value._tag === "Some",
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
  usePersonSelection,
};

export default ApplicantContextExports;
