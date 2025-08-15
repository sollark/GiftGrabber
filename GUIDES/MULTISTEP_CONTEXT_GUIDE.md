# Multistep Context Module Documentation

## Overview

The Multistep Context module provides a robust, type-safe system for managing complex multi-step workflows such as forms, wizards, and guided processes. It implements a three-layer architecture pattern with clear separation of concerns: foundation (context/state management), business logic (navigation operations), and component interface layers.

**Primary Purpose**: Enable declarative, stateful navigation through sequential steps with validation, completion tracking, and flexible navigation patterns.

**Problem Solved**: Eliminates boilerplate and inconsistencies in multi-step UI flows by providing a centralized state management system with built-in validation, persistence, and error handling.

**Architecture Role**: Serves as the core workflow orchestrator within the application's context system, implementing functional programming patterns with Result types, immutable state updates, and composable middleware.

**Design Principles**:

- **Functional Programming**: Immutable state, Result types for error handling, pure functions
- **Layered Architecture**: Foundation → Business Logic → Component Interface
- **Performance Optimization**: Memoized selectors, minimal re-renders
- **Type Safety**: Full TypeScript coverage with strict typing

## Key Files and Their Roles

### Foundation Layer

#### `MultistepContext.tsx`

**Purpose**: Provides React context foundation with middleware integration  
**Key Exports**:

- `MultistepProvider` - Auto-initializing provider component
- `BaseMultistepProvider` - Low-level provider for advanced use cases
- `useMultistepSelector` - Foundation state selector hook
- `useMultistepActions` - Foundation action dispatcher hook
- `useMultistepContext` - Direct context access hook

**Interactions**: Integrates logging, validation, and persistence middleware; creates functional context using `@/lib/fp-contexts`

#### `multistepReducer.ts`

**Purpose**: Pure state reducer implementing step navigation logic  
**Key Exports**:

- `multistepReducer` - Main state reducer function
- `createInitialState` - Initial state factory

**Responsibilities**: Handles all state transitions, maintains step indexes, manages completion tracking

#### `types.ts`

**Purpose**: TypeScript definitions for the entire module  
**Key Exports**:

- `MultistepState` - Complete state interface
- `MultistepAction` - All possible actions
- `StepDefinition` - Step configuration interface
- `MultistepProviderProps` - Provider component props

### Business Logic Layer

#### `useStepNavigation.ts`

**Purpose**: Primary business logic hook providing high-level step operations  
**Key Exports**:

- `useStepNavigation` - Main navigation hook

**Responsibilities**:

- Exposes navigation state (current step, progress, completion status)
- Provides navigation actions (goToNextStep, goToPreviousStep, jumpToStep)
- Handles validation and error reporting via Result types
- Performance-optimized with single memoized selector

**Architecture**: Uses foundation hooks internally, implements business rules, returns clean component interface

#### `multistepSelectors.ts`

**Purpose**: Optimized state selectors with memoization  
**Key Exports**:

- `selectCurrentStepIndex` - Current step position
- `selectCurrentStepId` - Current step identifier
- `selectCanGoNext/Back` - Navigation availability
- `selectStepProgress` - UI-friendly progress percentage
- `selectIsFirstStep/LastStep` - Position helpers

**Performance**: Memoized selectors prevent unnecessary re-renders, UI convenience functions reduce component complexity

#### `multistepUtils.ts`

**Purpose**: Pure utility functions for step logic  
**Key Exports**:

- `canNavigateToStep` - Navigation validation logic
- `findStepIndex` - Step lookup utilities
- `calculateProgress` - Progress computation

### Component Interface Layer

#### `useStepNavigationActions.ts`

**Purpose**: Simplified action-focused hook for components needing only actions  
**Key Exports**:

- `useStepNavigationActions` - Actions-only hook

**Use Case**: Components that dispatch actions but don't need state (e.g., navigation buttons)

#### `useStepData.ts`

**Purpose**: Step-specific data management hook  
**Key Exports**:

- `useStepData` - Step data operations

**Responsibilities**: Handles per-step data persistence and retrieval

## Core Logic and Flow

### Primary Workflows

**1. Step Navigation Flow**:

```
Component → useStepNavigation → MultistepActions → Reducer → State Update → Re-render
```

**2. Validation Flow**:

```
Action Dispatch → Validation Middleware → Business Rules Check → Result Success/Failure
```

**3. Data Persistence Flow**:

```
Step Completion → Data Serialization → Persistence Middleware → Storage Update
```

### Critical State Management

**State Structure**:

- `currentStepIndex`: Zero-based step position
- `completedSteps`: Set of completed step IDs
- `skippedSteps`: Set of skipped step IDs
- `canGoNext/Back`: Computed navigation permissions
- `stepData`: Per-step form/data storage

**Progress Calculation**: Normalized decimal (0-1) based on `(currentIndex + 1) / totalSteps`

**Navigation Rules**:

- Next step: Must pass validation, cannot exceed bounds
- Previous step: No restrictions (allows correction)
- Jump navigation: Target step must be accessible based on completion state

### Performance Considerations

**Single Memoized Selector**: `useStepNavigation` uses one `useCallback`-wrapped selector to minimize context subscriptions and re-renders.

