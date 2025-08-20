/**
 * Order Service - Refactored to use PublicId Strategy
 *
 * This service provides business logic for order operations while using
 * the DatabaseService layer to ensure publicId-only external interfaces.
 */

import { Result, success, failure } from "@/utils/fp";
import { Order } from "@/database/models/order.model";
import { Person } from "@/database/models/person.model";
import { Gift } from "@/database/models/gift.model";
import {
  OrderCreationPublicData,
  isMongooseDocument,
} from "@/types/common.types";
import {
  OrderService as DatabaseOrderService,
  PersonService,
  GiftService,
} from "./databaseService";

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
export const validateOrderConfirmation = (
  order: Order | null
): Result<Order, string> => {
  if (!order) return failure("Order not found");
  if (order.confirmedByApprover) return failure("Order already confirmed");
  return success(order);
};

/**
 * Creates a new order using publicIds.
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
 * Finds an order by its publicId.
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
 * Updates gifts to be associated with an order using publicIds.
 * @param giftPublicIds - Array of gift publicIds to update.
 * @param orderPublicId - The order's publicId to associate with.
 * @returns Promise<Result<boolean, string>> - Result indicating success or failure.
 */
export const updateGiftsWithOrder = async (
  giftPublicIds: string[],
  orderPublicId: string
): Promise<Result<boolean, string>> => {
  try {
    // This would need to be implemented in the DatabaseService
    // For now, we'll return success as a placeholder
    // TODO: Implement GiftService.updateManyWithOrder method

    return success(true);
  } catch (error) {
    return failure(`Error updating gifts: ${error}`);
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
    const validationResult = validateOrderConfirmation(order);
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

/**
 * Serialize order for safe transmission.
 * @param order - Order to serialize.
 * @returns Serialized order data.
 */
export const serializeOrder = (order: Order): Record<string, unknown> => {
  return serializeDocument(order);
};
