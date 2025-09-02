"use client";
/**
 * GiftContext: Isolated context for gift management logic.
 * Provides immutable state management and action-based updates for gifts.
 * Uses functional programming patterns for state, actions, and error handling.
 */

import React from "react";
import { Gift } from "@/database/models/gift.model";
import {
  createFunctionalContext,
  FunctionalAction,
  FunctionalState,
} from "@/utils/fp-contexts";
import { loggingMiddleware } from "@/utils/fp-contexts";
import { validationMiddleware } from "@/utils/fp-contexts";
import { persistenceMiddleware } from "@/app/middleware/persistenceMiddleware";
import { Result, Maybe, some, none, success, failure } from "@/utils/fp";
import { withErrorBoundary } from "@/components/ErrorBoundary";
import { isGiftInList, areGiftsEqual } from "@/utils/utils";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

// Minimal GiftAction type definition to resolve type errors
export interface GiftAction {
  type:
    | "SET_GIFT_LIST"
    | "ADD_GIFT"
    | "REMOVE_GIFT"
    | "CLEAR_GIFTS"
    | "SET_SEARCH_QUERY"
    | "UPDATE_FILTERS"
    | "RESET_FILTERS";
  payload?: unknown;
}

export interface GiftState
  extends FunctionalState<{
    giftList: Gift[];
    applicantGifts: Gift[];
    searchQuery: string;
    filters: {
      showAvailable: boolean;
      priceRange: { min: number; max: number };
      categories: string[];
    };
  }> {}

// ============================================================================
// INITIAL STATE AND REDUCER
// ============================================================================

/**
 * Creates the initial state for the gift context.
 * @param giftList - Initial list of gifts
 * @returns GiftState
 */
const createGiftInitialState = (giftList: Gift[] = []): GiftState => ({
  data: {
    giftList,
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

/**
 * Reducer for gift context actions.
 * Returns a Result<GiftState, Error> for all state transitions.
 */
const giftReducer = (
  state: GiftState,
  action: GiftAction
): Result<GiftState, Error> => {
  switch (action.type) {
    case "SET_GIFT_LIST":
      return success({
        ...state,
        data: {
          ...state.data,
          giftList: Array.isArray(action.payload) ? action.payload : [],
        },
      });
    case "ADD_GIFT": {
      if (!action.payload || typeof action.payload !== "object") {
        return failure(new Error("Invalid gift data"));
      }
      const gift = action.payload as Gift;
      const alreadyAdded = isGiftInList(state.data.applicantGifts, gift);
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
    }
    case "REMOVE_GIFT": {
      if (!action.payload || typeof action.payload !== "string") {
        return failure(new Error("Invalid gift ID"));
      }
      return success({
        ...state,
        data: {
          ...state.data,
          applicantGifts: state.data.applicantGifts.filter(
            (gift) => !areGiftsEqual(gift, action.payload)
          ),
        },
      });
    }
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
          searchQuery: typeof action.payload === "string" ? action.payload : "",
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

/**
 * Validation middleware for gift actions.
 * Ensures business rules are enforced before state changes.
 */
const giftValidation = validationMiddleware<GiftState, GiftAction>(
  (action, state) => {
    switch (action.type) {
      case "ADD_GIFT":
        if (!action.payload) {
          return failure("Gift data is required");
        }
        if (!isGiftInList(state.data.giftList, action.payload)) {
          return failure("Gift not found in gift list");
        }
        if (state.data.applicantGifts.length >= 5) {
          return failure("Maximum 5 gifts allowed per applicant");
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

/**
 * Creates the functional context for gifts, with logging, validation, and persistence middleware.
 */
const contextResult = createFunctionalContext<GiftState, GiftAction>({
  name: "Gift",
  initialState: createGiftInitialState([]),
  reducer: giftReducer,
  middleware: [
    loggingMiddleware,
    giftValidation,
    persistenceMiddleware("gift-context", {
      exclude: ["loading", "error", "lastUpdated", "version"],
    }),
  ],
  debugMode: process.env.NODE_ENV === "development",
});

/** GiftContext - React context for gift state */
export const GiftContext = contextResult.Context;
/** BaseGiftProvider - Low-level provider for advanced usage */
export const BaseGiftProvider = contextResult.Provider;
/** useGiftContext - Hook to access gift context */
export const useGiftContext = contextResult.useContext;
/** useGiftContextResult - Hook to access context result */
export const useGiftContextResult = contextResult.useContextResult;
/** useGiftSelector - Hook to select state from context */
export const useGiftSelector = contextResult.useSelector as <
  TSelected = unknown
>(
  selector: (state: GiftState) => TSelected
) => Maybe<TSelected>;
/** useGiftActions - Hook to access context actions */
export const useGiftActions = contextResult.useActions;

type GiftProviderProps = {
  giftList?: Gift[];
  children: React.ReactNode;
};

/**
 * GiftProvider: Supplies gift context to child components.
 * @param giftList - Initial list of gifts
 * @param children - React children
 */
const GiftProviderComponent: React.FC<GiftProviderProps> = ({
  giftList = [],
  children,
}) => {
  const initialData = React.useMemo(
    () => createGiftInitialState(giftList),
    [giftList]
  );
  return (
    <BaseGiftProvider initialState={initialData}>{children}</BaseGiftProvider>
  );
};

// Apply error boundary to the provider
export const GiftProvider = withErrorBoundary(
  GiftProviderComponent,
  "GiftContext",
  <div>Failed to load Gift context. Please refresh the page.</div>
);

/**
 * GiftContextExports: Named exports for all context APIs.
 */
const GiftContextExports = {
  GiftProvider,
  useGiftContext,
  useGiftContextResult,
  useGiftSelector,
  useGiftActions,
};

export default GiftContextExports;
