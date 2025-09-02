/**
 * useOrderTracking.ts
 * Purpose: Custom hook for tracking order changes, history, or notifications.
 * Responsibilities: Exposes tracking state and helpers for order lifecycle.
 * Architecture: Public API for order-related components.
 */
import { useOrderContext } from "./OrderContext";
import { success, failure } from "@/utils/fp";
import { OrderNotification, OrderHistoryEntry } from "./types";

/**
 * Hook for order history and notifications
 * Provides methods to add, dismiss, and clear notifications and history entries.
 */
export const useOrderTracking = () => {
  const context = useOrderContext();
  const orderHistory =
    context._tag === "Some" ? context.value.state.data.orderHistory : [];
  const notifications =
    context._tag === "Some" ? context.value.state.data.notifications : [];
  const dispatch = context._tag === "Some" ? context.value.dispatch : undefined;

  // Add history entry
  const addHistoryEntry = (
    entry: Omit<OrderHistoryEntry, "id" | "timestamp">
  ) => {
    if (!dispatch) return failure(new Error("Order context not available"));
    try {
      dispatch({ type: "ADD_HISTORY_ENTRY", payload: entry });
      return success(undefined);
    } catch (e) {
      return failure(e instanceof Error ? e : new Error("Unknown error"));
    }
  };

  // Add notification
  const addNotification = (
    notification: Omit<OrderNotification, "id" | "timestamp" | "dismissed">
  ) => {
    if (!dispatch) return failure(new Error("Order context not available"));
    try {
      dispatch({ type: "ADD_NOTIFICATION", payload: notification });
      return success(undefined);
    } catch (e) {
      return failure(e instanceof Error ? e : new Error("Unknown error"));
    }
  };

  // Dismiss notification
  const dismissNotification = (notificationId: string) => {
    if (!dispatch) return failure(new Error("Order context not available"));
    try {
      dispatch({ type: "DISMISS_NOTIFICATION", payload: notificationId });
      return success(undefined);
    } catch (e) {
      return failure(e instanceof Error ? e : new Error("Unknown error"));
    }
  };

  // Clear all notifications
  const clearNotifications = () => {
    if (!dispatch) return failure(new Error("Order context not available"));
    try {
      dispatch({ type: "CLEAR_NOTIFICATIONS" });
      return success(undefined);
    } catch (e) {
      return failure(e instanceof Error ? e : new Error("Unknown error"));
    }
  };

  // Computed: active notifications
  const activeNotifications = notifications.filter(
    (n: OrderNotification) => !n.dismissed
  );

  // Computed: recent history (last 10, sorted desc)
  const recentHistory = [...orderHistory]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  // Computed: notification count
  const notificationCount = activeNotifications.length;

  return {
    orderHistory,
    notifications,
    activeNotifications,
    recentHistory,
    addHistoryEntry,
    addNotification,
    dismissNotification,
    clearNotifications,
    notificationCount,
  };
};
