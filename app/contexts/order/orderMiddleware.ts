/**
 * orderMiddleware.ts
 * Purpose: Defines middleware functions for order context (logging, validation, optimistic updates, persistence).
 * Responsibilities: Intercepts actions, adds side effects, and enforces business rules.
 * Architecture: Pluggable middleware for OrderContext, enhancing reducer logic.
 */

import { OrderState, OrderAction } from "./types";

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
