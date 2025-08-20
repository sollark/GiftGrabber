/**
 * Order Service - Unified Implementation
 *
 * This service provides business logic for order operations using the PublicId Strategy
 * for external interfaces while maintaining internal ObjectId operations for performance.
 * Combines functionality from both legacy and refactored implementations.
 */

import { Result, success, failure } from "@/utils/fp";
import { Order } from "@/database/models/order.model";
import { Person } from "@/database/models/person.model";
import OrderModel from "@/database/models/order.model";
import PersonModel from "@/database/models/person.model";
import GiftModel from "@/database/models/gift.model";
import {
  OrderCreationData,
  OrderCreationPublicData,
  isMongooseDocument,
} from "@/types/common.types";
import {
  OrderService as DatabaseOrderService,
  PersonService,
} from "./databaseService";
import { Types } from "mongoose";
import { saveObject } from "@/lib/castToDocument";

/**
 * Configuration constants for order operations
 */
const ORDER_CONFIG = {
  POPULATE_FIELDS: {
    APPLICANT: {
      path: "applicant",
      select: "publicId firstName lastName",
    },
    GIFTS: {
      path: "gifts",
      select: "publicId owner",
      populate: {
        path: "owner",
        select: "publicId firstName lastName",
      },
    },
    CONFIRMED_BY: {
      path: "confirmedByApprover",
      select: "publicId firstName lastName",
    },
  },
  LEGACY_POPULATE_FIELDS: {
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

// ============================================================================
// SHARED UTILITIES
// ============================================================================

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
 * Serializes order object for safe JSON transmission.
 * @param order - The Order object to serialize.
 * @returns A plain object representation of the order.
 */
export const serializeOrder = (order: Order): Record<string, unknown> => {
  return serializeDocument(order);
};

/**
 * Validates that an order exists.
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
 * @param order - The Order object or null.
 * @returns Result indicating success or failure.
 */
export const validateOrderForConfirmation = (
  order: Order | null
): Result<Order, string> => {
  if (!order) return failure("Order not found");
  if (order.confirmedByApprover) return failure("Order already confirmed");
  return success(order);
};

// ============================================================================
// PUBLICID STRATEGY (PREFERRED) - External API
// ============================================================================

/**
 * Creates order data object from parameters using publicIds.
 * @param applicantPublicId - PublicId of the applicant.
 * @param giftPublicIds - Array of gift publicIds.
 * @param orderId - Unique order identifier.
 * @param confirmationRQCode - QR code for confirmation.
 * @returns OrderCreationPublicData object.
 */
export const createOrderData = (
  applicantPublicId: string,
  giftPublicIds: string[],
  orderId: string,
  confirmationRQCode: string
): OrderCreationPublicData => ({
  applicantPublicId,
  giftPublicIds,
  orderId,
  confirmationRQCode,
});

/**
 * Creates a new order using publicIds (PREFERRED METHOD).
 * @param orderData - Order creation data with publicIds.
 * @returns Promise<Result<Order, string>> - Result with created order or error.
 */
export const createOrderInternal = async (
  orderData: OrderCreationPublicData
): Promise<Result<Order, string>> => {
  try {
    const result = await DatabaseOrderService.create({
      applicantPublicId: orderData.applicantPublicId,
      giftPublicIds: orderData.giftPublicIds,
      orderId: orderData.orderId,
      confirmationRQCode: orderData.confirmationRQCode,
    });

    if (result._tag === "Failure") {
      return failure(`Order creation failed: ${result.error.message}`);
    }

    return success(result.value);
  } catch (error) {
    return failure(`Unexpected error creating order: ${error}`);
  }
};

/**
 * Finds an order by its publicId (PREFERRED METHOD).
 * @param publicId - The order's publicId.
 * @returns Promise<Result<Order | null, string>> - Result with order or null if not found.
 */
export const findOrderByPublicId = async (
  publicId: string
): Promise<Result<Order | null, string>> => {
  try {
    const result = await DatabaseOrderService.findByPublicId(publicId);

    if (result._tag === "Failure") {
      return failure(`Error finding order: ${result.error.message}`);
    }

    return success(result.value);
  } catch (error) {
    return failure(`Unexpected error finding order: ${error}`);
  }
};

/**
 * Confirms an order by setting the confirming approver using publicIds.
 * @param orderPublicId - The order's publicId.
 * @param approverPublicId - The approver's publicId.
 * @returns Promise<Result<Order, string>> - Result with confirmed order or error.
 */
export const confirmOrderInternal = async (
  orderPublicId: string,
  approverPublicId: string
): Promise<Result<Order, string>> => {
  try {
    // Find the order
    const orderResult = await findOrderByPublicId(orderPublicId);
    if (orderResult._tag === "Failure") {
      return failure(orderResult.error);
    }

    const order = orderResult.value;
    if (!order) {
      return failure("Order not found");
    }

    // Validate order can be confirmed
    const validationResult = validateOrderForConfirmation(order);
    if (validationResult._tag === "Failure") {
      return failure(validationResult.error);
    }

    // Find the approver
    const approver = await findPersonByPublicId(approverPublicId);
    if (!approver) {
      return failure("Approver not found");
    }

    // TODO: Implement DatabaseOrderService.confirm method
    // This would update the order with confirmedByApprover and confirmedAt

    return failure("Order confirmation not yet implemented in DatabaseService");
  } catch (error) {
    return failure(`Unexpected error confirming order: ${error}`);
  }
};

/**
 * Gets all orders (for administrative purposes).
 * @returns Promise<Result<Order[], string>> - Result with array of orders.
 */
export const getAllOrdersInternal = async (): Promise<
  Result<Order[], string>
> => {
  try {
    // TODO: Implement DatabaseOrderService.findAll method
    return failure("Get all orders not yet implemented in DatabaseService");
  } catch (error) {
    return failure(`Error retrieving orders: ${error}`);
  }
};

// ============================================================================
// LEGACY OBJECTID SUPPORT - Internal/Migration Support
// ============================================================================

/**
 * Creates order data object from parameters using ObjectIds (LEGACY).
 * @param applicant - The applicant Person object with _id.
 * @param gifts - Array of Gift objects with _id.
 * @param orderId - The order ID string.
 * @param confirmationRQCode - The confirmation QR code string.
 * @returns OrderCreationData object.
 */
export const createLegacyOrderData = (
  applicant: any,
  gifts: any[],
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
 * Creates a new order in the database using ObjectIds (LEGACY).
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
 * @param usePublicId - Whether to use publicId fields (default: true).
 * @returns Promise<Order | null> - Order with populated fields.
 */
export const populateOrder = async (
  query: any,
  usePublicId: boolean = true
): Promise<Order | null> => {
  const fields = usePublicId
    ? ORDER_CONFIG.POPULATE_FIELDS
    : ORDER_CONFIG.LEGACY_POPULATE_FIELDS;

  return query
    .populate(fields.APPLICANT)
    .populate(fields.GIFTS)
    .populate(fields.CONFIRMED_BY);
};

/**
 * Finds an order with populated fields.
 * @param orderId - The unique identifier for the order.
 * @param usePublicId - Whether to use publicId fields (default: true).
 * @returns Promise<Order | null> - Order with populated fields or null.
 */
export const findOrderWithPopulation = async (
  orderId: string,
  usePublicId: boolean = true
): Promise<Order | null> => {
  return await populateOrder(OrderModel.findOne({ orderId }), usePublicId);
};

/**
 * Finds an unconfirmed order.
 * @param orderId - The unique identifier for the order.
 * @param usePublicId - Whether to use publicId fields (default: true).
 * @returns Promise<Order | null> - Unconfirmed order or null.
 */
export const findUnconfirmedOrder = async (
  orderId: string,
  usePublicId: boolean = true
): Promise<Order | null> => {
  return await populateOrder(
    OrderModel.findOne({
      orderId,
      confirmedByApprover: null,
    }),
    usePublicId
  );
};

/**
 * Finds a person by their publicId.
 * @param publicId - The person's publicId.
 * @returns Promise<Person | null> - Person if found, null otherwise.
 */
export const findPersonByPublicId = async (
  publicId: string
): Promise<Person | null> => {
  const result = await PersonService.findByPublicId(publicId);
  return result._tag === "Success" ? result.value : null;
};

/**
 * Finds a person by ID (LEGACY).
 * @param personId - The person's ObjectId.
 * @returns Promise<any | null> - Person document or null.
 */
export const findPersonById = async (
  personId: Types.ObjectId
): Promise<any | null> => {
  return await PersonModel.findById(personId);
};

/**
 * Processes order confirmation by updating order fields (LEGACY).
 * @param order - The order to confirm.
 * @param confirmedBy - The person confirming the order.
 * @returns Promise<Order> - The confirmed order.
 */
export const processOrderConfirmation = async (
  order: Order,
  confirmedBy: Types.ObjectId
): Promise<Order> => {
  const person = await findPersonById(confirmedBy);
  if (!person) {
    throw new Error("Person not found for confirmation");
  }

  const updatedOrder: Order = {
    ...order,
    confirmedByApprover: person._id,
    confirmedAt: new Date(),
    status: "COMPLETE" as any,
  };

  const savedOrder = await saveObject(updatedOrder, OrderModel);
  return savedOrder;
};

/**
 * Updates gifts associated with the confirmed order (LEGACY).
 * @param order - The confirmed order.
 * @returns Promise<void>
 */
export const updateAssociatedGifts = async (order: Order): Promise<void> => {
  const { applicant } = order;
  const giftUpdates = (order.gifts as any[]).map(async (gift: any) => {
    const giftToUpdate = await GiftModel.findById(gift._id);
    if (giftToUpdate) {
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
 * Validates if order creation was successful (LEGACY).
 * @param order - The created Order object.
 * @returns Result indicating success or failure.
 */
export const validateOrderCreation = (
  order: Order
): Result<boolean, string> => {
  return order ? success(true) : failure("Order creation failed");
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Export block for all service functions and helpers.
 * Organized by preference: PublicId methods first, legacy methods second.
 */
export default {
  // Shared utilities
  serializeDocument,
  serializeOrder,
  validateOrderExists,
  validateOrderForConfirmation,

  // PublicId Strategy (PREFERRED)
  createOrderData,
  createOrderInternal,
  findOrderByPublicId,
  confirmOrderInternal,
  getAllOrdersInternal,
  findPersonByPublicId,

  // Legacy ObjectId Support
  createLegacyOrderData,
  createOrder,
  populateOrder,
  findOrderWithPopulation,
  findUnconfirmedOrder,
  findPersonById,
  processOrderConfirmation,
  updateAssociatedGifts,
  validateOrderCreation,
};
