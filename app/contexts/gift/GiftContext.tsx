"use client";
/**
 * GiftContext.tsx
 *
 * Purpose: Provides a React context for managing gift-related state and actions in a functional, type-safe way.
 * Responsibilities:
 *   - Centralizes gift state and actions for the application.
 *   - Exposes hooks and provider for context consumers.
 *   - Integrates middleware for logging, validation, and persistence.
 *   - Ensures robust error handling via error boundary wrapping.
 *
 * No UI or styling logic is present; only context and business logic.
 */

import React from "react";
import { Gift } from "@/database/models/gift.model";
import { createFunctionalContext, FunctionalState } from "@/utils/fp-contexts";
import { loggingMiddleware, validationMiddleware } from "@/utils/fp-contexts";
import { persistenceMiddleware } from "@/app/middleware/persistenceMiddleware";
import { Result, none, success, failure } from "@/utils/fp";
import { withErrorBoundary } from "@/components/ErrorBoundary";
import { isGiftInList, areGiftsEqual } from "@/utils/utils";
import ErrorMessage from "@/components/ui/ErrorMessage";
import useSafeContext from "@/app/hooks/useSafeContext";

// =====================
// Types and Interfaces
// =====================

/**
 * GiftAction: Supported actions for gift state transitions.
 * @property type - Action type string
 * @property payload - Optional action payload
 */
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

/**
 * GiftState: Shape of the gift context state.
 * @property giftList - List of all gifts
 * @property applicantGifts - Gifts selected by applicant
 * @property searchQuery - Current search query
 * @property filters - Filter settings
 */
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

// =====================
// Initial State and Reducer
// =====================

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
 * giftReducer
 * Handles all state transitions for the gift context.
 * @param state - Current GiftState
 * @param action - GiftAction to apply
 * @returns Result<GiftState, Error> - New state or error
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

// =====================
// Validation Middleware
// =====================

/**
 * giftValidation
 * Middleware to enforce business rules before state changes.
 * @param action - GiftAction being dispatched
 * @param state - Current GiftState
 * @returns Result<boolean, string> - Success or error message
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

// =====================
// Context Creation and Hook
// =====================

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

/**
 * GiftContext: The React context object for gift state.
 */
export const GiftContext = contextResult.Context;

/**
 * BaseGiftProvider: Provider component for advanced usage.
 */
const BaseGiftProvider = contextResult.Provider;

/**
 * useGiftContext
 * Hook to access the gift context value safely.
 * @returns Gift context value
 */
export function useGiftContext() {
  return useSafeContext(GiftContext, "GiftContext");
}

/**
 * GiftProviderProps: Props for the GiftProvider component.
 * @property giftList - Initial list of gifts
 * @property children - React children
 */
type GiftProviderProps = {
  giftList?: Gift[];
  children: React.ReactNode;
};

/**
 * GiftProviderComponent
 * Provider component for GiftContext, initializes state with giftList.
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

/**
 * GiftProvider
 * Provider component for GiftContext, wrapped with error boundary.
 */
export const GiftProvider = withErrorBoundary(
  GiftProviderComponent,
  "GiftContext",
  <ErrorMessage message="Failed to load Gift context. Please refresh the page." />
);

/**
 * GiftContextExports: Named exports for all context APIs.
 */
const GiftContextExports = {
  GiftProvider,
  useGiftContext,
};

export default GiftContextExports;
