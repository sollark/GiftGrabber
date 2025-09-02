"use server";
import logger from "@/lib/logger";
import { Order } from "@/database/models/order.model";
import { withDatabase } from "@/lib/withDatabase";
import {
  createOrderInternal,
  findOrderByPublicId,
  confirmOrderInternal,
} from "@/service/orderService";
import { serializeForClient } from "@/service/databaseService";
import { OrderCreationPublicData } from "@/types/common.types";
import { failure, Result, success, fromPromise } from "@/utils/fp";

/**
 * Log messages for order operations - Updated for PublicId Strategy
 */
const LOG_MESSAGES = {
  MAKE_ORDER_ERROR: "Error in makeOrder",
  GET_ORDER_START: "Getting an order using publicId...",
  GET_ORDER_ERROR: "Error in getOrder",
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
 * Creates a new order in the database using publicIds (orchestration + error handling)
 * @returns The created order's publicId for further operations, or undefined on failure
 */
const makeOrderInternal = async (
  applicantPublicId: string,
  giftPublicIds: string[],
  orderId: string,
  confirmationRQCode: string
): Promise<string | undefined> => {
  // Changed return type to return publicId
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
    return newOrder.publicId; // Return the publicId instead of boolean
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
): Promise<string | undefined> => {
  // Changed return type to return publicId
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
/**
 * Fetches an order with populated data and serializes it - Fixed for publicId consistency
 * @param orderPublicId - The public identifier for the order
 * @returns Result<Record<string, unknown>, Error> - Success with serialized order or Failure with Error
 */
export const getOrderInternal = async (
  orderPublicId: string
): Promise<Result<Record<string, unknown>, Error>> => {
  logger.info("[FETCH] getOrderInternal", {
    orderPublicId,
    timestamp: Date.now(),
  });
  try {
    console.log(LOG_MESSAGES.USING_PUBLIC_ID);
    const orderResult = await findOrderByPublicId(orderPublicId);

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

    logger.info("[FETCH:RESULT] getOrderInternal", {
      orderPublicId,
      order: orderResult.value
        ? {
            publicId: orderResult.value.publicId,
            status: orderResult.value.status,
          }
        : null,
      timestamp: Date.now(),
    });
    return success(serializeForClient(orderResult.value));
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logOrderError(err.message);
    return failure(err);
  }
};

export const getOrder = withDatabase(
  async (orderPublicId: string): Promise<any> => {
    // Fixed parameter name
    const result = await getOrderInternal(orderPublicId);
    return result._tag === "Success" ? result.value : null;
  }
);

/**
 * Confirms an order and updates associated gifts (orchestration + error handling) - Fixed for publicId consistency
 */
const confirmOrderInternalAction = async (
  orderPublicId: string // Changed from orderId to orderPublicId
): Promise<Record<string, unknown> | false> => {
  try {
    console.log(LOG_MESSAGES.USING_PUBLIC_ID);

    const result = await confirmOrderInternal(orderPublicId); // Now passes correct publicId

    if (result._tag === "Failure") {
      logOrderError(result.error);
      return false;
    }

    // Return the confirmed order with publicId (not business orderId)
    const confirmedOrder = result.value;
    return {
      publicId: confirmedOrder.publicId,
      status: "COMPLETED",
    };
  } catch (error) {
    logOrderError(LOG_MESSAGES.CONFIRM_ORDER_ERROR);
    return false;
  }
};

export const confirmOrder = withDatabase(confirmOrderInternalAction);
