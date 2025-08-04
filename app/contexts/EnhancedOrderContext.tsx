/**
 * Enhanced OrderContext with functional programming patterns - Fixed Version
 * Provides immutable state management for order operations
 */

import React from "react";
import { Order } from "@/database/models/order.model";
import { Person } from "@/database/models/person.model";
import { OrderStatus as ImportedOrderStatus } from "@/components/types/OrderStatus";
import {
  createFunctionalContext,
  FunctionalAction,
  FunctionalState,
  loggingMiddleware,
  validationMiddleware,
  optimisticMiddleware,
  persistenceMiddleware,
} from "@/lib/fp-contexts";
import { Result, Maybe, some, none, success, failure } from "@/lib/fp-utils";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

// Use local type for internal operations, map to imported enum when needed
export type LocalOrderStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "completed"
  | "cancelled";

// Helper to get person name
const getPersonName = (person: Person): string => {
  return `${person.firstName} ${person.lastName}`;
};

// Helper to convert between status types
const mapToImportedStatus = (status: LocalOrderStatus): ImportedOrderStatus => {
  switch (status) {
    case "pending":
      return ImportedOrderStatus.PENDING;
    case "confirmed":
      return ImportedOrderStatus.COMPLETE;
    case "rejected":
      return ImportedOrderStatus.CANCELLED;
    case "completed":
      return ImportedOrderStatus.COMPLETE;
    case "cancelled":
      return ImportedOrderStatus.CANCELLED;
    default:
      return ImportedOrderStatus.PENDING;
  }
};

export interface EnhancedOrder extends Omit<Order, "status"> {
  status: LocalOrderStatus;
}

export interface OrderState
  extends FunctionalState<{
    order: EnhancedOrder;
    approverList: Person[];
    selectedApprover: Maybe<Person>;
    orderHistory: OrderHistoryEntry[];
    notifications: OrderNotification[];
    optimisticUpdates: Record<string, any>;
  }> {}

export interface OrderHistoryEntry {
  id: string;
  timestamp: number;
  action: string;
  actor: Person;
  details: string;
  metadata?: Record<string, any>;
}

export interface OrderNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  timestamp: number;
  dismissed: boolean;
}

export interface OrderAction extends FunctionalAction {
  type:
    | "SET_ORDER"
    | "UPDATE_ORDER"
    | "SET_APPROVER_LIST"
    | "SELECT_APPROVER"
    | "CLEAR_APPROVER"
    | "CONFIRM_ORDER"
    | "REJECT_ORDER"
    | "CANCEL_ORDER"
    | "COMPLETE_ORDER"
    | "ADD_HISTORY_ENTRY"
    | "ADD_NOTIFICATION"
    | "DISMISS_NOTIFICATION"
    | "CLEAR_NOTIFICATIONS"
    | "SET_OPTIMISTIC_UPDATE"
    | "CLEAR_OPTIMISTIC_UPDATE";
  payload?: any;
}

// ============================================================================
// INITIAL STATE AND REDUCER
// ============================================================================

// Helper function to convert Order to EnhancedOrder
const convertOrderToEnhanced = (order: Order): EnhancedOrder => ({
  ...order,
  status: order.status as unknown as LocalOrderStatus,
});

const createInitialState = (
  order: Order,
  approverList: Person[] = []
): OrderState => ({
  data: {
    order: convertOrderToEnhanced(order),
    approverList,
    selectedApprover: order.confirmedBy ? some(order.confirmedBy) : none,
    orderHistory: [],
    notifications: [],
    optimisticUpdates: {},
  },
  loading: false,
  error: none,
  lastUpdated: Date.now(),
  version: 0,
});

