/**
 * EventContext.tsx
 *
 * Purpose: Provides a functional, type-safe React context for managing event-related state and actions.
 * Responsibilities:
 *   - Encapsulates event state and transitions using a pure reducer and functional context utilities.
 *   - Exposes hooks for accessing, selecting, and mutating event state in a maintainable, idiomatic way.
 *   - Integrates middleware for logging and persistence.
 *   - Ensures robust error handling via error boundary wrapping.
 *
 * This file should not contain UI logic or unrelated business logic.
 */

import React from "react";
import {
  createFunctionalContext,
  FunctionalAction,
  FunctionalState,
  loggingMiddleware,
} from "@/utils/fp-contexts";
import { persistenceMiddleware } from "@/app/middleware/persistenceMiddleware";
import { Result, Maybe, none, success, failure } from "@/utils/fp";
import { withErrorBoundary } from "@/components/ErrorBoundary";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * EventState: Shape of the event context state.
 * Only stores eventId - no other event data should be stored here.
 */
export interface EventState
  extends FunctionalState<{
    eventId: string;
  }> {}

/**
 * EventAction: Supported actions for event state transitions.
 * - SET_EVENT_ID: Set the current eventId (string only)
 * - RESET_EVENT: Reset state to initial
 */
export interface EventAction extends FunctionalAction {
  type: "SET_EVENT_ID" | "RESET_EVENT";
  payload?: string; // Only string eventId allowed
}

// ============================================================================
// INITIAL STATE AND REDUCER
// ============================================================================

/**
 * createInitialState
 * Returns the initial state for the event context.
 * @param eventId - Optional initial eventId
 * @returns {EventState}
 */
const createInitialState = (eventId: string = ""): EventState => ({
  data: { eventId },
  loading: false,
  error: none,
  lastUpdated: Date.now(),
  version: 0,
});

/**
 * eventReducer
 * Pure reducer for event state transitions.
 * Only handles eventId - no other event data should be stored.
 * @param state - Current EventState
 * @param action - EventAction to apply
 * @returns {Result<EventState, Error>} New state or error
 */
const eventReducer = (
  state: EventState,
  action: EventAction
): Result<EventState, Error> => {
  switch (action.type) {
    case "SET_EVENT_ID": {
      // Validate payload is a string
      if (typeof action.payload !== "string") {
        return failure(new Error("Event ID must be a string"));
      }
      return success({
        ...state,
        data: {
          eventId: action.payload,
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
// ENHANCED HOOKS FOR COMMON OPERATIONS
// ============================================================================

/**
 * useEventSelection
 * High-level hook for event selection operations.
 * @returns {object} Selection state and actions: { eventId, eventData, selectEvent, clearEvent, hasSelection }
 */
export const useEventSelection = () => {
  const actions = useEventActions();
  const eventId = useEventSelector((state) => state.data.eventId);
  const eventData = useEventSelector((state) => state.data);

  /**
   * selectEvent
   * Selects an event by id.
   * @param id - Event ID to select
   * @returns {Result<EventState, Error>} Result of dispatch
   */
  const selectEvent = React.useCallback(
    (id: string) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "SET_EVENT_ID",
          payload: id,
        });
      }
      return failure(new Error("Event context not available"));
    },
    [actions]
  );

  /**
   * clearEvent
   * Clears the current event selection.
   * @returns {Result<EventState, Error>} Result of dispatch
   */
  const clearEvent = React.useCallback(() => {
    if (actions._tag === "Some") {
      return actions.value.dispatchSafe({
        type: "RESET_EVENT",
      });
    }
    return failure(new Error("Event context not available"));
  }, [actions]);

  return {
    eventId,
    eventData,
    selectEvent,
    clearEvent,
    hasSelection: eventId._tag === "Some" && !!eventId.value,
  };
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

// Create the functional event context with middleware and debugging support
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

/**
 * EventContext: The React context object for event state.
 */
export const EventContext = contextResult.Context;

/**
 * BaseEventProvider: Provider component for the event context (without error boundary).
 */
export const BaseEventProvider = contextResult.Provider;

/**
 * useEventContext: Hook to access the raw event context value.
 */
export const useEventContext = contextResult.useContext;

/**
 * useEventContextResult: Hook to access the context result (with error/success state).
 */
export const useEventContextResult = contextResult.useContextResult;

/**
 * useEventSelector: Typed selector hook for extracting slices of event state.
 * @param selector - Function to select part of the state
 * @returns Maybe<TSelected>
 */
export const useEventSelector = contextResult.useSelector as <
  TSelected = unknown
>(
  selector: (state: EventState) => TSelected
) => Maybe<TSelected>;

/**
 * useEventActions: Hook to dispatch event actions in a type-safe way.
 */
export const useEventActions = contextResult.useActions;

// ============================================================================
// ENHANCED PROVIDER WITH ERROR BOUNDARY
// ============================================================================

/**
 * EventProviderProps: Props for the EventProvider component.
 */
interface EventProviderProps {
  eventId: string;
  children: React.ReactNode;
}

/**
 * EventProviderComponent
 * Provider component for EventContext, initializes state with eventId.
 * @param eventId - Initial event ID
 * @param children - React children
 */
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

/**
 * EventProvider
 * Provider component for EventContext, wrapped with error boundary.
 */
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
  useEventSelection,
};

export default EventContextExports;
