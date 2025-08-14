/**
 * common.types.ts
 * Purpose: Common utility types and interfaces used across multiple modules
 * Responsibilities: Defines utility types, service interfaces, and component props
 * Architecture: Imports from database models but doesn't redefine them
 */

import { Person } from "@/database/models/person.model";
import { Order } from "@/database/models/order.model";
import { Gift } from "@/database/models/gift.model";
import { Event } from "@/database/models/event.model";
import { Types } from "mongoose";

// ============================================================================
// UTILITY TYPES - Common patterns used across the app
// ============================================================================

/**
 * Removes _id from any entity type for form usage
 * Used when creating new entities or working with form data
 */
export type WithoutId<T extends { _id: any }> = Omit<T, "_id">;

/**
 * Person without _id - commonly used in forms and creation flows
 */
export type PersonWithoutId = WithoutId<Person>;

/**
 * Gift without _id - used in gift creation flows
 */
export type GiftWithoutId = WithoutId<Gift>;

/**
 * Order without _id - used in order creation flows
 */
export type OrderWithoutId = WithoutId<Order>;

/**
 * Event without _id - used in event creation flows
 */
export type EventWithoutId = WithoutId<Event>;

/**
 * Common MongoDB ObjectId type alias for cleaner code
 */
export type ObjectId = Types.ObjectId;

// ============================================================================
// SERVICE LAYER TYPES - Interfaces for service operations
// ============================================================================

/**
 * Data required to create a new event in the database
 * Contains all the processed information needed for event creation
 */
export interface CreateEventData {
  name: string;
  email: string;
  eventId: string;
  ownerId: string;
  eventQRCodeBase64: string;
  ownerIdQRCodeBase64: string;
  applicantIds: string[];
  giftIds: string[];
  approverIds: string[];
}

/**
 * Form data for event creation without database-specific fields
 * Used for processing user input before database operations
 */
export interface EventFormData {
  eventId: string;
  name: string;
  email: string;
  ownerId: string;
  eventQRCodeBase64: string;
  ownerIdQRCodeBase64: string;
  applicantList: PersonWithoutId[];
  approverList: PersonWithoutId[];
}

/**
 * Data required to create a new order in the database
 * Contains all the processed information needed for order creation
 */
export interface OrderCreationData {
  createdAt: Date;
  approverList: ObjectId[];
  applicant: ObjectId;
  gifts: ObjectId[];
  orderId: string;
  confirmationRQCode: string;
}

// ============================================================================
// QR CODE & EMAIL TYPES - Service layer interfaces
// ============================================================================

/**
 * Output type for generated QR codes
 * Contains base64 encoded QR codes for different purposes
 */
export interface GenerateQRCodesOutput {
  eventQRCodeBase64: string;
  ownerIdQRCodeBase64: string;
}

/**
 * Email attachment structure for service layer
 * Used when sending emails with file attachments
 */
export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

/**
 * Email payload structure for sending emails
 * Contains all information needed to compose and send an email
 */
export interface EmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

// ============================================================================
// TYPE GUARDS - Runtime type checking utilities
// ============================================================================

/**
 * Type guard to check if an object has a valid ObjectId _id field
 * @param obj - Object to check
 * @returns True if object has _id as ObjectId, false otherwise
 */
export const hasObjectId = (obj: unknown): obj is { _id: ObjectId } => {
  return (
    !!obj &&
    typeof obj === "object" &&
    "_id" in obj &&
    Types.ObjectId.isValid((obj as any)._id)
  );
};

/**
 * Type guard to check if an object is a Mongoose document
 * @param obj - Object to check
 * @returns True if object is a Mongoose document with toObject method
 */
export const isMongooseDocument = (
  obj: unknown
): obj is { toObject: () => object; _id: ObjectId } =>
  !!obj &&
  typeof obj === "object" &&
  typeof (obj as any).toObject === "function" &&
  hasObjectId(obj);
