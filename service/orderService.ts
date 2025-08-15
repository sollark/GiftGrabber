import { Order } from "@/database/models/order.model";
import { Person } from "@/database/models/person.model";
import { Gift } from "@/database/models/gift.model";
import { Result, success, failure } from "@/utils/fp";
import { OrderCreationData, isMongooseDocument } from "@/types/common.types";

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
 * Pure function, fully typed.
 * @param approverList - Array of approver Person objects.
 * @param applicant - The applicant Person object.
 * @param gifts - Array of Gift objects.
 * @param orderId - The order ID string.
 * @param confirmationRQCode - The confirmation QR code string.
 * @returns OrderCreationData object.
 */
export const createOrderData = (
  approverList: Person[],
  applicant: Person,
  gifts: Gift[],
  orderId: string,
  confirmationRQCode: string
): OrderCreationData => ({
  createdAt: new Date(),
  approverList: approverList.map((approver: Person) => approver._id),
  applicant: applicant._id,
  gifts: gifts.map((gift: Gift) => gift._id),
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
};
