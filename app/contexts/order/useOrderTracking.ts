/**
 * useOrderTracking.ts
 * Purpose: Custom hook for tracking order changes, history, or notifications.
 * Responsibilities: Exposes tracking state and helpers for order lifecycle.
 * Architecture: Public API for order-related components.
 */
import { useOrderActions, useOrderSelector } from "./OrderContext";
import { failure } from "@/utils/fp";
import { OrderNotification, OrderHistoryEntry } from "./types";

/**
 * Hook for order history and notifications
 * Provides methods to add, dismiss, and clear notifications and history entries.
 */
export const useOrderTracking = () => {
  const actions = useOrderActions();
  const orderHistory = useOrderSelector((state: any) => state.orderHistory);
  const notifications = useOrderSelector((state: any) => state.notifications);

  // Add history entry
  const addHistoryEntry = (
    entry: Omit<OrderHistoryEntry, "id" | "timestamp">
  ) => {
    if (actions._tag !== "Some")
      return failure(new Error("Order context not available"));
    return actions.value.dispatchSafe({
      type: "ADD_HISTORY_ENTRY",
      payload: entry,
    });
  };

  // Add notification
  const addNotification = (
    notification: Omit<OrderNotification, "id" | "timestamp" | "dismissed">
  ) => {
    if (actions._tag !== "Some")
      return failure(new Error("Order context not available"));
    return actions.value.dispatchSafe({
      type: "ADD_NOTIFICATION",
      payload: notification,
    });
  };

  // Dismiss notification
  const dismissNotification = (notificationId: string) => {
    if (actions._tag !== "Some")
      return failure(new Error("Order context not available"));
    return actions.value.dispatchSafe({
      type: "DISMISS_NOTIFICATION",
      payload: notificationId,
    });
  };

  // Clear all notifications
  const clearNotifications = () => {
    if (actions._tag !== "Some")
      return failure(new Error("Order context not available"));
    return actions.value.dispatchSafe({ type: "CLEAR_NOTIFICATIONS" });
  };

  // Computed: active notifications
  const activeNotifications =
    notifications._tag === "Some"
      ? notifications.value.filter((n: OrderNotification) => !n.dismissed)
      : [];

  // Computed: recent history (last 10, sorted desc)
  const recentHistory =
    orderHistory._tag === "Some"
      ? [...orderHistory.value]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10)
      : [];

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