**Selective State Access**: Components can use specific selectors (`selectIsFirstStep`) rather than subscribing to entire state.

## Usage Examples

### Basic Setup and Navigation

```tsx
import { MultistepProvider, useStepNavigation } from "@/app/contexts/multistep";
import { StepDefinition } from "@/app/contexts/multistep/types";

const steps: StepDefinition[] = [
  { id: "personal", title: "Personal Info", isOptional: false },
  { id: "preferences", title: "Preferences", isOptional: true },
  { id: "review", title: "Review", isOptional: false },
];

function MyWizard() {
  return (
    <MultistepProvider steps={steps} initialStepIndex={0}>
      <WizardContent />
    </MultistepProvider>
  );
}

function WizardContent() {
  const navigation = useStepNavigation();

  return (
    <div>
      <h2>{navigation.currentStep?.title}</h2>
      <p>Progress: {Math.round(navigation.progress * 100)}%</p>

      <button
        onClick={navigation.goToPreviousStep}
        disabled={!navigation.canGoBack}
      >
        Previous
      </button>

      <button
        onClick={navigation.goToNextStep}
        disabled={!navigation.canGoNext}
      >
        Next
      </button>
    </div>
  );
}
```

### Advanced Navigation with Validation

```tsx
function ValidatedStep() {
  const navigation = useStepNavigation();
  const [formData, setFormData] = useState({});

  const handleNext = useCallback(async () => {
    // Validate current step data
    const validation = await validateStepData(formData);
    if (!validation.isValid) {
      showErrors(validation.errors);
      return;
    }

    // Complete current step and navigate
    const completeResult = navigation.completeStep();
    if (completeResult._tag === "Success") {
      const navResult = navigation.goToNextStep();
      if (navResult._tag === "Failure") {
        showError(navResult.error);
      }
    }
  }, [navigation, formData]);

  return (
    <form>
      {/* Form fields */}
      <button onClick={handleNext}>
        {navigation.canComplete ? "Complete" : "Next"}
      </button>
    </form>
  );
}
```

### Performance-Optimized Component

```tsx
import {
  selectIsFirstStep,
  selectStepProgress,
} from "@/app/contexts/multistep/multistepSelectors";

function OptimizedNavigationBar() {
  // Only re-renders when specific values change
  const isFirstStep = useMultistepSelector(selectIsFirstStep);
  const progressPercent = useMultistepSelector(selectStepProgress);
  const actions = useStepNavigationActions();

  return (
    <div className="navigation-bar">
      <div className="progress" style={{ width: `${progressPercent}%` }} />

      {!isFirstStep && <button onClick={actions.goToPreviousStep}>Back</button>}

      <button onClick={actions.goToNextStep}>Continue</button>
    </div>
  );
}
```

## Best Practices and Extension Points

### Usage Guidelines

**1. Provider Placement**: Place `MultistepProvider` at the root of your workflow component tree, not globally.

**2. Hook Selection**:

- Use `useStepNavigation` for components needing both state and actions
- Use `useStepNavigationActions` for pure action components
- Use specific selectors (`selectIsFirstStep`) for performance-critical components

**3. Error Handling**: Always handle Result types from navigation actions:

```tsx
const result = navigation.goToNextStep();
if (result._tag === "Failure") {
  // Handle error appropriately
  console.error(result.error);
}
```

**4. Step Definition**: Define steps as constants outside components to prevent recreation:

```tsx
const WIZARD_STEPS: StepDefinition[] = [
  { id: "step1", title: "Step 1", isOptional: false },
  // ...
];
```

### Common Pitfalls

**1. State Subscription**: Avoid subscribing to entire state when only specific values are needed - use targeted selectors.

**2. Action Dispatch**: Don't dispatch actions during render - use event handlers or effects.

**3. Step Data**: Don't store large objects in step data - use external state management and store references.

### Extension Points

**1. Custom Validation**: Extend validation middleware in `MultistepContext.tsx`:

```tsx
const customValidation = validationMiddleware((action, state) => {
  // Custom validation logic
  return success(true);
});
```

**2. Custom Persistence**: Replace or extend persistence middleware for different storage backends.

**3. Additional Selectors**: Add domain-specific selectors in `multistepSelectors.ts` for complex UI requirements.

### Testing Tips

**1. Mock Context**: Create test providers with predefined state for component testing.

**2. Reducer Testing**: Test `multistepReducer` directly with various action scenarios.

**3. Integration Tests**: Test complete workflows with realistic step definitions and user interactions.

## Summary

**When to Use**: Multi-step forms, onboarding flows, checkout processes, configuration wizards, or any sequential user interface requiring navigation state management.

**System Integration**: Integrates with the application's functional programming architecture through Result types, works with persistence middleware for data storage, and connects to validation systems for step completion rules.

**Design Value**: The three-layer architecture ensures clean separation of concerns, making the system highly testable, maintainable, and extensible. The functional programming approach with Result types provides explicit error handling and predictable state management. Performance optimizations through memoized selectors ensure scalability for complex workflows.

The module's context-hook pattern aligns with other application contexts, providing consistent developer experience and architectural coherence across the entire system.