const orderReducer = (
  state: OrderState,
  action: OrderAction
): Result<OrderState, Error> => {
  switch (action.type) {
    case "SET_ORDER":
      if (!action.payload || typeof action.payload !== "object") {
        return failure(new Error("Invalid order data"));
      }
      return success({
        ...state,
        data: {
          ...state.data,
          order: convertOrderToEnhanced(action.payload as Order),
        },
      });

    case "UPDATE_ORDER":
      if (!action.payload || typeof action.payload !== "object") {
        return failure(new Error("Invalid order update data"));
      }
      return success({
        ...state,
        data: {
          ...state.data,
          order: {
            ...state.data.order,
            ...action.payload,
          },
        },
      });

    case "SET_APPROVER_LIST":
      if (!Array.isArray(action.payload)) {
        return failure(new Error("Approver list must be an array"));
      }
      return success({
        ...state,
        data: {
          ...state.data,
          approverList: action.payload as Person[],
        },
      });

    case "SELECT_APPROVER":
      if (!action.payload || typeof action.payload !== "object") {
        return failure(new Error("Invalid approver data"));
      }
      return success({
        ...state,
        data: {
          ...state.data,
          selectedApprover: some(action.payload as Person),
        },
      });

    case "CLEAR_APPROVER":
      return success({
        ...state,
        data: {
          ...state.data,
          selectedApprover: none,
        },
      });

    case "CONFIRM_ORDER":
      const confirmApprover = action.payload as Person;
      if (!confirmApprover) {
        return failure(new Error("Approver required for confirmation"));
      }

      return success({
        ...state,
        data: {
          ...state.data,
          order: {
            ...state.data.order,
            status: "confirmed" as LocalOrderStatus,
            confirmedBy: confirmApprover,
            confirmedAt: new Date(),
          },
          selectedApprover: some(confirmApprover),
          orderHistory: [
            ...state.data.orderHistory,
            {
              id: `confirm-${Date.now()}`,
              timestamp: Date.now(),
              action: "CONFIRM",
              actor: confirmApprover,
              details: `Order confirmed by ${getPersonName(confirmApprover)}`,
            },
          ],
        },
      });

    case "REJECT_ORDER":
      const rejectApprover = action.payload?.approver as Person;
      const reason = action.payload?.reason as string;

      if (!rejectApprover) {
        return failure(new Error("Approver required for rejection"));
      }

      return success({
        ...state,
        data: {
          ...state.data,
          order: {
            ...state.data.order,
            status: "rejected" as LocalOrderStatus,
            rejectedBy: rejectApprover,
            rejectedAt: new Date(),
            rejectionReason: reason,
          },
          orderHistory: [
            ...state.data.orderHistory,
            {
              id: `reject-${Date.now()}`,
              timestamp: Date.now(),
              action: "REJECT",
              actor: rejectApprover,
              details: `Order rejected by ${getPersonName(rejectApprover)}`,
              metadata: { reason },
            },
          ],
        },
      });

    case "CANCEL_ORDER":
      const cancelReason = action.payload?.reason as string;

      return success({
        ...state,
        data: {
          ...state.data,
          order: {
            ...state.data.order,
            status: "cancelled" as LocalOrderStatus,
            cancelledAt: new Date(),
            cancellationReason: cancelReason,
          },
          orderHistory: [
            ...state.data.orderHistory,
            {
              id: `cancel-${Date.now()}`,
              timestamp: Date.now(),
              action: "CANCEL",
              actor: action.payload?.actor || { name: "System" },
              details: "Order cancelled",
              metadata: { reason: cancelReason },
            },
          ],
        },
      });

    case "COMPLETE_ORDER":
      return success({
        ...state,
        data: {
          ...state.data,
          order: {
            ...state.data.order,
            status: "completed" as LocalOrderStatus,
            completedAt: new Date(),
          },
          orderHistory: [
            ...state.data.orderHistory,
            {
              id: `complete-${Date.now()}`,
              timestamp: Date.now(),
              action: "COMPLETE",
              actor: action.payload?.actor || { name: "System" },
              details: "Order completed",
            },
          ],
        },
      });

    case "ADD_HISTORY_ENTRY":
      if (!action.payload || typeof action.payload !== "object") {
        return failure(new Error("Invalid history entry"));
      }

      return success({
        ...state,
        data: {
          ...state.data,
          orderHistory: [
            ...state.data.orderHistory,
            {
              id: `entry-${Date.now()}`,
              timestamp: Date.now(),
              ...action.payload,
            } as OrderHistoryEntry,
          ],
        },
      });

    case "ADD_NOTIFICATION":
      if (!action.payload || typeof action.payload !== "object") {
        return failure(new Error("Invalid notification data"));
      }

      return success({
        ...state,
        data: {
          ...state.data,
          notifications: [
            ...state.data.notifications,
            {
              id: `notif-${Date.now()}`,
              timestamp: Date.now(),
              dismissed: false,
              ...action.payload,
            } as OrderNotification,
          ],
        },
      });

    case "DISMISS_NOTIFICATION":
      const notificationId = action.payload as string;
      if (!notificationId) {
        return failure(new Error("Notification ID required"));
      }

      return success({
        ...state,
        data: {
          ...state.data,
          notifications: state.data.notifications.map((notif) =>
            notif.id === notificationId ? { ...notif, dismissed: true } : notif
          ),
        },
      });

    case "CLEAR_NOTIFICATIONS":
      return success({
        ...state,
        data: {
          ...state.data,
          notifications: [],
        },
      });

    case "SET_OPTIMISTIC_UPDATE":
      const { key, value } = action.payload || {};
      if (!key) {
        return failure(new Error("Update key required"));
      }

      return success({
        ...state,
        data: {
          ...state.data,
          optimisticUpdates: {
            ...state.data.optimisticUpdates,
            [key]: value,
          },
        },
      });

    case "CLEAR_OPTIMISTIC_UPDATE":
      const updateKey = action.payload as string;
      if (!updateKey) {
        return failure(new Error("Update key required"));
      }

      const { [updateKey]: removed, ...remaining } =
        state.data.optimisticUpdates;
      return success({
        ...state,
        data: {
          ...state.data,
          optimisticUpdates: remaining,
        },
      });

    default:
      return failure(new Error(`Unknown action type: ${action.type}`));
  }
};

