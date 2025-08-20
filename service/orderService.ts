import { Order } from "@/database/models/order.model";
import { Person } from "@/database/models/person.model";
import { Gift } from "@/database/models/gift.model";
import OrderModel from "@/database/models/order.model";
import PersonModel from "@/database/models/person.model";
import GiftModel from "@/database/models/gift.model";
import { Result, success, failure } from "@/utils/fp";
import { OrderCreationData, isMongooseDocument } from "@/types/common.types";
import { Types } from "mongoose";
import { saveObject } from "@/lib/castToDocument";

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
      path: "confirmedByApprover",
      select: "firstName lastName",
    },
  },
} as const;

/**
 * Pure helper to serialize any Mongoose document or plain object.
 * Returns a plain object suitable for transmission or testing.
 * @param doc - The document or object to serialize.
 * @returns A plain object representation.
 */
export const serializeDocument = <T>(doc: T): Record<string, unknown> => {
  if (isMongooseDocument(doc)) {
    return (doc as any).toObject();
  }
  return JSON.parse(JSON.stringify(doc));
};

/**
 * Creates order data object from parameters.
 * Pure function, fully typed, aligned with Order model schema.
 * Note: approvers are stored at Event level, not Order level.
 * @param applicant - The applicant Person object with _id.
 * @param gifts - Array of Gift objects with _id.
 * @param orderId - The order ID string.
 * @param confirmationRQCode - The confirmation QR code string.
 * @returns OrderCreationData object.
 */
export const createOrderData = (
  applicant: any, // Using any for now to handle both Person and PersonDoc
  gifts: any[], // Using any for now to handle both Gift and GiftDoc
  orderId: string,
  confirmationRQCode: string
): OrderCreationData => ({
  createdAt: new Date(),
  approverList: [],
  applicant: applicant._id,
  gifts: gifts.map((gift: any) => gift._id),
  orderId,
  confirmationRQCode,
});

/**
 * Validates if order creation was successful.
 * Returns Result<boolean, string>.
 * @param order - The created Order object.
 * @returns Result indicating success or failure.
 */
export const validateOrderCreation = (
  order: Order
): Result<boolean, string> => {
  return order ? success(true) : failure("Order creation failed");
};

/**
 * Validates that an order exists.
 * Returns Result<Order, string>.
 * @param order - The Order object or null.
 * @returns Result indicating success or failure.
 */
export const validateOrderExists = (
  order: Order | null
): Result<Order, string> => {
  return order ? success(order) : failure("Order not found");
};

/**
 * Validates order for confirmation.
 * Returns Result<Order, string>.
 * @param order - The Order object or null.
 * @returns Result indicating success or failure.
 */
export const validateOrderForConfirmation = (
  order: Order | null
): Result<Order, string> => {
  return order
    ? success(order)
    : failure("Order not found or already confirmed");
};

/**
 * Serializes order object for safe JSON transmission.
 * Uses generic helper for type safety and testability.
 * @param order - The Order object to serialize.
 * @returns A plain object representation of the order.
 */
export const serializeOrder = (order: Order): Record<string, unknown> => {
  return serializeDocument(order);
};

// Database Operations - Service Layer Functions

/**
 * Creates a new order in the database.
 * @param orderData - The order creation data.
 * @returns Promise<Order> - The created order.
 */
export const createOrder = async (
  orderData: OrderCreationData
): Promise<Order> => {
  return await OrderModel.create(orderData);
};

/**
 * Populates order fields with related data.
 * @param query - Mongoose query for Order.
 * @returns Promise<Order | null> - Order with populated fields.
 */
export const populateOrder = async (query: any): Promise<Order | null> => {
  return query
    .populate(ORDER_CONFIG.POPULATE_FIELDS.APPLICANT)
    .populate(ORDER_CONFIG.POPULATE_FIELDS.GIFTS)
    .populate(ORDER_CONFIG.POPULATE_FIELDS.CONFIRMED_BY);
};

/**
 * Finds an order with populated fields.
 * @param orderId - The unique identifier for the order.
 * @returns Promise<Order | null> - Order with populated fields or null.
 */
export const findOrderWithPopulation = async (
  orderId: string
): Promise<Order | null> => {
  return await populateOrder(OrderModel.findOne({ orderId }));
};

/**
 * Finds an unconfirmed order.
 * @param orderId - The unique identifier for the order.
 * @returns Promise<Order | null> - Unconfirmed order or null.
 */
export const findUnconfirmedOrder = async (
  orderId: string
): Promise<Order | null> => {
  return await populateOrder(
    OrderModel.findOne({
      orderId,
      confirmedByApprover: null,
    })
  );
};

/**
 * Finds a person by ID.
 * @param personId - The person's ObjectId.
 * @returns Promise<any | null> - Person document or null.
 */
export const findPersonById = async (
  personId: Types.ObjectId
): Promise<any | null> => {
  return await PersonModel.findById(personId);
};

/**
 * Processes order confirmation by updating order fields.
 * @param order - The order to confirm.
 * @param confirmedBy - The person confirming the order.
 * @returns Promise<Order> - The confirmed order.
 */
export const processOrderConfirmation = async (
  order: Order,
  confirmedBy: Types.ObjectId
): Promise<Order> => {
  // Fetch the Person document from the database
  const person = await findPersonById(confirmedBy);
  if (!person) {
    throw new Error("Person not found for confirmation");
  }
  // Work with object, not document
  const updatedOrder: Order = {
    ...order,
    confirmedByApprover: person._id,
    confirmedAt: new Date(),
    status: "COMPLETE" as any, // Using string for now
  };
  // Save as document using functional utility
  const savedOrder = await saveObject(updatedOrder, OrderModel);
  return savedOrder;
};

/**
 * Updates gifts associated with the confirmed order.
 * @param order - The confirmed order.
 * @returns Promise<void>
 */
export const updateAssociatedGifts = async (order: Order): Promise<void> => {
  const { applicant } = order;
  const giftUpdates = (order.gifts as any[]).map(async (gift: any) => {
    const giftToUpdate = await GiftModel.findById(gift._id);
    if (giftToUpdate) {
      // Work with object, not document
      const updatedGift: any = {
        ...giftToUpdate.toObject(),
        receiver: (applicant as any)._id,
        order: (order as any)._id,
      };
      await saveObject(updatedGift, GiftModel);
      return updatedGift;
    }
    return null;
  });

  await Promise.all(giftUpdates);
};

/**
 * Export block for all service functions and helpers.
 */
export default {
  isMongooseDocument,
  serializeDocument,
  createOrderData,
  validateOrderCreation,
  validateOrderExists,
  validateOrderForConfirmation,
  serializeOrder,
  createOrder,
  populateOrder,
  findOrderWithPopulation,
  findUnconfirmedOrder,
  findPersonById,
  processOrderConfirmation,
  updateAssociatedGifts,
};
