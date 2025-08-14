/**
 * Enhanced Context Providers with Functional Operations
 * Provides immutable state management, action-based updates, and composable contexts
 */
"use client";
/**
 * Functional programming context utilities for React.
 */

import React, { useMemo, useCallback, createContext, useReducer } from "react";
import {
  Result,
  Maybe,
  some,
  none,
  success,
  failure,
  isSuccess,
  isFailure,
  getMaybeOrElse,
  trySync,
  objectUtils,
} from "@/utils/fp";
import { useSafeContext } from "../app/hooks/useSafeContext";

// Helper type for Maybe context value
type MaybeContext<T> = { _tag: "Some"; value: T } | { _tag: "None" };
// ============================================================================
// FUNCTIONAL STATE MANAGEMENT TYPES
// ============================================================================

/**
 * Action with Result-based payload
 */
export interface FunctionalAction<T = any> {
  type: string;
  payload?: T;
  meta?: {
    timestamp: number;
    source?: string;
    optimistic?: boolean;
  };
}

/**
 * State with functional properties
 */
export interface FunctionalState<T = any> {
  readonly data: T;
  readonly loading: boolean;
  readonly error: Maybe<Error>;
  readonly lastUpdated: number;
  readonly version: number;
}

/**
 * Reducer that returns Result for error handling
 */
export type FunctionalReducer<S, A> = (state: S, action: A) => Result<S, Error>;

/**
 * Context provider configuration
 */
export interface ContextConfig<S, A> {
  name: string;
  initialState: S;
  reducer: FunctionalReducer<S, A>;
  middleware?: ContextMiddleware<S, A>[];
  persistKey?: string;
  debugMode?: boolean;
}

/**
 * Context middleware function
 */
export type ContextMiddleware<S, A> = (
  action: A,
  state: S,
  dispatch: (action: A) => void,
  getState: () => S
) => A | void;

// ============================================================================
// FUNCTIONAL CONTEXT FACTORY
// ============================================================================

/**
 * Creates a functional context with immutable state and action-based updates
 */