// ============================================================================
// VALIDATION AND MIDDLEWARE
// ============================================================================

const orderValidation = validationMiddleware<OrderState, OrderAction>(
  (action, state) => {
    switch (action.type) {
      case "SELECT_APPROVER":
        if (!action.payload) {
          return failure("Approver data is required");
        }
        if (
          !state.data.approverList.some((p) => p._id === action.payload._id)
        ) {
          return failure("Approver not found in approver list");
        }
        return success(true);

      case "CONFIRM_ORDER":
        if (state.data.order.status !== "pending") {
          return failure("Only pending orders can be confirmed");
        }
        if (!action.payload) {
          return failure("Approver required for confirmation");
        }
        return success(true);

      case "REJECT_ORDER":
        if (state.data.order.status !== "pending") {
          return failure("Only pending orders can be rejected");
        }
        if (!action.payload?.approver) {
          return failure("Approver required for rejection");
        }
        return success(true);

      case "CANCEL_ORDER":
        if (["completed", "cancelled"].includes(state.data.order.status)) {
          return failure("Cannot cancel completed or already cancelled orders");
        }
        return success(true);

      default:
        return success(true);
    }
  }
);

// Optimistic rollback actions
const optimisticRollbacks = {
  CONFIRM_ORDER: (state: OrderState): OrderAction => ({
    type: "UPDATE_ORDER",
    payload: { status: "pending" },
    meta: { timestamp: Date.now(), source: "rollback" },
  }),
  REJECT_ORDER: (state: OrderState): OrderAction => ({
    type: "UPDATE_ORDER",
    payload: { status: "pending" },
    meta: { timestamp: Date.now(), source: "rollback" },
  }),
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

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

export const OrderContext = (contextResult as any).Context;
export const BaseOrderProvider = (contextResult as any).Provider;
export const useOrderContext = (contextResult as any).useContext;
export const useOrderContextResult = (contextResult as any).useContextResult;
export const useOrderSelector = (contextResult as any).useSelector;
export const useOrderActions = (contextResult as any).useActions;

// ============================================================================
// ENHANCED PROVIDER WITH PROPS
// ============================================================================

interface OrderProviderProps {
  order: Order;
  approverList: Person[];
  children: React.ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({
  order,
  approverList,
  children,
}) => {
  const initialData = React.useMemo(
    () => createInitialState(order, approverList),
    [order, approverList]
  );

  return (
    <BaseOrderProvider initialState={initialData}>{children}</BaseOrderProvider>
  );
};

// ============================================================================
// ENHANCED HOOKS FOR ORDER OPERATIONS
// ============================================================================

/**
 * Hook for order status management
 */
export const useOrderStatus = () => {
  const actions = useOrderActions();
  const order = useOrderSelector((state: any) => state.order);
  const selectedApprover = useOrderSelector(
    (state: any) => state.selectedApprover
  );

  const confirmOrder = React.useCallback(
    async (approver: Person) => {
      if (actions._tag === "Some") {
        // Optimistic update
        const result = actions.value.dispatchSafe({
          type: "CONFIRM_ORDER",
          payload: approver,
          meta: { timestamp: Date.now(), optimistic: true },
        });

        // Add success notification
        if (result._tag === "Success") {
          actions.value.dispatchSafe({
            type: "ADD_NOTIFICATION",
            payload: {
              type: "success",
              message: `Order confirmed by ${getPersonName(approver)}`,
            },
          });
        }

        return result;
      }
      return failure(new Error("Order context not available"));
    },
    [actions]
  );

  const rejectOrder = React.useCallback(
    async (approver: Person, reason: string) => {
      if (actions._tag === "Some") {
        const result = actions.value.dispatchSafe({
          type: "REJECT_ORDER",
          payload: { approver, reason },
          meta: { timestamp: Date.now(), optimistic: true },
        });

        if (result._tag === "Success") {
          actions.value.dispatchSafe({
            type: "ADD_NOTIFICATION",
            payload: {
              type: "warning",
              message: `Order rejected by ${getPersonName(approver)}`,
            },
          });
        }

        return result;
      }
      return failure(new Error("Order context not available"));
    },
    [actions]
  );

  const cancelOrder = React.useCallback(
    async (reason: string, actor?: Person) => {
      if (actions._tag === "Some") {
        const result = actions.value.dispatchSafe({
          type: "CANCEL_ORDER",
          payload: { reason, actor },
        });

        if (result._tag === "Success") {
          actions.value.dispatchSafe({
            type: "ADD_NOTIFICATION",
            payload: {
              type: "info",
              message: "Order has been cancelled",
            },
          });
        }

        return result;
      }
      return failure(new Error("Order context not available"));
    },
    [actions]
  );

  const completeOrder = React.useCallback(
    async (actor?: Person) => {
      if (actions._tag === "Some") {
        const result = actions.value.dispatchSafe({
          type: "COMPLETE_ORDER",
          payload: { actor },
        });

        if (result._tag === "Success") {
          actions.value.dispatchSafe({
            type: "ADD_NOTIFICATION",
            payload: {
              type: "success",
              message: "Order completed successfully!",
            },
          });
        }

        return result;
      }
      return failure(new Error("Order context not available"));
    },
    [actions]
  );

  return {
    order,
    selectedApprover,
    confirmOrder,
    rejectOrder,
    cancelOrder,
    completeOrder,
    canConfirm: order._tag === "Some" && order.value.status === "pending",
    canReject: order._tag === "Some" && order.value.status === "pending",
    canCancel:
      order._tag === "Some" &&
      !["completed", "cancelled"].includes(order.value.status),
  };
};

/**
 * Hook for approver selection
 */
export const useApproverSelection = () => {
  const actions = useOrderActions();
  const selectedApprover = useOrderSelector(
    (state: any) => state.selectedApprover
  );
  const approverList = useOrderSelector((state: any) => state.approverList);

  const selectApprover = React.useCallback(
    (approver: Person) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "SELECT_APPROVER",
          payload: approver,
        });
      }
      return failure(new Error("Order context not available"));
    },
    [actions]
  );

  const clearApprover = React.useCallback(() => {
    if (actions._tag === "Some") {
      return actions.value.dispatchSafe({
        type: "CLEAR_APPROVER",
      });
    }
    return failure(new Error("Order context not available"));
  }, [actions]);

  const getApprover = React.useCallback(() => {
    return selectedApprover._tag === "Some" &&
      selectedApprover.value._tag === "Some"
      ? selectedApprover.value.value
      : null;
  }, [selectedApprover]);

  return {
    selectedApprover,
    approverList,
    selectApprover,
    clearApprover,
    getApprover,
    hasSelection:
      selectedApprover._tag === "Some" &&
      selectedApprover.value._tag === "Some",
  };
};

