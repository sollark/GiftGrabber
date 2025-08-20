"use server";

import { OrderStatus } from "@/components/order/OrderStatus";
import { Gift } from "@/database/models/gift.model";
import { Order } from "@/database/models/order.model";
import { Person } from "@/database/models/person.model";
import { withDatabase } from "@/lib/withDatabase";
import { Types } from "mongoose";
import {
  createOrderData,
  validateOrderCreation,
  validateOrderExists,
  validateOrderForConfirmation,
  serializeOrder,
  createOrder,
  findOrderWithPopulation,
  findUnconfirmedOrder,
  processOrderConfirmation,
  updateAssociatedGifts,
} from "@/service/orderService";
import { OrderCreationData } from "@/types/common.types";
import { failure, Result, success, fromPromise } from "@/utils/fp";

/**
 * Log messages for order operations
 */
const LOG_MESSAGES = {
  MAKE_ORDER_ERROR: "Error in makeOrder",
  GET_ORDER_START: "Getting an order...",
  GET_ORDER_ERROR: "Error in getOrder",
  CONFIRM_ORDER_START: (orderId: string, confirmedBy: Types.ObjectId) =>
    `in confirmOrder: ${orderId} ${confirmedBy}`,
  CONFIRM_ORDER_ERROR: "Error in confirmOrder",
  NEW_ORDER_CREATED: (order: Order) => `newOrder created: ${order}`,
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
 * Logs order confirmation start
 */
const logOrderConfirmation = (
  orderId: string,
  confirmedBy: Types.ObjectId
): void => {
  console.log(LOG_MESSAGES.CONFIRM_ORDER_START(orderId, confirmedBy));
};

/**
 * Creates a new order in the database (orchestration + error handling)
 */
const makeOrderInternal = async (
  applicant: Person,
  gifts: Gift[],
  orderId: string,
  confirmationRQCode: string
): Promise<boolean | undefined> => {
  try {
    const orderData = createOrderData(
      applicant,
      gifts,
      orderId,
      confirmationRQCode
    );
    const newOrder = await createOrder(orderData);

    logOrderCreation(newOrder);
    const result = validateOrderCreation(newOrder);
    if (result._tag === "Failure") {
      logOrderError(result.error);
      return undefined;
    }
    return result.value;
  } catch (error) {
    logOrderError(LOG_MESSAGES.MAKE_ORDER_ERROR);
    return undefined;
  }
};

export const makeOrder = withDatabase(
  async (
    approverList: Person[],
    applicant: Person,
    gifts: Gift[],
    orderId: string,
    confirmationRQCode: string
  ): Promise<boolean> => {
    const result = await makeOrderInternal(
      applicant,
      gifts,
      orderId,
      confirmationRQCode
    );
    return result === true;
  }
);

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
 * Fetches an order with populated data and serializes it.
 * @param orderId - The unique identifier for the order
 * @returns Result<Record<string, unknown>, Error> - Success with serialized order or Failure with Error
 */
export const getOrderInternal = async (
  orderId: string
): Promise<Result<Record<string, unknown>, Error>> => {
  // Use fromPromise to wrap async DB call in Result
  const orderResult = await fromPromise<Order | null, Error>(
    findOrderWithPopulation(orderId)
  );
  if (orderResult._tag === "Failure") {
    logOrderError(LOG_MESSAGES.GET_ORDER_ERROR);
    return failure(orderResult.error);
  }
  const validationResult = validateOrderExists(orderResult.value);
  if (validationResult._tag === "Failure") {
    const err = new Error(validationResult.error);
    logOrderError(err.message);
    return failure(err);
  }
  return success(serializeOrder(validationResult.value));
};

export const getOrder = withDatabase(async (orderId: string): Promise<any> => {
  const result = await getOrderInternal(orderId);
  return result._tag === "Success" ? result.value : null;
});

/**
 * Confirms an order and updates associated gifts (orchestration + error handling)
 */
const confirmOrderInternal = async (
  orderId: string,
  confirmedBy: Types.ObjectId
): Promise<Record<string, unknown> | false> => {
  try {
    logOrderConfirmation(orderId, confirmedBy);

    const order = await findUnconfirmedOrder(orderId);
    const result = validateOrderForConfirmation(order);
    if (result._tag === "Failure") {
      logOrderError(result.error);
      return false;
    }

    const confirmedOrder = await processOrderConfirmation(
      result.value,
      confirmedBy
    );
    await updateAssociatedGifts(confirmedOrder);

    return serializeOrder(confirmedOrder);
  } catch (error) {
    logOrderError(LOG_MESSAGES.CONFIRM_ORDER_ERROR);
    return false;
  }
};

export const confirmOrder = withDatabase(confirmOrderInternal);
