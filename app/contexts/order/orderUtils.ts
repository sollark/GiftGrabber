import { Order } from "@/database/models/order.model";
import { Person } from "@/database/models/person.model";
import { OrderStatus as ImportedOrderStatus } from "@/components/types/OrderStatus";
import { some, none } from "@/lib/fp-utils";
import { EnhancedOrder, LocalOrderStatus, OrderState } from "./types";

/**
 * Maps imported OrderStatus enum to LocalOrderStatus string.
 * @param status - Imported order status.
 * @returns LocalOrderStatus string.
 */
export function mapToLocalStatus(
  status: ImportedOrderStatus
): LocalOrderStatus {
  switch (status) {
    case ImportedOrderStatus.PENDING:
      return "pending";
    case ImportedOrderStatus.COMPLETE:
      return "completed";
    case ImportedOrderStatus.CANCELLED:
      return "cancelled";
    default:
      return "pending";
  }
}

/**
 * Returns the full name of a person.
 * @param person - The person object.
 * @returns Full name string.
 */
export const getPersonName = (person: Person): string => {
  return `${person.firstName} ${person.lastName}`;
};

/**
 * Maps local order status to imported enum.
 * @param status - LocalOrderStatus value.
 * @returns ImportedOrderStatus value.
 */
export const mapToImportedStatus = (
  status: LocalOrderStatus
): ImportedOrderStatus => {
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

/**
 * Converts an Order to EnhancedOrder type.
 * @param order - The order object.
 * @returns EnhancedOrder object.
 */
export const convertOrderToEnhanced = (order: Order): EnhancedOrder => ({
  ...order,
  status: mapToLocalStatus(order.status),
});

/**
 * Creates the initial state for the order context.
 * @param order - The order object.
 * @param approverList - List of approvers.
 * @returns Initial OrderState.
 */
export const createInitialState = (
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
