/**
 * useOrderStatus.ts
 * Purpose: Custom hook to access and derive order status from context.
 * Responsibilities: Provides status info and helpers for components.
 * Architecture: Public API for consumers of OrderContext.
 */
import { Person } from "@/database/models/person.model";
import { useOrderContext } from "./OrderContext";
import { success, failure } from "@/utils/fp";
import { OrderStatus } from "@/types/common.types";

/**
 * Hook for order status management
 * Provides confirm, reject, cancel, and complete actions for orders.
 */
export const useOrderStatus = () => {
  const context = useOrderContext();
  const order = context?.state?.data?.order;
  const dispatch = context?.dispatch;

  // Confirm order
  const confirmOrder = async () => {
    if (!dispatch) return failure(new Error("Order context not available"));
    // Implement confirm logic if needed
    return;
  };

  // Reject order
  const rejectOrder = async (reason: string) => {
    if (!dispatch) return failure(new Error("Order context not available"));
    // Implement reject logic if needed
    return;
  };

  // Cancel order
  const cancelOrder = async (reason: string, actor?: Person) => {
    if (!dispatch) return failure(new Error("Order context not available"));
    try {
      dispatch({ type: "CANCEL_ORDER", payload: { reason, actor } });
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "info",
          message: "Order has been cancelled",
        },
      });
      return success(undefined);
    } catch (e) {
      return failure(e instanceof Error ? e : new Error("Unknown error"));
    }
  };

  // Complete order
  const completeOrder = async (actor?: Person) => {
    if (!dispatch) return failure(new Error("Order context not available"));
    try {
      dispatch({ type: "COMPLETE_ORDER", payload: { actor } });
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "success",
          message: "Order completed successfully!",
        },
      });
      return success(undefined);
    } catch (e) {
      return failure(e instanceof Error ? e : new Error("Unknown error"));
    }
  };

  // Computed: can confirm/reject/cancel
  const canConfirm = order && order.status === OrderStatus.PENDING;
  const canReject = canConfirm;
  const canCancel =
    order &&
    ![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status);

  return {
    order,
    confirmOrder,
    rejectOrder,
    cancelOrder,
    completeOrder,
    canConfirm,
    canReject,
    canCancel,
  };
};

// Remove: import { getPersonName } from "./orderUtils";
// Add local implementation if needed
function getPersonName(
  person: import("@/database/models/person.model").Person
): string {
  return `${person.firstName} ${person.lastName}`;
}
