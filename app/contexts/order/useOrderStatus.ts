/**
 * useOrderStatus.ts
 * Purpose: Custom hook to access and derive order status from context.
 * Responsibilities: Provides status info and helpers for components.
 * Architecture: Public API for consumers of OrderContext.
 */
// ...existing code...
import { Person } from "@/database/models/person.model";
import { useOrderActions, useOrderSelector } from "./OrderContext";
import { getPersonName } from "./orderUtils";
import { failure } from "@/lib/fp-utils";

/**
 * Hook for order status management
 * Provides confirm, reject, cancel, and complete actions for orders.
 */
export const useOrderStatus = () => {
  const actions = useOrderActions();
  const order = useOrderSelector((state: any) => state.order);
  const selectedApprover = useOrderSelector(
    (state: any) => state.selectedApprover
  );

  // Confirm order
  const confirmOrder = async (approver: Person) => {
    if (actions._tag !== "Some")
      return failure(new Error("Order context not available"));
    const result = actions.value.dispatchSafe({
      type: "CONFIRM_ORDER",
      payload: approver,
      meta: { timestamp: Date.now(), optimistic: true },
    });
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
  };

  // Reject order
  const rejectOrder = async (approver: Person, reason: string) => {
    if (actions._tag !== "Some")
      return failure(new Error("Order context not available"));
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
  };

  // Cancel order
  const cancelOrder = async (reason: string, actor?: Person) => {
    if (actions._tag !== "Some")
      return failure(new Error("Order context not available"));
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
  };

  // Complete order
  const completeOrder = async (actor?: Person) => {
    if (actions._tag !== "Some")
      return failure(new Error("Order context not available"));
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
  };

  // Computed: can confirm/reject/cancel
  const canConfirm = order._tag === "Some" && order.value.status === "pending";
  const canReject = canConfirm;
  const canCancel =
    order._tag === "Some" &&
    !["completed", "cancelled"].includes(order.value.status);

  return {
    order,
    selectedApprover,
    confirmOrder,
    rejectOrder,
    cancelOrder,
    completeOrder,
    canConfirm,
    canReject,
    canCancel,
  };
};
