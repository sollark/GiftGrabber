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
import { failure, Result, success } from "@/utils/fp";

/**
 * Log messages for order operations
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
} as const;

/**
 * Logs order creation success using logger
 */
const logOrderCreation = (order: Order): void => {
  logger.info(LOG_MESSAGES.NEW_ORDER_CREATED(order), {
    publicId: order.publicId,
    timestamp: Date.now(),
  });
};

/**
 * Logs order-related errors using logger
 */
const logOrderError = (message: string, error?: unknown): void => {
  logger.error(message, {
    error,
    timestamp: Date.now(),
  });
};

/**
 * Logs order retrieval start using logger
 */
const logOrderRetrieval = (): void => {
  logger.info(LOG_MESSAGES.GET_ORDER_START, {
    timestamp: Date.now(),
  });
};

/**
 * Creates a new order in the database using publicIds (orchestration + error handling)
 * @returns Result<string, Error> - Success with publicId or Failure with Error
 */
const makeOrderInternal = async (
  applicantPublicId: string,
  giftPublicIds: string[],
  orderId: string,
  confirmationRQCode: string
): Promise<Result<string, Error>> => {
  try {
    logger.info(LOG_MESSAGES.USING_PUBLIC_ID, { timestamp: Date.now() });

    const orderData: OrderCreationPublicData = {
      applicantPublicId,
      giftPublicIds,
      orderId,
      confirmationRQCode,
    };

    const result = await createOrderInternal(orderData);

    if (result._tag === "Failure") {
      logOrderError(LOG_MESSAGES.MAKE_ORDER_ERROR, result.error);
      return failure(new Error(result.error));
    }

    const newOrder = result.value;
    logOrderCreation(newOrder);
    return success(newOrder.publicId);
  } catch (error) {
    logOrderError(LOG_MESSAGES.MAKE_ORDER_ERROR, error);
    const err = error instanceof Error ? error : new Error(String(error));
    return failure(err);
  }
};

export const makeOrder = async (
  applicantPublicId: string,
  giftPublicIds: string[],
  orderId: string,
  confirmationRQCode: string
): Promise<Result<string, Error>> => {
  return makeOrderInternal(
    applicantPublicId,
    giftPublicIds,
    orderId,
    confirmationRQCode
  );
};

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
    logger.info(LOG_MESSAGES.USING_PUBLIC_ID, { timestamp: Date.now() });
    const orderResult = await findOrderByPublicId(orderPublicId);

    if (orderResult._tag === "Failure") {
      const err = new Error(orderResult.error);
      logOrderError(LOG_MESSAGES.GET_ORDER_ERROR, orderResult.error);
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
    logOrderError(err.message, error);
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
  orderPublicId: string
): Promise<Result<Record<string, unknown>, Error>> => {
  try {
    logger.info(LOG_MESSAGES.USING_PUBLIC_ID, { timestamp: Date.now() });

    const result = await confirmOrderInternal(orderPublicId);

    if (result._tag === "Failure") {
      logOrderError(LOG_MESSAGES.CONFIRM_ORDER_ERROR, result.error);
      return failure(new Error(result.error));
    }

    // Return the confirmed order with publicId (not business orderId)
    const confirmedOrder = result.value;
    return success({
      publicId: confirmedOrder.publicId,
      status: "COMPLETED",
    });
  } catch (error) {
    logOrderError(LOG_MESSAGES.CONFIRM_ORDER_ERROR, error);
    const err = error instanceof Error ? error : new Error(String(error));
    return failure(err);
  }
};

export const confirmOrder = withDatabase(async (orderPublicId: string) => {
  return confirmOrderInternalAction(orderPublicId);
});
