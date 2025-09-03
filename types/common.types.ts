/**
 * common.types.ts
 *
 * Purpose: Centralized type definitions for cross-module utility types and service interfaces
 *
 * Main Responsibilities:
 * - Provides utility types for database entity manipulation (WithoutId, ObjectId aliases)
 * - Defines service layer interfaces for event creation and data processing
 * - Establishes component prop types for reusable UI components
 * - Declares configuration types for Excel import/export functionality
 *
 * Architecture Role:
 * - Acts as a type bridge between database models and application logic
 * - Imported by service layers, components, and context providers
 * - Avoids redefining database model types, preferring composition over duplication
 * - Follows functional programming patterns with immutable data structures
 */

import { ExcelFormatType } from "@/types/excel.types";
import { Types } from "mongoose";
import { Person } from "@/database/models/person.model";
import { Gift } from "@/database/models/gift.model";

// ============================================================================
// UTILITY TYPES - Common patterns used across the app
// ============================================================================

/**
 * Removes _id from any entity type for form usage
 * Used when creating new entities or working with form data
 */
export type WithoutId<T extends { _id: any }> = Omit<T, "_id">;

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
  applicantList: NewPerson[];
}

/**
 * Data required to create a new order in the database
 * Contains all the processed information needed for order creation
 * Aligned with Order model schema
 */
export interface OrderCreationData {
  createdAt: Date;
  applicant: ObjectId;
  gifts: ObjectId[];
  publicOrderId: string;
  confirmationRQCode: string;
}

/**
 * Data required to create a new order using publicIds (new publicId strategy)
 * Contains publicIds instead of ObjectIds for external API safety
 */
export interface OrderCreationPublicData {
  applicantPublicId: string;
  giftPublicIds: string[];
  publicOrderId: string;
  confirmationRQCode: string;
}

/**
 * Person data for creation (before database save)
 * Excludes publicId as it will be generated automatically
 */
export interface NewPerson {
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  personId?: string;
  sourceFormat: ExcelFormatType;
}

/**
 * newOrder type for use in order context
 * Represents a newly created order with relevant details
 */
export type newOrder = {
  createdAt: Date;
  applicant: Person | null;
  gifts: Gift[];
  publicOrderId: string;
  confirmationRQCode: string;
  status: OrderStatus;
};

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
 * Order status enumeration - moved from components to avoid circular dependencies
 * Shared between database models and UI components
 */
export enum OrderStatus {
  PENDING = "Pending",
  PROCESSING = "Processing",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
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
 * Runtime type guard to validate ObjectId presence in objects
 *
 * @param obj - Any object to type-check for ObjectId _id field
 * @returns Boolean indicating if object has valid ObjectId _id property
 *
 * @sideEffects None - pure function with no external state changes
 * @performance O(1) - single validation check using mongoose Types.ObjectId.isValid
 * @notes Critical for runtime type safety when working with database entities
 * @publicAPI Used throughout service layer for input validation
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
 * Runtime type guard to identify Mongoose document instances
 *
 * @param obj - Any object to check for Mongoose document characteristics
 * @returns Boolean indicating if object is a Mongoose document with toObject method
 *
 * @sideEffects None - pure function performing only type checks
 * @performance O(1) - validates method presence and ObjectId in single pass
 * @notes Essential for distinguishing between plain objects and Mongoose documents
 * @publicAPI Used in data transformation and serialization contexts
 */
export const isMongooseDocument = (
  obj: unknown
): obj is { toObject: () => object; _id: ObjectId } =>
  !!obj &&
  typeof obj === "object" &&
  typeof (obj as any).toObject === "function" &&
  hasObjectId(obj);
