# EventContext Module Documentation

## 1. Overview

**EventContext** provides a robust, functional, and type-safe state management solution for handling event selection and event-related state in the application. It addresses the need for consistent, composable, and easily testable event state across the UI, abstracting away direct state mutation and side effects. Architecturally, it acts as the event domain’s context provider within the app’s layered, service-first design, ensuring that all event state transitions are explicit, predictable, and middleware-friendly. The module is built on functional programming principles—immutability, pure reducers, composable hooks, and middleware extensibility—enabling maintainable, scalable, and debuggable event state management.

---

## 2. Key Files and Their Roles

### `/app/contexts/EventContext.tsx`

- **Purpose**: Implements the event context, provider, hooks, and reducer logic for event state management.
- **Key Exports**:
  - `EventProvider`: Context provider with error boundary for event state.
  - `useEventContext`: Access the raw event context value.
  - `useEventContextResult`: Access the context result (with error/success state).
  - `useEventSelector`: Typed selector hook for extracting slices of event state.
  - `useEventActions`: Dispatch event actions in a type-safe way.
  - `useEventSelection`: High-level hook for event selection, state, and actions (mirrors ApplicantContext’s pattern).
- **Interactions**:
  - Uses `createFunctionalContext` from `/utils/fp-contexts` for context creation.
  - Integrates `persistenceMiddleware` for state persistence.
  - Wraps provider with `withErrorBoundary` from `/components/ErrorBoundary`.
- **Design Decisions**:
  - Pure reducer pattern for state transitions.
  - Middleware stack for logging, persistence, and future extensibility.
  - Separation of context creation, provider, and hooks for testability and composability.

---

## 3. Core Logic and Flow

- **Primary Workflow**:
  - The `EventProvider` initializes state (optionally with an eventId) and wraps children in the event context.
  - State transitions are handled by a pure reducer (`eventReducer`) responding to actions like `SET_EVENT_ID`, `SET_EVENT`, and `RESET_EVENT`.
  - Hooks (`useEventContext`, `useEventSelector`, `useEventActions`, `useEventSelection`) provide safe, idiomatic access to state and actions.
- **Critical State Changes**:
  - `SET_EVENT_ID`: Updates the selected eventId in state.
  - `SET_EVENT`: Merges arbitrary event fields into state.
  - `RESET_EVENT`: Resets state to initial values.
  - All state changes are immutable and return new state objects.
- **Non-Obvious Logic**:
  - Middleware (logging, persistence) is injected at context creation for cross-cutting concerns.
  - The `useEventSelection` hook encapsulates selection logic, exposes selection state, and provides safe action dispatchers, mirroring the ApplicantContext API for consistency.
  - Error boundary integration ensures UI resilience.

---

## 4. Usage Examples

### Minimal Setup (EventProvider)

```tsx
import { EventProvider } from "@/app/contexts/EventContext";

<EventProvider eventId="evt-123">
  <MyEventComponent />
</EventProvider>;
```

### useEventContext

```tsx
import { useEventContext } from "@/app/contexts/EventContext";

function RawEventContextConsumer() {
  const context = useEventContext();
  // context contains the full event state object
  return <pre>{JSON.stringify(context, null, 2)}</pre>;
}
```

### useEventContextResult

```tsx
import { useEventContextResult } from "@/app/contexts/EventContext";

function EventContextResultConsumer() {
  const result = useEventContextResult();
  if (result._tag === "None") return <div>No context available</div>;
  if (result.value.error._tag === "Some")
    return <div>Error: {result.value.error.value.message}</div>;
  return <pre>{JSON.stringify(result.value, null, 2)}</pre>;
}
```

### useEventSelector

```tsx
import { useEventSelector } from "@/app/contexts/EventContext";

function EventIdDisplay() {
  const eventId = useEventSelector((state) => state.data.eventId);
  return (
    <span>
      Current Event ID: {eventId._tag === "Some" ? eventId.value : "None"}
    </span>
  );
}
```

### useEventActions

```tsx
import { useEventActions } from "@/app/contexts/EventContext";

function SetEventButton({ newEventId }) {
  const actions = useEventActions();
  const setEvent = () => {
    if (actions._tag === "Some") {
      actions.value.dispatchSafe({ type: "SET_EVENT_ID", payload: newEventId });
    }
  };
  return <button onClick={setEvent}>Set Event</button>;
}
```

### useEventSelection

```tsx
import { useEventSelection } from "@/app/contexts/EventContext";

function EventSelectionPanel() {
  const { eventId, eventData, selectEvent, clearEvent, hasSelection } =
    useEventSelection();

  return (
    <div>
      <div>Selected Event: {hasSelection ? eventId.value : "None"}</div>
      <button onClick={() => selectEvent("evt-456")}>
        Select Event evt-456
      </button>
      <button onClick={clearEvent}>Clear Selection</button>
      <pre>{JSON.stringify(eventData.value, null, 2)}</pre>
    </div>
  );
}
```

---

## 5. Best Practices and Extension Points

- **Guidelines**:
  - Always use the provided hooks (`useEventSelection`, `useEventSelector`, etc.) for state access and mutation.
  - Wrap all event-dependent UI in `EventProvider` for context availability.
- **Common Pitfalls**:
  - Avoid direct state mutation; always dispatch actions.
  - Do not assume context is always available—handle `Maybe` types defensively.
- **Extension Points**:
  - Add custom middleware (e.g., analytics, validation) by extending the middleware array in context creation.
  - Extend the reducer with new action types for additional event operations.
- **Testing/Debugging Tips**:
  - Use the logging middleware in development for action/state traceability.
  - Leverage the error boundary for graceful error handling in the UI.
  - Test hooks in isolation by mocking context providers.

---

## 6. Summary

Use EventContext whenever you need robust, composable, and type-safe event state management in the application. It integrates seamlessly with the app’s functional, service-first architecture, providing a consistent API and middleware extensibility. The design choices—pure reducers, middleware, and composable hooks—ensure long-term maintainability, testability, and ease of extension, making EventContext a foundational building block for scalable event-driven features.
