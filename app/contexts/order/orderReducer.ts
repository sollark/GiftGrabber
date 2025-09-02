/**
 * orderReducer.ts
 * Purpose: Contains the reducer function for order state transitions.
 * Responsibilities: Handles all order-related actions and updates state accordingly.
 * Architecture: Used by OrderContext to manage state changes in a functional, predictable way.
 */
import { Result, success, failure, some, none } from "@/utils/fp";
import { Order } from "@/database/models/order.model";
import type { Person } from "@/database/models/person.model";
import {
  OrderAction,
  OrderState,
  OrderHistoryEntry,
  OrderNotification,
} from "./types";
import { OrderStatus } from "@/types/common.types";

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
          order: action.payload as Order,
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

    case "CANCEL_ORDER":
      const cancelReason = action.payload?.reason as string;
      return success({
        ...state,
        data: {
          ...state.data,
          order: {
            ...state.data.order,
            status: "cancelled" as OrderStatus,
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
            status: "completed" as OrderStatus,
            completedAt: new Date(),
          },
          orderHistory: [
            ...state.data.orderHistory,
            {
              id: `complete-${Date.now()}`,
              timestamp: Date.now(),
              action: "COMPLETED",
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

function getPersonName(person: Person): string {
  return `${person.firstName} ${person.lastName}`;
}
