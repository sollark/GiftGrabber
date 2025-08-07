/**
 * Enhanced  ApplicantContext with functional programming patterns
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
type ApplicantDataState = FunctionalState<ApplicantState["data"]>;

export interface ApplicantState
  extends FunctionalState<{
    eventId: string;
    approverList: Person[];
    applicantList: Person[];
    giftList: Gift[];
    selectedApplicant: Maybe<Person>;
    selectedPerson: Maybe<Person>;
    applicantGifts: Gift[];
    searchQuery: string;
    filters: {
      showAvailable: boolean;
      priceRange: { min: number; max: number };
      categories: string[];
    };
  }> {}

export interface ApplicantAction extends FunctionalAction {
  type:
    | "SET_EVENT_DATA"
    | "SELECT_APPLICANT"
    | "CLEAR_APPLICANT"
    | "SELECT_PERSON"
    | "CLEAR_PERSON"
    | "ADD_GIFT"
    | "REMOVE_GIFT"
    | "CLEAR_GIFTS"
    | "SET_SEARCH_QUERY"
    | "UPDATE_FILTERS"
    | "RESET_FILTERS";
  payload?: any;
}

// ============================================================================
// INITIAL STATE AND REDUCER
// ============================================================================

const createInitialState = (
  eventId: string,
  approverList: Person[] = [],
  applicantList: Person[] = [],
  giftList: Gift[] = []
): ApplicantState => ({
  data: {
    eventId,
    approverList,
    applicantList,
    giftList,
    selectedApplicant: none,
    selectedPerson: none,
    applicantGifts: [],
    searchQuery: "",
    filters: {
      showAvailable: true,
      priceRange: { min: 0, max: 1000 },
      categories: [],
    },
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
          giftList: action.payload.giftList || state.data.giftList,
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
          applicantGifts: [], // Clear gifts when applicant is cleared
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

    case "ADD_GIFT":
      if (!action.payload || typeof action.payload !== "object") {
        return failure(new Error("Invalid gift data"));
      }

      const gift = action.payload as Gift;
      const alreadyAdded = state.data.applicantGifts.some(
        (g) => g._id === gift._id
      );

      if (alreadyAdded) {
        return failure(new Error("Gift already added"));
      }

      return success({
        ...state,
        data: {
          ...state.data,
          applicantGifts: [...state.data.applicantGifts, gift],
        },
      });

    case "REMOVE_GIFT":
      if (!action.payload || typeof action.payload !== "string") {
        return failure(new Error("Invalid gift ID"));
      }

      return success({
        ...state,
        data: {
          ...state.data,
          applicantGifts: state.data.applicantGifts.filter(
            (gift) => gift._id !== action.payload
          ),
        },
      });

    case "CLEAR_GIFTS":
      return success({
        ...state,
        data: {
          ...state.data,
          applicantGifts: [],
        },
      });

    case "SET_SEARCH_QUERY":
      return success({
        ...state,
        data: {
          ...state.data,
          searchQuery: action.payload || "",
        },
      });

    case "UPDATE_FILTERS":
      if (!action.payload || typeof action.payload !== "object") {
        return failure(new Error("Invalid filter data"));
      }

      return success({
        ...state,
        data: {
          ...state.data,
          filters: {
            ...state.data.filters,
            ...action.payload,
          },
        },
      });

    case "RESET_FILTERS":
      return success({
        ...state,
        data: {
          ...state.data,
          filters: {
            showAvailable: true,
            priceRange: { min: 0, max: 1000 },
            categories: [],
          },
          searchQuery: "",
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

    case "ADD_GIFT":
      if (!action.payload) {
        return failure("Gift data is required");
      }
      if (!state.data.giftList.some((g) => g._id === action.payload._id)) {
        return failure("Gift not found in gift list");
      }
      if (state.data.applicantGifts.length >= 5) {
        return failure("Maximum 5 gifts allowed per applicant");
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
  initialState: createInitialState("", [], [], []),
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
  giftList: Gift[];
  children: React.ReactNode;
}

export const ApplicantProvider: React.FC<ApplicantProviderProps> = ({
  eventId,
  approverList,
  applicantList,
  giftList,
  children,
}) => {
  const initialData = React.useMemo(
    () => createInitialState(eventId, approverList, applicantList, giftList),
    [eventId, approverList, applicantList, giftList]
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
 * Hook for gift management operations
 */