export function createFunctionalContext<S, A extends FunctionalAction>(
  config: ContextConfig<S, A>
) {
  const {
    name,
    initialState,
    reducer,
    middleware = [],
    persistKey,
    debugMode = false,
  } = config;

  // Create the context
  const StateContext = createContext<
    | {
        state: S;
        dispatch: (action: A) => void;
        getState: () => S;
      }
    | undefined
  >(undefined);

  StateContext.displayName = `${name}Context`;

  // Enhanced reducer with middleware and error handling
  const enhancedReducer = (state: S, action: A): S => {
    if (debugMode) {
      console.group(`🔄 ${name} Action: ${action.type}`);
      console.log("Previous State:", state);
      console.log("Action:", action);
    }

    try {
      // Apply middleware
      let processedAction = action;
      for (const middlewareFn of middleware) {
        const result = middlewareFn(
          processedAction,
          state,
          (a: A) => (processedAction = a),
          () => state
        );
        if (result) {
          processedAction = result;
        }
      }

      // Apply reducer
      const result = reducer(state, processedAction);

      if (result._tag === "Success") {
        const newState = Object.freeze({
          ...result.value,
          lastUpdated: Date.now(),
          version: (state as any).version ? (state as any).version + 1 : 1,
        });

        if (debugMode) {
          console.log("New State:", newState);
          console.groupEnd();
        }

        // Persist if configured
        if (persistKey && typeof window !== "undefined") {
          try {
            localStorage.setItem(persistKey, JSON.stringify(newState));
          } catch (error) {
            console.warn(`Failed to persist ${name} state:`, error);
          }
        }

        return newState;
      } else {
        if (debugMode) {
          console.error("Reducer Error:", result.error);
          console.groupEnd();
        }
        return state; // Return current state on error
      }
    } catch (error) {
      if (debugMode) {
        console.error("Unexpected Error:", error);
        console.groupEnd();
      }
      return state;
    }
  };

  // Provider component
  const Provider: React.FC<{
    children: React.ReactNode;
    initialState?: Partial<S>;
  }> = ({ children, initialState: providedInitialState }) => {
    // Load persisted state if available
    const loadedState = useMemo(() => {
      if (persistKey && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(persistKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            return { ...initialState, ...parsed, ...providedInitialState };
          }
        } catch (error) {
          console.warn(`Failed to load persisted ${name} state:`, error);
        }
      }
      return { ...initialState, ...providedInitialState };
    }, [providedInitialState]);

    const [state, dispatch] = useReducer(
      enhancedReducer,
      Object.freeze(loadedState)
    );

    const getState = useCallback(() => state, [state]);

    const contextValue = useMemo(
      () => ({
        state,
        dispatch,
        getState,
      }),
      [state, getState]
    );

    return (
      <StateContext.Provider value={contextValue}>
        {children}
      </StateContext.Provider>
    );
  };

  // Hook to use the context
  const useContext = (): MaybeContext<{
    state: S;
    dispatch: (action: A) => void;
    getState: () => S;
  }> => {
    return useSafeContext(StateContext, name) as MaybeContext<{
      state: S;
      dispatch: (action: A) => void;
      getState: () => S;
    }>;
  };

  // Hook with Result error handling
  const useContextResult = () => {
    const context = useContext();
    return context._tag === "Some"
      ? success(context.value)
      : failure(new Error(`${name} context not available`));
  };

  // Selector hook for specific state slices
  const useSelector = <R extends any>(selector: (state: S) => R): Maybe<R> => {
    const context = useContext();
    if (context._tag === "Some") {
      try {
        return some(selector(context.value.state));
      } catch (error) {
        console.warn(`Selector error in ${name}:`, error);
        return none;
      }
    }
    return none;
  };

  // Action creators with Result handling
  const useActions = () => {
    const context = useContext();

    const createAction = useCallback(
      (type: string, payload?: any): A =>
        ({
          type,
          payload,
          meta: {
            timestamp: Date.now(),
            source: name,
          },
        } as A),
      []
    );

    const dispatchSafe = useCallback(
      (action: A): Result<void, Error> => {
        if (context._tag === "Some") {
          try {
            context.value.dispatch(action);
            return success(undefined);
          } catch (error) {
            return failure(
              error instanceof Error ? error : new Error(String(error))
            );
          }
        }
        return failure(new Error(`${name} context not available`));
      },
      [context]
    );

    const dispatchAsync = useCallback(
      async (actionCreator: () => Promise<A>): Promise<Result<void, Error>> => {
        try {
          const action = await actionCreator();
          return dispatchSafe(action);
        } catch (error) {
          return failure(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      },
      [dispatchSafe]
    );

    return context._tag === "Some"
      ? some({
          dispatch: context.value.dispatch,
          dispatchSafe,
          dispatchAsync,
          createAction,
          getState: context.value.getState,
        })
      : none;
  };

  return {
    Context: StateContext,
    Provider,
    useContext,
    useContextResult,
    useSelector,
    useActions,
    name,
  };
}

// ============================================================================
// BUILT-IN MIDDLEWARE
// ============================================================================

/**
 * Logging middleware for debugging
 */
export const loggingMiddleware = <S extends any, A extends FunctionalAction>(
  action: A,
  state: S
): void => {
  if (process.env.NODE_ENV === "development") {
    console.group(`📝 Action: ${action.type}`);
    console.log("Payload:", action.payload);
    console.log("Current State:", state);
    console.groupEnd();
  }
};

/**
 * Validation middleware
 */
export const validationMiddleware =
  <S extends any, A extends FunctionalAction>(
    validator: (action: A, state: S) => Result<boolean, string>
  ) =>
  (action: A, state: S): A | void => {
    const result = validator(action, state);
    if (result._tag === "Failure") {
      console.warn(`Validation failed for ${action.type}:`, result.error);
      return; // Don't process action
    }
    return action;
  };

/**
 * Optimistic updates middleware
 */
export const optimisticMiddleware =
  <S extends any, A extends FunctionalAction>(
    rollbackActions: Record<string, (state: S) => A>
  ) =>
  (action: A, state: S, dispatch: (action: A) => void): A => {
    if (action.meta?.optimistic) {
      // Set up rollback after delay
      setTimeout(() => {
        const rollbackCreator = rollbackActions[action.type];
        if (rollbackCreator) {
          const rollbackAction = rollbackCreator(state);
          dispatch(rollbackAction);
        }
      }, 5000); // 5 second timeout
    }
    return action;
  };

/**
 * Persistence middleware
 */
export const persistenceMiddleware = <
  S extends any,
  A extends FunctionalAction
>(
  key: string,
  options: {
    include?: string[];
    exclude?: string[];
    debounceMs?: number;
  } = {}
) => {
  let timeoutId: NodeJS.Timeout;

  return (action: A, state: S): void => {
    if (typeof window === "undefined") return;

    const { debounceMs = 300, include, exclude } = options;

    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Debounced persistence
    timeoutId = setTimeout(() => {
      try {
        let dataToStore: any = state;

        if (include) {
          dataToStore = (objectUtils.pick as any)(include)(state as any);
        } else if (exclude) {
          dataToStore = (objectUtils.omit as any)(exclude)(state as any);
        }

        localStorage.setItem(key, JSON.stringify(dataToStore));
      } catch (error) {
        console.warn("Failed to persist state:", error);
      }
    }, debounceMs);
  };
};

// ============================================================================
// CONTEXT COMPOSITION UTILITIES
// ============================================================================

/**
 * Combines multiple contexts into a single provider
 */
export function combineContexts<T extends Record<string, any>>(
  contexts: T
): React.FC<{ children: React.ReactNode }> {
  return ({ children }) => {
    return Object.values(contexts).reduce(
      (acc, ContextProvider) => <ContextProvider>{acc}</ContextProvider>,
      children as React.ReactElement
    );
  };
}

/**
 * Creates a higher-order component that provides multiple contexts
 */
export function withContexts<P extends object>(
  ...providers: React.ComponentType<{ children: React.ReactNode }>[]
) {
  return function <T extends P>(
    Component: React.ComponentType<T>
  ): React.ComponentType<T> {
    return (props: T) => {
      return providers.reduceRight(
        (acc, Provider) => <Provider>{acc}</Provider>,
        <Component {...props} />
      );
    };
  };
}

/**
 * Hook to access multiple contexts safely
 */
export function useMultipleContexts<T extends Record<string, () => Maybe<any>>>(
  contextHooks: T
): Maybe<{ [K in keyof T]: T[K] extends () => Maybe<infer U> ? U : never }> {
  const results = {} as any;

  for (const [key, hookFn] of Object.entries(contextHooks)) {
    const result = hookFn();
    if (result._tag === "None") {
      return none;
    }
    results[key] = result.value;
  }

  return some(results);
}

// ============================================================================
// COMMON STATE PATTERNS
// ============================================================================

/**
 * Creates a standard async state reducer
 */
export function createAsyncReducer<T extends any>() {
  type AsyncState = FunctionalState<Maybe<T>>;
  type AsyncAction =
    | { type: "LOADING" }
    | { type: "SUCCESS"; payload: T }
    | { type: "ERROR"; payload: Error }
    | { type: "RESET" };

  const initialState: AsyncState = {
    data: none,
    loading: false,
    error: none,
    lastUpdated: 0,
    version: 0,
  };

  const reducer: FunctionalReducer<AsyncState, AsyncAction> = (
    state,
    action
  ) => {
    switch (action.type) {
      case "LOADING":
        return success({
          ...state,
          loading: true,
          error: none,
        });

      case "SUCCESS":
        return success({
          ...state,
          data: some(action.payload),
          loading: false,
          error: none,
        });

      case "ERROR":
        return success({
          ...state,
          loading: false,
          error: some(action.payload),
        });

      case "RESET":
        return success(initialState);

      default:
        return failure(
          new Error(`Unknown action type: ${(action as any).type}`)
        );
    }
  };

  return { initialState, reducer };
}

/**
 * Creates a collection state reducer (for lists)
 */
export function createCollectionReducer<T extends { id: string }>() {
  type CollectionState = FunctionalState<T[]>;
  type CollectionAction =
    | { type: "SET_ITEMS"; payload: T[] }
    | { type: "ADD_ITEM"; payload: T }
    | { type: "UPDATE_ITEM"; payload: { id: string; updates: Partial<T> } }
    | { type: "REMOVE_ITEM"; payload: string }
    | { type: "CLEAR" };

  const initialState: CollectionState = {
    data: [],
    loading: false,
    error: none,
    lastUpdated: 0,
    version: 0,
  };

  const reducer: FunctionalReducer<CollectionState, CollectionAction> = (
    state,
    action
  ) => {
    switch (action.type) {
      case "SET_ITEMS":
        return success({
          ...state,
          data: [...action.payload],
        });

      case "ADD_ITEM":
        return success({
          ...state,
          data: [...state.data, action.payload],
        });

      case "UPDATE_ITEM":
        return success({
          ...state,
          data: state.data.map((item) =>
            item.id === action.payload.id
              ? { ...item, ...action.payload.updates }
              : item
          ),
        });

      case "REMOVE_ITEM":
        return success({
          ...state,
          data: state.data.filter((item) => item.id !== action.payload),
        });

      case "CLEAR":
        return success({
          ...state,
          data: [],
        });

      default:
        return failure(
          new Error(`Unknown action type: ${(action as any).type}`)
        );
    }
  };

  return { initialState, reducer };
}
