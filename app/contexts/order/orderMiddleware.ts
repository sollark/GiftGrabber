/**
 * orderMiddleware.ts
 * Purpose: Defines middleware functions for order context (logging, validation, optimistic updates, persistence).
 * Responsibilities: Intercepts actions, adds side effects, and enforces business rules.
 * Architecture: Pluggable middleware for OrderContext, enhancing reducer logic.
 */
import {
  validationMiddleware,
  optimisticMiddleware,
} from "@/utils/fp-contexts";
import { success, failure } from "@/utils/fp";
import { OrderState, OrderAction } from "./types";
import { isPersonInList } from "@/utils/utils";
import { OrderStatus } from "@/types/common.types";

/**
 * Validation middleware for order actions.
 * @param action - OrderAction to validate.
 * @param state - Current OrderState.
 * @returns Result<boolean, string>
 */
export const orderValidation = validationMiddleware<OrderState, OrderAction>(
  (action, state) => {
    switch (action.type) {
      case "SELECT_APPROVER":
        if (!action.payload) {
          return failure("Approver data is required");
        }
        if (!isPersonInList(state.data.approverList, action.payload)) {
          return failure("Approver not found in approver list");
        }
        return success(true);
      case "CONFIRM_ORDER":
        if (state.data.order.status !== OrderStatus.PENDING) {
          return failure("Only pending orders can be confirmed");
        }
        if (!action.payload) {
          return failure("Approver required for confirmation");
        }
        return success(true);
      case "REJECT_ORDER":
        if (state.data.order.status !== OrderStatus.PENDING) {
          return failure("Only pending orders can be rejected");
        }
        if (!action.payload?.approver) {
          return failure("Approver required for rejection");
        }
        return success(true);
      case "CANCEL_ORDER":
        if (
          state.data.order.status === OrderStatus.COMPLETED ||
          state.data.order.status === OrderStatus.CANCELLED
        ) {
          return failure("Cannot cancel completed or already cancelled orders");
        }
        return success(true);
      default:
        return success(true);
    }
  }
);

/**
 * Optimistic rollback actions for order context.
 */
export const optimisticRollbacks = {
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
