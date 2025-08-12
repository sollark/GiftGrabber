/**
 * orderReducer.ts
 * Purpose: Contains the reducer function for order state transitions.
 * Responsibilities: Handles all order-related actions and updates state accordingly.
 * Architecture: Used by OrderContext to manage state changes in a functional, predictable way.
 */
import { Result, success, failure, some, none } from "@/lib/fp-utils";
import { Order } from "@/database/models/order.model";
import type { Person } from "@/database/models/person.model";
import {
  OrderAction,
  OrderState,
  EnhancedOrder,
  LocalOrderStatus,
  OrderHistoryEntry,
  OrderNotification,
} from "./types";
import { getPersonName, convertOrderToEnhanced } from "./orderUtils";

/**
 * Reducer for order state.
 * Purpose: Handles all order-related actions and updates state accordingly.
 * @param state {OrderState} - Current order state.
 * @param action {OrderAction} - Action to process.
 * @returns {Result<OrderState, Error>} New state after applying action or error.
 * Side effects: None (pure function).
 * Public API.
 * Business logic: Implements rules for order status, updates, and error handling.
 */
export const orderReducer = (
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