export const useGiftManagement = () => {
  const actions = useApplicantActions();
  const applicantGifts = useApplicantSelector(
    (state: any) => state.applicantGifts
  );
  const giftList = useApplicantSelector((state: any) => state.giftList);
  const searchQuery = useApplicantSelector((state: any) => state.searchQuery);
  const filters = useApplicantSelector((state: any) => state.filters);

  const addGift = React.useCallback(
    (gift: Gift) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "ADD_GIFT",
          payload: gift,
        });
      }
      return failure(new Error("Applicant context not available"));
    },
    [actions]
  );

  const removeGift = React.useCallback(
    (giftId: string) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "REMOVE_GIFT",
          payload: giftId,
        });
      }
      return failure(new Error("Applicant context not available"));
    },
    [actions]
  );

  const clearGifts = React.useCallback(() => {
    if (actions._tag === "Some") {
      return actions.value.dispatchSafe({
        type: "CLEAR_GIFTS",
      });
    }
    return failure(new Error("Applicant context not available"));
  }, [actions]);

  const setSearchQuery = React.useCallback(
    (query: string) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "SET_SEARCH_QUERY",
          payload: query,
        });
      }
      return failure(new Error("Applicant context not available"));
    },
    [actions]
  );

  const updateFilters = React.useCallback(
    (newFilters: Partial<ApplicantState["data"]["filters"]>) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "UPDATE_FILTERS",
          payload: newFilters,
        });
      }
      return failure(new Error("Applicant context not available"));
    },
    [actions]
  );

  // Computed filtered gifts
  const filteredGifts = React.useMemo(() => {
    if (
      giftList._tag !== "Some" ||
      filters._tag !== "Some" ||
      searchQuery._tag !== "Some"
    ) {
      return [];
    }

    const gifts = giftList.value;
    const currentFilters = filters.value;
    const query = searchQuery.value.toLowerCase();

    return gifts.filter((gift: any) => {
      // Search query filter
      if (query && !gift.name.toLowerCase().includes(query)) {
        return false;
      }

      // Available filter
      if (currentFilters.showAvailable && gift.claimed) {
        return false;
      }

      // Price range filter
      if (
        gift.price < currentFilters.priceRange.min ||
        gift.price > currentFilters.priceRange.max
      ) {
        return false;
      }

      // Category filter
      if (
        currentFilters.categories.length > 0 &&
        !currentFilters.categories.includes(gift.category)
      ) {
        return false;
      }

      return true;
    });
  }, [giftList, filters, searchQuery]);

  return {
    applicantGifts,
    giftList,
    filteredGifts,
    searchQuery,
    filters,
    addGift,
    removeGift,
    clearGifts,
    setSearchQuery,
    updateFilters,
    giftCount: applicantGifts._tag === "Some" ? applicantGifts.value.length : 0,
    canAddMore:
      applicantGifts._tag === "Some" ? applicantGifts.value.length < 5 : true,
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

/**
 * Hook for computed applicant data
 */
export const useApplicantComputed = () => {
  const selectedApplicant = useApplicantSelector(
    (state: any) => state.selectedApplicant
  );
  const applicantGifts = useApplicantSelector(
    (state: any) => state.applicantGifts
  );

  const totalGiftValue = React.useMemo(() => {
    if (applicantGifts._tag !== "Some") return 0;
    return applicantGifts.value.reduce(
      (sum: any, gift: any) => sum + gift.price,
      0
    );
  }, [applicantGifts]);

  const giftSummary = React.useMemo(() => {
    if (applicantGifts._tag !== "Some") return null;

    const gifts = applicantGifts.value;
    return {
      count: gifts.length,
      totalValue: totalGiftValue,
      categories: [...new Set(gifts.map((g: any) => g.category))],
      averagePrice: gifts.length > 0 ? totalGiftValue / gifts.length : 0,
    };
  }, [applicantGifts, totalGiftValue]);

  const canSubmitOrder = React.useMemo(() => {
    return (
      selectedApplicant._tag === "Some" &&
      selectedApplicant.value._tag === "Some" &&
      applicantGifts._tag === "Some" &&
      applicantGifts.value.length > 0
    );
  }, [selectedApplicant, applicantGifts]);

  return {
    selectedApplicant,
    applicantGifts,
    totalGiftValue,
    giftSummary,
    canSubmitOrder,
  };
};

const ApplicantContextExports = {
  ApplicantProvider,
  useApplicantContext,
  useApplicantContextResult,
  useApplicantSelector,
  useApplicantActions,
  useApplicantSelection,
  useGiftManagement,
  usePersonSelection,
  useApplicantComputed,
};

export default ApplicantContextExports;