/**
 * Hook for order history and notifications
 */
export const useOrderTracking = () => {
  const actions = useOrderActions();
  const orderHistory = useOrderSelector((state: any) => state.orderHistory);
  const notifications = useOrderSelector((state: any) => state.notifications);

  const addHistoryEntry = React.useCallback(
    (entry: Omit<OrderHistoryEntry, "id" | "timestamp">) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "ADD_HISTORY_ENTRY",
          payload: entry,
        });
      }
      return failure(new Error("Order context not available"));
    },
    [actions]
  );

  const addNotification = React.useCallback(
    (
      notification: Omit<OrderNotification, "id" | "timestamp" | "dismissed">
    ) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "ADD_NOTIFICATION",
          payload: notification,
        });
      }
      return failure(new Error("Order context not available"));
    },
    [actions]
  );

  const dismissNotification = React.useCallback(
    (notificationId: string) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "DISMISS_NOTIFICATION",
          payload: notificationId,
        });
      }
      return failure(new Error("Order context not available"));
    },
    [actions]
  );

  const clearNotifications = React.useCallback(() => {
    if (actions._tag === "Some") {
      return actions.value.dispatchSafe({
        type: "CLEAR_NOTIFICATIONS",
      });
    }
    return failure(new Error("Order context not available"));
  }, [actions]);

  // Computed values
  const activeNotifications = React.useMemo(() => {
    if (notifications._tag !== "Some") return [];
    return notifications.value.filter((n: any) => !n.dismissed);
  }, [notifications]);

  const recentHistory = React.useMemo(() => {
    if (orderHistory._tag !== "Some") return [];
    return orderHistory.value
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [orderHistory]);

  return {
    orderHistory,
    notifications,
    activeNotifications,
    recentHistory,
    addHistoryEntry,
    addNotification,
    dismissNotification,
    clearNotifications,
    notificationCount: activeNotifications.length,
  };
};

export default {
  OrderProvider,
  useOrderContext,
  useOrderContextResult,
  useOrderSelector,
  useOrderActions,
  useOrderStatus,
  useApproverSelection,
  useOrderTracking,
};
