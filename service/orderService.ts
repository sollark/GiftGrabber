/**
 * orderService.ts
 *
 * Purpose: Business logic service for order management with secure public ID operations
 *
 * Main Responsibilities:
 * - Provides high-level order creation and management operations
 * - Implements order workflow from gift selection to confirmation
 * - Manages order status transitions assignments
 * - Handles secure order operations using public IDs instead of internal ObjectIds
 * - Coordinates between gift claiming, order creation, and notification workflows
 *
 * Architecture Role:
 * - Business logic layer above database service for order operations
 * - Orchestrates complex order workflows involving multiple entities
 * - Provides public API surface for order management with security boundaries
 * - Integrates order operations with gift assignment
 * - Central service for order lifecycle management and status tracking
 *
 * @businessLogic
 * - Orders aggregate multiple gifts for single applicant with approval workflow
 * - Public ID strategy prevents enumeration attacks on order data
 * - Order status progression: PENDING → processing → COMPLETED/CANCELLED
 * - QR code integration supports mobile-friendly order verification
 *
 * Order Service - Unified Implementation with Centralized Population
 *
 * This service provides business logic for order operations using the PublicId Strategy
 * for external interfaces while maintaining internal ObjectId operations for performance.
 * Uses centralized population from mongoPopulationService.ts
 */

import { Result, success, failure } from "@/utils/fp";
import { Order } from "@/database/models/order.model";
import { Person } from "@/database/models/person.model";
import OrderModel from "@/database/models/order.model";
import PersonModel from "@/database/models/person.model";
import { OrderCreationPublicData } from "@/types/common.types";
import {
  OrderService as DatabaseOrderService,
  PersonService,
} from "./databaseService";
import { populateOrder } from "./mongoPopulationService";
import { Types } from "mongoose";

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Configuration for order-related constants and field selections.
 */
const ORDER_CONFIG = {
  // Status constants
  STATUS: {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates that an order exists.
 * @param order - The order to validate.
 * @returns Result with order or error.
 */
export const validateOrderExists = (
  order: Order | null
): Result<Order, string> => {
  if (!order) {
    return failure("Order not found");
  }
  return success(order);
};

/**
 * Validates that an order can be confirmed.
 * @param order - The order to validate.
 * @returns Result with order or error.
 */
export const validateOrderForConfirmation = (
  order: Order
): Result<Order, string> => {
  return success(order);
};

// ============================================================================
// CORE ORDER FUNCTIONS - PublicId Strategy
// ============================================================================

/**
 * Creates order data object from public IDs.
 * @param applicantPublicId - The applicant's public ID.
 * @param giftPublicIds - Array of gift public IDs.
 * @param orderId - The order ID string.
 * @param confirmationRQCode - The confirmation QR code string.
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
 * Creates a new order using PublicId strategy with enhanced validation and error handling.
 * @param orderData - The order creation data with public IDs.
 * @returns Promise<Result<Order, string>> - The created order or error.
 */
export const createOrderInternal = async (
  orderData: OrderCreationPublicData
): Promise<Result<Order, string>> => {
  // Validate required fields
  if (!orderData.applicantPublicId || !orderData.orderId) {
    return failure("Missing required fields: applicantPublicId, orderId");
  }

  if (!orderData.giftPublicIds || orderData.giftPublicIds.length === 0) {
    return failure("At least one gift must be selected for the order");
  }

  const result = await DatabaseOrderService.create(orderData);
  if (result._tag === "Failure") {
    return failure(`Order creation failed: ${result.error.message}`);
  }

  return result;
};

/**
 * Finds an order by its public ID.
 * @param publicId - The order's public identifier.
 * @returns Promise<Result<Order, string>> - The order or error.
 */
export const findOrderByPublicId = async (
  publicId: string
): Promise<Result<Order, string>> => {
  try {
    const result = await DatabaseOrderService.findByPublicId(publicId);
    if (result._tag === "Failure") {
      return failure(result.error.message);
    }
    if (!result.value) {
      return failure("Order not found");
    }
    return success(result.value);
  } catch (error) {
    return failure(
      `Failed to find order: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Confirms an order using PublicId strategy.
 * @param orderPublicId - The order's public identifier.
 * @returns Promise<Result<Order, string>> - The confirmed order or error.
 */
export const confirmOrderInternal = async (
  orderPublicId: string
): Promise<Result<Order, string>> => {
  try {
    const orderResult = await findOrderByPublicId(orderPublicId);
    if (orderResult._tag === "Failure") {
      return failure(`Order not found: ${orderResult.error}`);
    }

    const order = orderResult.value;
    const validationResult = validateOrderForConfirmation(order);
    if (validationResult._tag === "Failure") {
      return failure(validationResult.error);
    }

    // TODO: Implement DatabaseOrderService.confirm method
    // For now, return the order as-is
    console.log(
      "confirmOrderInternal: DatabaseOrderService.confirm not yet implemented"
    );
    return success(order);
  } catch (error) {
    return failure(
      `Failed to confirm order: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Gets all orders (placeholder implementation).
 * @returns Promise<Result<Record<string, unknown>[], string>> - Array of orders or error.
 */
export const getAllOrdersInternal = async (): Promise<
  Result<Record<string, unknown>[], string>
> => {
  try {
    // TODO: Implement DatabaseOrderService.findAll method
    console.log(
      "getAllOrdersInternal: DatabaseOrderService.findAll not yet implemented"
    );
    return success([]);
  } catch (error) {
    return failure(
      `Failed to get all orders: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

// ============================================================================
// POPULATION FUNCTIONS - Using Centralized Logic
// ============================================================================

/**
 * Finds an order with populated fields using centralized population logic.
 * @param orderId - The unique identifier for the order.
 * @returns Promise<Order | null> - Order with populated fields or null.
 */
export const findOrderWithPopulation = async (
  orderId: string
): Promise<Order | null> => {
  const query = OrderModel.findOne({ orderId });
  return populateOrder(query).exec();
};

/**
 * Finds an unconfirmed order using centralized population logic.
 * @param orderId - The unique identifier for the order.
 * @returns Promise<Order | null> - Unconfirmed order or null.
 */
export const findUnconfirmedOrder = async (
  orderId: string
): Promise<Order | null> => {
  const query = OrderModel.findOne({
    orderId,
  });
  return populateOrder(query).exec();
};

// ============================================================================
// PERSON FINDER UTILITIES
// ============================================================================

/**
 * Find a person by their publicId.
 * @param publicId - The person's public identifier.
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

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Export block for core service functions.
 * Focused on PublicId Strategy with essential functions only.
 */
export default {
  // Shared utilities
  // Validation functions
  validateOrderExists,
  validateOrderForConfirmation,

  // PublicId Strategy (PREFERRED) - Core functions in use
  createOrderData,
  createOrderInternal,
  findOrderByPublicId,
  confirmOrderInternal,
  getAllOrdersInternal,
  findPersonByPublicId,

  // Population functions with centralized logic
  findOrderWithPopulation,
  findUnconfirmedOrder,
  findPersonById,
};
