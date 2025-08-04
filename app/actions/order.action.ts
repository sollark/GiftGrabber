"use server";

import { OrderStatus } from "@/components/types/OrderStatus";
import GiftModel, { Gift } from "@/database/models/gift.model";
import OrderModel, { Order } from "@/database/models/order.model";
import { Person } from "@/database/models/person.model";
import {
  withDatabase,
  withDatabaseBoolean,
  withDatabaseNullable,
} from "@/lib/withDatabase";
import { handleError } from "@/utils/utils";
import { Types } from "mongoose";

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
 * Interface for order creation parameters
 */
interface OrderCreationData {
  createdAt: Date;
  approverList: Types.ObjectId[];
  applicant: Types.ObjectId;
  gifts: Types.ObjectId[];
  orderId: string;
  confirmationRQCode: string;
}

/**
 * Creates a new order in the database
 * @param approverList - List of people who can approve the order
 * @param applicant - Person requesting the gifts
 * @param gifts - List of gifts being requested
 * @param orderId - Unique identifier for the order
 * @param confirmationRQCode - QR code for order confirmation
 * @returns Promise<boolean | undefined> - True if order created successfully
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
    return validateOrderCreation(newOrder);
  } catch (error) {
    logOrderError(LOG_MESSAGES.MAKE_ORDER_ERROR);
    handleError(error);
  }
};

export const makeOrder = withDatabaseBoolean(makeOrderInternal);

/**
 * Retrieves an order by its ID with populated fields
 * @param orderId - Unique identifier for the order
 * @returns Promise<Order | null> - The order with populated fields or null if not found
 */
const getOrderInternal = async (orderId: string): Promise<Order | null> => {
  try {
    logOrderRetrieval();

    const order = await findOrderWithPopulation(orderId);
    validateOrderExists(order);

    return serializeOrder(order!);
  } catch (error) {
    logOrderError(LOG_MESSAGES.GET_ORDER_ERROR);
    handleError(error);
  }
  return null;
};

export const getOrder = withDatabaseNullable(getOrderInternal);

/**
 * Confirms an order and updates associated gifts
 * @param orderId - Unique identifier for the order
 * @param confirmedBy - ID of the person confirming the order
 * @returns Promise<Order | false> - Confirmed order or false if failed
 */
const confirmOrderInternal = async (
  orderId: string,
  confirmedBy: Types.ObjectId
): Promise<any | false> => {
  try {
    logOrderConfirmation(orderId, confirmedBy);

    const order = await findUnconfirmedOrder(orderId);
    validateOrderForConfirmation(order);

    const confirmedOrder = await processOrderConfirmation(order!, confirmedBy);
    await updateAssociatedGifts(confirmedOrder);

    return serializeOrder(confirmedOrder);
  } catch (error) {
    logOrderError(LOG_MESSAGES.CONFIRM_ORDER_ERROR);
    handleError(error);
  }
  return false;
};

export const confirmOrder = withDatabase(confirmOrderInternal);

/**
 * Creates order data object from parameters
 * @param approverList - List of approvers
 * @param applicant - Applicant person
 * @param gifts - List of gifts
 * @param orderId - Order ID
 * @param confirmationRQCode - Confirmation QR code
 * @returns OrderCreationData - Formatted order data
 */
const createOrderData = (
  approverList: Person[],
  applicant: Person,
  gifts: Gift[],
  orderId: string,
  confirmationRQCode: string
): OrderCreationData => ({
  createdAt: new Date(),
  approverList: approverList.map((approver) => approver._id),
  applicant: applicant._id,
  gifts: gifts.map((gift) => gift._id),
  orderId,
  confirmationRQCode,
});

/**
 * Creates a new order in the database
 * @param orderData - Order creation data
 * @returns Promise<Order> - Created order
 */
const createNewOrder = async (orderData: OrderCreationData): Promise<Order> => {
  return await OrderModel.create(orderData);
};

/**
 * Logs order creation success
 * @param order - Created order
 */
const logOrderCreation = (order: Order): void => {
  console.log(LOG_MESSAGES.NEW_ORDER_CREATED(order));
};

/**
 * Validates if order creation was successful
 * @param order - Created order
 * @returns boolean - True if order exists
 */
const validateOrderCreation = (order: Order): boolean => {
  return order ? true : false;
};

/**
 * Logs order-related errors
 * @param message - Error message
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
 * Finds an order with populated fields
 * @param orderId - Order ID to find
 * @returns Promise<Order | null> - Found order or null
 */
const findOrderWithPopulation = async (
  orderId: string
): Promise<Order | null> => {
  return await populateOrder(OrderModel.findOne({ orderId }));
};

/**
 * Validates that an order exists
 * @param order - Order to validate
 * @throws Error if order doesn't exist
 */
const validateOrderExists = (order: Order | null): void => {
  if (!order) throw new Error(ERROR_MESSAGES.ORDER_NOT_FOUND);
};

/**
 * Serializes order object for safe JSON transmission
 * @param order - Order to serialize
 * @returns any - Serialized order
 */
const serializeOrder = (order: any): any => {
  return JSON.parse(JSON.stringify(order));
};

/**
 * Logs order confirmation start
 * @param orderId - Order ID
 * @param confirmedBy - ID of confirming person
 */
const logOrderConfirmation = (
  orderId: string,
  confirmedBy: Types.ObjectId
): void => {
  console.log(LOG_MESSAGES.CONFIRM_ORDER_START(orderId, confirmedBy));
};

/**
 * Finds an unconfirmed order
 * @param orderId - Order ID to find
 * @returns Promise<any | null> - Found order or null
 */
const findUnconfirmedOrder = async (orderId: string): Promise<any | null> => {
  return await populateOrder(
    OrderModel.findOne({
      orderId,
      confirmedBy: null,
    })
  );
};

/**
 * Validates order for confirmation
 * @param order - Order to validate
 * @throws Error if order cannot be confirmed
 */
const validateOrderForConfirmation = (order: any | null): void => {
  if (!order) throw new Error(ERROR_MESSAGES.ORDER_NOT_FOUND_OR_CONFIRMED);
};

/**
 * Processes order confirmation by updating order fields
 * @param order - Order to confirm
 * @param confirmedBy - ID of confirming person
 * @returns Promise<any> - Confirmed order
 */
const processOrderConfirmation = async (
  order: any,
  confirmedBy: Types.ObjectId
): Promise<any> => {
  order.confirmedBy = confirmedBy;
  order.confirmedAt = new Date();
  order.status = OrderStatus.COMPLETE;
  await order.save();
  return order;
};

/**
 * Updates gifts associated with the confirmed order
 * @param order - Confirmed order
 * @returns Promise<void>
 */
const updateAssociatedGifts = async (order: any): Promise<void> => {
  const { applicant } = order;
  const giftUpdates = order.gifts.map(async (gift: Gift) => {
    const giftToUpdate = await GiftModel.findById(gift._id);
    giftToUpdate.receiver = applicant._id;
    giftToUpdate.order = order._id;
    await giftToUpdate.save();
    return giftToUpdate;
  });

  await Promise.all(giftUpdates);
};

/**
 * Populates order fields with related data
 * @param query - Mongoose query to populate
 * @returns Promise<Order | null> - Order with populated fields
 */
const populateOrder = async (query: any): Promise<Order | null> => {
  return query
    .populate(ORDER_CONFIG.POPULATE_FIELDS.APPLICANT)
    .populate(ORDER_CONFIG.POPULATE_FIELDS.GIFTS)
    .populate(ORDER_CONFIG.POPULATE_FIELDS.CONFIRMED_BY);
};
