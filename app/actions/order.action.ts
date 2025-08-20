"use server";

import { OrderStatus } from "@/components/order/OrderStatus";
import { Order } from "@/database/models/order.model";
import { withDatabase } from "@/lib/withDatabase";
import {
  createOrderInternal,
  findOrderByPublicId,
  confirmOrderInternal,
  getAllOrdersInternal,
  serializeOrder,
} from "@/service/orderService.refactored";
import { OrderCreationPublicData } from "@/types/common.types";
import { failure, Result, success, fromPromise } from "@/utils/fp";

/**
 * Log messages for order operations - Updated for PublicId Strategy
 */
const LOG_MESSAGES = {
  MAKE_ORDER_ERROR: "Error in makeOrder",
  GET_ORDER_START: "Getting an order using publicId...",
  GET_ORDER_ERROR: "Error in getOrder",
  CONFIRM_ORDER_START: (orderPublicId: string, approverPublicId: string) =>
    `in confirmOrder: ${orderPublicId} confirmed by ${approverPublicId}`,
  CONFIRM_ORDER_ERROR: "Error in confirmOrder",
  NEW_ORDER_CREATED: (order: Order) =>
    `Order created with publicId: ${order.publicId}`,
  USING_PUBLIC_ID: "Operation using publicId instead of _id",
} as const;

/**
 * Error messages for order operations
 */
const ERROR_MESSAGES = {
  ORDER_NOT_FOUND: "Order not found",
  ORDER_NOT_FOUND_OR_CONFIRMED: "Order not found or already confirmed",
} as const;

/**
 * Logs order creation success
 */
const logOrderCreation = (order: Order): void => {
  console.log(LOG_MESSAGES.NEW_ORDER_CREATED(order));
};

/**
 * Logs order-related errors
 */
const logOrderError = (message: string): void => {
  console.log(message);
};

/**
 * Logs order retrieval start
 */
const logOrderRetrieval = (): void => {
  console.log(LOG_MESSAGES.GET_ORDER_START);
};

/**
 * Logs order confirmation start - Updated for publicId
 */
const logOrderConfirmation = (
  orderPublicId: string,
  approverPublicId: string
): void => {
  console.log(
    LOG_MESSAGES.CONFIRM_ORDER_START(orderPublicId, approverPublicId)
  );
};

/**
 * Creates a new order in the database using publicIds (orchestration + error handling)
 */
const makeOrderInternal = async (
  applicantPublicId: string,
  giftPublicIds: string[],
  orderId: string,
  confirmationRQCode: string
): Promise<boolean | undefined> => {
  try {
    console.log(LOG_MESSAGES.USING_PUBLIC_ID);

    const orderData: OrderCreationPublicData = {
      applicantPublicId,
      giftPublicIds,
      orderId,
      confirmationRQCode,
    };

    const result = await createOrderInternal(orderData);

    if (result._tag === "Failure") {
      logOrderError(result.error);
      return undefined;
    }

    const newOrder = result.value;
    logOrderCreation(newOrder);
    return true;
  } catch (error) {
    logOrderError(LOG_MESSAGES.MAKE_ORDER_ERROR);
    return undefined;
  }
};

export const makeOrder = async (
  applicantPublicId: string,
  giftPublicIds: string[],
  orderId: string,
  confirmationRQCode: string
): Promise<boolean | undefined> => {
  return makeOrderInternal(
    applicantPublicId,
    giftPublicIds,
    orderId,
    confirmationRQCode
  );
};

/**
 * Retrieves an order by its ID with populated fields (orchestration + error handling)
 * Old version. Dont delete, it is example how to modify this kind of function
 */

// const getOrderInternal = async (
//   orderId: string
// ): Promise<Record<string, unknown> | null> => {
//   try {
//     logOrderRetrieval();

//     const order = await findOrderWithPopulation(orderId);
//     const result = validateOrderExists(order);
//     if (result._tag === "Failure") {
//       logOrderError(result.error);
//       return null;
//     }

//     return serializeOrder(result.value);
//   } catch (error) {
//     logOrderError(LOG_MESSAGES.GET_ORDER_ERROR);
//     return null;
//   }
// };

/**
 * Fetches an order with populated data and serializes it - Updated for publicId
 * @param orderId - The unique identifier for the order
 * @returns Result<Record<string, unknown>, Error> - Success with serialized order or Failure with Error
 */
export const getOrderInternal = async (
  orderId: string
): Promise<Result<Record<string, unknown>, Error>> => {
  try {
    console.log(LOG_MESSAGES.USING_PUBLIC_ID);
    const orderResult = await findOrderByPublicId(orderId);

    if (orderResult._tag === "Failure") {
      const err = new Error(orderResult.error);
      logOrderError(LOG_MESSAGES.GET_ORDER_ERROR);
      return failure(err);
    }

    if (!orderResult.value) {
      const err = new Error("Order not found");
      logOrderError(err.message);
      return failure(err);
    }

    return success(serializeOrder(orderResult.value));
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logOrderError(err.message);
    return failure(err);
  }
};

export const getOrder = withDatabase(async (orderId: string): Promise<any> => {
  const result = await getOrderInternal(orderId);
  return result._tag === "Success" ? result.value : null;
});

/**
 * Confirms an order and updates associated gifts (orchestration + error handling) - Updated for publicId
 */
const confirmOrderInternalAction = async (
  orderId: string,
  approverPublicId: string
): Promise<Record<string, unknown> | false> => {
  try {
    console.log(LOG_MESSAGES.USING_PUBLIC_ID);
    logOrderConfirmation(orderId, approverPublicId);

    const result = await confirmOrderInternal(orderId, approverPublicId);

    if (result._tag === "Failure") {
      logOrderError(result.error);
      return false;
    }

    // TODO: For now, return a placeholder since confirmation is not fully implemented
    return { orderId, status: "confirmed", approverPublicId };
  } catch (error) {
    logOrderError(LOG_MESSAGES.CONFIRM_ORDER_ERROR);
    return false;
  }
};

export const confirmOrder = withDatabase(confirmOrderInternalAction);
