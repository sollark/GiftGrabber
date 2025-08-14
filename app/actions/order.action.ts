"use server";

import { OrderStatus } from "@/components/order/OrderStatus";
import GiftModel, { Gift } from "@/database/models/gift.model";
import OrderModel, { Order } from "@/database/models/order.model";
import PersonModel, { Person } from "@/database/models/person.model";
import {
  withDatabase,
  withDatabaseBoolean,
  withDatabaseNullable,
} from "@/lib/withDatabase";
import { Types } from "mongoose";
import {
  createOrderData,
  validateOrderCreation,
  validateOrderExists,
  validateOrderForConfirmation,
  serializeOrder,
  OrderCreationData,
} from "@/service/orderService";
import { saveObject } from "@/lib/castToDocument";
import { failure, handleError, Result, success } from "@/lib/fp-utils";

/**
 * Configuration constants for order operations
 */
const ORDER_CONFIG = {
  POPULATE_FIELDS: {
    APPLICANT: {
      path: "applicant",
      select: "firstName lastName",
    },
    GIFTS: {
      path: "gifts",
      select: "owner",
      populate: {
        path: "owner",
        select: "firstName lastName",
      },
    },
    CONFIRMED_BY: {
      path: "confirmedBy",
      select: "firstName lastName",
    },
  },
} as const;

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
 * Creates a new order in the database
 */
const createNewOrder = async (orderData: OrderCreationData): Promise<Order> => {
  return await OrderModel.create(orderData);
};

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
 * Finds an order with populated fields
 */
const findOrderWithPopulation = async (
  orderId: string
): Promise<Order | null> => {
  return await populateOrder(OrderModel.findOne({ orderId }));
};

/**
 * Populates order fields with related data
 */
const populateOrder = async (query: any): Promise<Order | null> => {
  return query
    .populate(ORDER_CONFIG.POPULATE_FIELDS.APPLICANT)
    .populate(ORDER_CONFIG.POPULATE_FIELDS.GIFTS)
    .populate(ORDER_CONFIG.POPULATE_FIELDS.CONFIRMED_BY);
};

/**
 * Finds an unconfirmed order
 */
const findUnconfirmedOrder = async (orderId: string): Promise<Order | null> => {
  return await populateOrder(
    OrderModel.findOne({
      orderId,
      confirmedBy: null,
    })
  );
};

/**
 * Processes order confirmation by updating order fields
 */
const processOrderConfirmation = async (
  order: Order,
  confirmedBy: Types.ObjectId
): Promise<Order> => {
  // Fetch the Person document from the database
  const person = await PersonModel.findById(confirmedBy);
  if (!person) {
    throw new Error("Person not found for confirmation");
  }
  // Work with object, not document
  const updatedOrder: Order = {
    ...order,
    confirmedBy: person._id,
    confirmedAt: new Date(),
    status: OrderStatus.COMPLETE,
  };
  // Save as document using functional utility
  const savedOrder = await saveObject(updatedOrder, OrderModel);
  return savedOrder;
};

/**
 * Updates gifts associated with the confirmed order
 */
const updateAssociatedGifts = async (order: Order): Promise<void> => {
  const { applicant } = order;
  const giftUpdates = order.gifts.map(async (gift: Gift) => {
    const giftToUpdate = await GiftModel.findById(gift._id);
    if (giftToUpdate) {
      // Work with object, not document
      const updatedGift: Gift = {
        ...giftToUpdate.toObject(),
        receiver: applicant._id,
        order: order._id,
      };
      await saveObject(updatedGift, GiftModel);
      return updatedGift;
    }
    return null;
  });

  await Promise.all(giftUpdates);
};

/**
 * Creates a new order in the database (orchestration + error handling)
 */
const makeOrderInternal = async (
  approverList: Person[],
  applicant: Person,
  gifts: Gift[],
  orderId: string,
  confirmationRQCode: string
): Promise<boolean | undefined> => {
  try {
    const orderData = createOrderData(
      approverList,
      applicant,
      gifts,
      orderId,
      confirmationRQCode
    );
    const newOrder = await createNewOrder(orderData);

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

export const makeOrder = withDatabaseBoolean(makeOrderInternal);

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
  try {
    const order = await findOrderWithPopulation(orderId);
    const validationResult = validateOrderExists(order);

    if (validationResult._tag === "Failure") {
      const err = new Error(validationResult.error);
      logOrderError(err.message);
      return failure(err);
    }

    return success(serializeOrder(validationResult.value));
  } catch (error) {
    logOrderError(LOG_MESSAGES.GET_ORDER_ERROR);
    return handleError(error as Error);
  }
};

export const getOrder = withDatabaseNullable(getOrderInternal);

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
