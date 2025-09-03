import ErrorMessage from "@/components/ui/ErrorMessage";
/**
 * OrderContext.tsx
 * Purpose: Provides the main React context for order state management in the app.
 * Responsibilities: Sets up context, provider, and exposes hooks/selectors/actions for order operations.
 * Architecture: Centralizes order state, connects reducer and middleware, and enables modular access to order logic.
 */
import React from "react";
import useSafeContext from "@/app/hooks/useSafeContext";
import { newOrder, OrderStatus } from "@/types/common.types";
import { OrderState, OrderAction } from "./types";
import { none } from "@/utils/fp";
import {
  createFunctionalContext,
  loggingMiddleware,
  optimisticMiddleware,
  persistenceMiddleware,
} from "@/utils/fp-contexts";
import { orderReducer } from "./orderReducer";
import { optimisticRollbacks } from "./orderMiddleware";
import { useOrderStatus } from "./useOrderStatus";
import { useOrderTracking } from "./useOrderTracking";
import { withErrorBoundary } from "@/components/ErrorBoundary";

// Utility to create initial OrderState for context
function createInitialState(order: newOrder): OrderState {
  return {
    data: {
      order,
      orderHistory: [],
      notifications: [],
      optimisticUpdates: {},
    },
    loading: false,
    error: none,
    lastUpdated: Date.now(),
    version: 0,
  };
}

// Default order data for context initialization
const defaultOrderData: newOrder = {
  createdAt: new Date(),
  applicant: null,
  gifts: [],
  publicOrderId: `order-${Date.now()}`,
  confirmationRQCode: "",
  status: OrderStatus.PENDING,
};

// =======================
// Custom Hook Exports
// =======================
// Export hooks for consumers of OrderContext
export { useOrderStatus, useOrderTracking };

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
  initialState: createInitialState(defaultOrderData),
  reducer: orderReducer,
  middleware: [
    loggingMiddleware,
    optimisticMiddleware(optimisticRollbacks),
    persistenceMiddleware("order-context", {
      exclude: ["loading", "error", "lastUpdated", "version", "notifications"],
    }),
  ],
  debugMode: process.env.NODE_ENV === "development",
});

/**
 * Provides access to order context, actions, and selectors.
 * All exports are properly typed from the functional context factory.
 */
export const OrderContext = contextResult.Context;
const BaseOrderProvider = contextResult.Provider;
export const useOrderContext = () => {
  return useSafeContext(OrderContext, "OrderContext");
};

// =======================
// Provider Component
// =======================

/**
 * Provider component for OrderContext.
 * @param {newOrder} order - The order object
 * @param {React.ReactNode} children - React children nodes
 * @returns {JSX.Element} Context provider wrapping children
 */
interface OrderProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for OrderContext.
 * @param {newOrder} order - The order object to initialize state.
 * @param {React.ReactNode} children - Child components.
 * @returns {JSX.Element} Context provider wrapping children.
 * Side effects: Initializes context state.
 * Public API.
 */
const OrderProviderComponent: React.FC<OrderProviderProps> = ({ children }) => {
  // Memoize initial state for performance
  const initialData = React.useMemo(
    () => createInitialState(defaultOrderData),
    []
  );
  return (
    <BaseOrderProvider initialState={initialData}>{children}</BaseOrderProvider>
  );
};

// Apply error boundary to the provider
export const OrderProvider = withErrorBoundary(
  OrderProviderComponent,
  "OrderContext",
  <ErrorMessage message="Failed to load Order context. Please refresh the page." />
);

const OrderContextExports = {
  OrderProvider,
  useOrderContext,
};

export default OrderContextExports;
