# Multistep Context System

## Overview

This folder implements a modular, type-safe, and functional multistep form navigation system for React. It is designed for maintainability, testability, and reusability.

## Key Files and Their Roles

- **multistepReducer.ts**

  - Contains the reducer (`multistepReducer`) and initial state creator (`createInitialState`).
  - Handles all state transitions: navigation, data, validation, etc.
  - Not used directly by components; injected into context via `MultistepContext.tsx`.

- **MultistepContext.tsx**

  - Imports reducer, initial state, types, utilities, and selectors.
  - Uses a functional context factory to create:
    - React context
    - Provider component
    - Custom hooks for context, actions, selectors
  - Adds middleware for logging, validation, and persistence.
  - Exports an encapsulated object (`EnhancedMultistepContextExports`) with all hooks and the provider.

- **useStepNavigationActions.ts**

  - Imports the encapsulated context export.
  - Provides a simple hook for navigation actions (`goToNextStep`, `goToPreviousStep`, `jumpToStep`).
  - Wraps lower-level navigation logic for easier use in components.

- **multistepUtils.ts / multistepSelectors.ts**

  - Utility and selector functions for step logic and state access.

- **types.ts**
  - All shared types/interfaces for strict type safety.

## How the System Works

1. **Reducer Logic**

   - `multistepReducer` is a pure function that updates state based on actions (e.g., navigation, data, validation).
   - `createInitialState` sets up the initial context state.
   - These are injected into the context provider, not used directly.

2. **Context Setup**

   - `MultistepContext.tsx` creates the context and provider using the reducer and initial state.
   - Middleware is added for logging, validation, and persistence.
   - All hooks and the provider are exported via an encapsulated object.

3. **Hooks for Consumption**
   - Use hooks from the encapsulated export to access state, actions, selectors, and navigation logic in your components.
   - For navigation, use either the full context hooks or the convenience actions hook.

## Usage Example

### 1. Wrap Your Form in the Provider

```tsx
import { MultistepProvider } from "./MultistepContext";

<MultistepProvider steps={stepDefinitions} initialStepIndex={0}>
  {/* Your multistep form components */}
</MultistepProvider>;
```

### 2. Access State and Actions in Components

```tsx
import MultistepContext from "./MultistepContext";

const { useStepNavigation, useStepData, useStepValidation } = MultistepContext;

const navResult = useStepNavigation();
const { setStepData, getCurrentStepData } = useStepData();
const { validateStep, validationResults } = useStepValidation();
```

### 3. Use Convenience Hook for Navigation

```tsx
import { useStepNavigationActions } from "./useStepNavigationActions";

const { goToNextStep, goToPreviousStep, jumpToStep } =
  useStepNavigationActions();

goToNextStep(); // Advances to next step, returns error string if fails
```

### 4. Example: Next Step Button

```tsx
const { goToNextStep } = useStepNavigationActions();

<button
  onClick={() => {
    const error = goToNextStep();
    if (error) alert(error);
  }}
>
  Next
</button>;
```

## Summary

- The reducer is injected into the context and never used directly.
- All state and actions are accessed via hooks exported from `MultistepContext.tsx`.
- Use the provider to wrap your form, then use the hooks in child components.
- For navigation, use either the full context hooks or the convenience actions hook.
