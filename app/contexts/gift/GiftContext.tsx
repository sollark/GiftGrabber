/**
 * GiftContext: Isolated context for gift management logic
 * Provides immutable state management and action-based updates for gifts
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

export interface GiftAction extends FunctionalAction {
  type:
    | "SET_GIFT_LIST"
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
          giftList: action.payload || [],
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

export const GiftContext = contextResult.Context;
export const BaseGiftProvider = contextResult.Provider;
export const useGiftContext = contextResult.useContext;
export const useGiftContextResult = contextResult.useContextResult;

export const useGiftSelector = contextResult.useSelector as <
  TSelected = unknown
>(
  selector: (state: GiftState) => TSelected
) => Maybe<TSelected>;

export const useGiftActions = contextResult.useActions;

type GiftProviderProps = {
  giftList?: Gift[];
  children: React.ReactNode;
};

/**
 * GiftProvider: Supplies gift context to child components.
 *
 * NOTE: To prevent coupling, child components should consume gift data
 * either via context (using useGiftContext/useGiftSelector) or via props,
 * but not both. Do not duplicate data sources.
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

const GiftContextExports = {
  GiftProvider,
  useGiftContext,
  useGiftContextResult,
  useGiftSelector,
  useGiftActions,
};

export default GiftContextExports;
