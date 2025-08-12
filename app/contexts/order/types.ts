/**
 * types.ts
 * Purpose: Declares TypeScript types and interfaces for order context.
 * Responsibilities: Defines shape of state, actions, and related entities.
 * Architecture: Shared by reducer, middleware, context, and hooks for type safety.
 */
// ...existing code...
import { Order } from "@/database/models/order.model";
import { Person } from "@/database/models/person.model";
import { FunctionalState, FunctionalAction } from "@/lib/fp-contexts";
import { Maybe } from "@/lib/fp-utils";

// Local order status for internal operations
export type LocalOrderStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "completed"
  | "cancelled";

// Enhanced order type with local status
export interface EnhancedOrder extends Omit<Order, "status"> {
  status: LocalOrderStatus;
}

// Main order state for context
export interface OrderState
  extends FunctionalState<{
    order: EnhancedOrder;
    approverList: Person[];
    selectedApprover: Maybe<Person>;
    orderHistory: OrderHistoryEntry[];
    notifications: OrderNotification[];
    optimisticUpdates: Record<string, any>;
  }> {}

// History entry for order actions
export interface OrderHistoryEntry {
  id: string;
  timestamp: number;
  action: string;
  actor: Person;
  details: string;
  metadata?: Record<string, any>;
}

// Notification for order events
export interface OrderNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  timestamp: number;
  dismissed: boolean;
}

// All possible actions for order context
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
