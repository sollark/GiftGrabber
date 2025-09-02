/**
 * EventContext.tsx
 *
 * Purpose: Functional React context for event-scoped state management with middleware integration
 *
 * Main Responsibilities:
 * - Manages event identification state using functional programming patterns
 * - Provides type-safe event state mutations through pure reducer functions
 * - Integrates logging and persistence middleware for state change tracking
 * - Offers selector-based access patterns for efficient component re-rendering
 * - Implements error boundary integration for robust error handling
 *
 * Architecture Role:
 * - Central event scoping mechanism for multi-tenant gift management system
 * - Foundation for other contexts that require event-specific data isolation
 * - Uses functional context utilities for immutable state management
 * - Enables URL-based event routing and deep linking capabilities
 * - Provides event boundary for access control and data segregation
 *
 * @businessLogic
 * - Event context stores only eventId to avoid state duplication with server data
 * - State changes are logged and persisted for debugging and recovery
 * - Immutable state updates prevent accidental mutations and enable time travel debugging
 * - Error boundaries ensure event context failures don't crash entire application
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
 * Stores eventId and optional event details (name, email).
 */
export interface EventState
  extends FunctionalState<{
    eventId: string;
    name?: string;
    email?: string;
  }> {}

/**
 * EventAction: Supported actions for event state transitions.
 * - SET_EVENT_ID: Set the current eventId (string only)
 * - SET_EVENT_DETAILS: Set event details (name, email, eventId)
 * - RESET_EVENT: Reset state to initial
 */
export interface EventAction extends FunctionalAction {
  type: "SET_EVENT_ID" | "SET_EVENT_DETAILS" | "RESET_EVENT";
  payload?: string | { name: string; email: string; eventId: string };
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
/**
 * Creates initial event state with optional eventId parameter
 *
 * @param eventId - Optional event identifier string, defaults to empty string
 * @returns EventState object with provided eventId and default loading/error state
 *
 * @sideEffects None - pure function creating immutable state object
 * @performance O(1) - simple object creation with timestamp
 * @notes Used for context initialization and state reset operations
 * @internalAPI Helper function for reducer and context setup
 */
const createInitialState = (eventId: string = ""): EventState => ({
  data: { eventId },
  loading: false,
  error: none,
  lastUpdated: Date.now(),
  version: 0,
});

/**
 * Pure reducer function for event state transitions with type-safe action handling
 *
 * @param state - Current EventState containing eventId and metadata
 * @param action - EventAction specifying state transition type and payload
 * @returns Result<EventState, Error> - Success with new state or Failure with validation error
 *
 * @sideEffects None - pure function with immutable state updates
 * @performance O(1) - simple state transformations with validation
 *
 * @businessLogic
 * - SET_EVENT_ID: Validates payload is string and updates eventId only
 * - RESET_EVENT: Returns clean initial state for context cleanup
 * - Unknown actions return failure for type safety and debugging
 *
 * @notes
 * - Only handles eventId storage to avoid state duplication with server data
 * - Validation ensures type safety at runtime for action payloads
 * - Immutable updates enable time travel debugging and predictable state changes
 *
 * @internalAPI Core reducer used by functional context utilities
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
          ...state.data,
          eventId: action.payload,
        },
      });
    }
    case "SET_EVENT_DETAILS": {
      // Validate payload has name, email, and eventId
      if (
        typeof action.payload !== "object" ||
        !action.payload ||
        typeof (action.payload as any).name !== "string" ||
        typeof (action.payload as any).email !== "string" ||
        typeof (action.payload as any).eventId !== "string"
      ) {
        return failure(
          new Error("Event details must include name, email, and eventId")
        );
      }
      const { name, email, eventId } = action.payload as {
        name: string;
        email: string;
        eventId: string;
      };
      return success({
        ...state,
        data: {
          eventId,
          name,
          email,
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
  const context = useEventContext();
  const eventId =
    context._tag === "Some" ? context.value.state.data.eventId : undefined;
  const eventData =
    context._tag === "Some" ? context.value.state.data : undefined;

  /**
   * selectEvent
   * Selects an event by id.
   * @param id - Event ID to select
   * @returns {Result<EventState, Error>} Result of dispatch
   */
  const selectEvent = React.useCallback(
    (id: string) => {
      if (context._tag === "Some") {
        context.value.dispatch({
          type: "SET_EVENT_ID",
          payload: id,
        });
        return success(context.value.state);
      }
      return failure(new Error("Event context not available"));
    },
    [context]
  );

  const clearEvent = React.useCallback(() => {
    if (context._tag === "Some") {
      context.value.dispatch({
        type: "RESET_EVENT",
      });
      return success(context.value.state);
    }
    return failure(new Error("Event context not available"));
  }, [context]);

  return {
    eventId,
    eventData,
    selectEvent,
    clearEvent,
    hasSelection: !!eventId,
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

// ============================================================================
// ENHANCED PROVIDER WITH ERROR BOUNDARY
// ============================================================================

/**
 * EventProviderComponent
 * Provider component for EventContext, initializes state with eventId.
 * @param eventId - Initial event ID
 * @param children - React children
 */
type EventProviderProps = {
  eventId?: string;
  children: React.ReactNode;
};
/**
 * EventProviderComponent
 * Provider component for EventContext, initializes state with eventId (optional).
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
  useEventSelection,
};

export default EventContextExports;
