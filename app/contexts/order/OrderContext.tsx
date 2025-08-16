/**
 * OrderContext.tsx
 * Purpose: Provides the main React context for order state management in the app.
 * Responsibilities: Sets up context, provider, and exposes hooks/selectors/actions for order operations.
 * Architecture: Centralizes order state, connects reducer and middleware, and enables modular access to order logic.
 */
// ...existing code...
import React from "react";
import { Order } from "@/database/models/order.model";
import { Person } from "@/database/models/person.model";
import {
  createFunctionalContext,
  loggingMiddleware,
  optimisticMiddleware,
  persistenceMiddleware,
} from "@/utils/fp-contexts";
import { OrderState, OrderAction } from "./types";
import { createInitialState } from "./orderUtils";
import { orderReducer } from "./orderReducer";
import { orderValidation, optimisticRollbacks } from "./orderMiddleware";
import { useOrderStatus } from "./useOrderStatus";
import { useApproverSelection } from "./useApproverSelection";
import { useOrderTracking } from "./useOrderTracking";
import { withErrorBoundary } from "@/components/ErrorBoundary";

// =======================
// Custom Hook Exports
// =======================
// Export hooks for consumers of OrderContext
export { useOrderStatus, useApproverSelection, useOrderTracking };

// =======================
// Context Setup and Exports
// =======================

/**
 * Creates the functional context for order state management.
 * Uses custom reducer, middleware, and initial state.
 * @returns contextResult - The context object with state, actions, and selectors.
 */
const contextResult = createFunctionalContext<OrderState, OrderAction>({
  name: "Order",
  initialState: createInitialState({} as Order, []),
  reducer: orderReducer,
  middleware: [
    loggingMiddleware,
    orderValidation,
    optimisticMiddleware(optimisticRollbacks),
    persistenceMiddleware("order-context", {
      exclude: ["loading", "error", "lastUpdated", "version", "notifications"],
    }),
  ],
  debugMode: process.env.NODE_ENV === "development",
});

/**
 * Provides access to order context, actions, and selectors.
 * @see contextResult for details on available properties.
 */
export const OrderContext = (contextResult as any).Context;
export const BaseOrderProvider = (contextResult as any).Provider;
export const useOrderContext = (contextResult as any).useContext;
export const useOrderContextResult = (contextResult as any).useContextResult;
export const useOrderSelector = (contextResult as any).useSelector;
export const useOrderActions = (contextResult as any).useActions;

// =======================
// Provider Component
// =======================

/**
 * Provider component for OrderContext.
 * Initializes context state with order and approver list.
 * @param {Order} order - The order object
 * @param {Person[]} approverList - List of approver Person objects
 * @param {React.ReactNode} children - React children nodes
 * @returns {JSX.Element} Context provider wrapping children
 */
interface OrderProviderProps {
  order: Order;
  approverList: Person[];
  children: React.ReactNode;
}

/**
 * Provider component for OrderContext.
 * Initializes context state with order and approver list.
 * @param {Order} order - The order object to initialize state.
 * @param {Person[]} approverList - List of approvers.
 * @param {React.ReactNode} children - Child components.
 * @returns {JSX.Element} Context provider wrapping children.
 * Side effects: Initializes context state.
 * Public API.
 */
const OrderProviderComponent: React.FC<OrderProviderProps> = ({
  order,
  approverList,
  children,
}) => {
  // Memoize initial state for performance
  const initialData = React.useMemo(
    () => createInitialState(order, approverList),
    [order, approverList]
  );
  return (
    <BaseOrderProvider initialState={initialData}>{children}</BaseOrderProvider>
  );
};

// Apply error boundary to the provider
export const OrderProvider = withErrorBoundary(
  OrderProviderComponent,
  "OrderContext",
  <div>Failed to load Order context. Please refresh the page.</div>
);

// =======================
// File Purpose
// =======================
/**
 * OrderContext with functional programming patterns
 * Provides immutable state management for order operations
 */
