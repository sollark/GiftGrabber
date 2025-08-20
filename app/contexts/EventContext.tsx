/**
 * EventContext: Functional context for managing event state and actions.
 * Follows functional programming principles: immutability, pure functions, composable hooks.
 * Provides: EventProvider, useEventContext, useEventSelector, useEventActions.
 */

import React from "react";
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

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface EventState extends FunctionalState<Record<string, any>> {}

export interface EventAction extends FunctionalAction {
  type: "SET_EVENT_ID" | "RESET_EVENT";
  payload?: unknown;
}

// ============================================================================
// INITIAL STATE AND REDUCER
// ============================================================================

const createInitialState = (eventId: string = ""): EventState => ({
  data: { eventId },
  loading: false,
  error: none,
  lastUpdated: Date.now(),
  version: 0,
});

const eventReducer = (
  state: EventState,
  action: EventAction
): Result<EventState, Error> => {
  switch (action.type) {
    case "SET_EVENT_ID": {
      // Set eventId inside data object
      const eventId =
        typeof action.payload === "string"
          ? action.payload
          : (action.payload as any)?.eventId;
      return success({
        ...state,
        data: {
          ...state.data,
          eventId: eventId ?? state.data.eventId ?? "",
        },
      });
    }
    case "RESET_EVENT":
      return success(createInitialState());
    default:
      return failure(new Error(`Unknown action type: ${action.type}`));
  }
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const contextResult = createFunctionalContext<EventState, EventAction>({
  name: "Event",
  initialState: createInitialState(),
  reducer: eventReducer,
  middleware: [
    loggingMiddleware,
    persistenceMiddleware("event-context", {
      exclude: ["loading", "error", "lastUpdated", "version"],
    }),
  ],
  debugMode: process.env.NODE_ENV === "development",
});

export const EventContext = contextResult.Context;
export const BaseEventProvider = contextResult.Provider;
export const useEventContext = contextResult.useContext;
export const useEventContextResult = contextResult.useContextResult;
export const useEventSelector = contextResult.useSelector as <
  TSelected = unknown
>(
  selector: (state: EventState) => TSelected
) => Maybe<TSelected>;
export const useEventActions = contextResult.useActions;

// ============================================================================
// ENHANCED PROVIDER WITH ERROR BOUNDARY
// ============================================================================

interface EventProviderProps {
  eventId: string;
  children: React.ReactNode;
}

const EventProviderComponent: React.FC<EventProviderProps> = ({
  eventId,
  children,
}) => {
  const initialData = React.useMemo(
    () => createInitialState(eventId),
    [eventId]
  );
  return (
    <BaseEventProvider initialState={initialData}>{children}</BaseEventProvider>
  );
};

export const EventProvider = withErrorBoundary(
  EventProviderComponent,
  "EventContext",
  <div>Failed to load Event context. Please refresh the page.</div>
);

// ============================================================================
// EXPORTS
// ============================================================================

const EventContextExports = {
  EventProvider,
  useEventContext,
  useEventContextResult,
  useEventSelector,
  useEventActions,
};

export default EventContextExports;
