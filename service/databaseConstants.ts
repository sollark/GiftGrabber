/**
 * databaseConstants.ts
 *
 * Purpose: Centralized database field selection constants
 *
 * Main Responsibilities:
 * - Defines standard field selections for all database models
 * - Ensures consistent field selection across service layer
 * - Prevents circular dependencies between service modules
 * - Maintains security by excluding _id and including publicId
 *
 * Architecture Role:
 * - Shared constants for database abstraction layer
 * - Single source of truth for field selections
 * - Breaks circular dependencies between services
 */

/**
 * Standard field selections that include publicId but exclude _id
 * Used across all database services for consistent and secure field selection
 */
export const PUBLIC_FIELD_SELECTIONS = {
  PERSON: "publicId firstName lastName employeeId personId sourceFormat",
  EVENT:
    "publicId eventId name email ownerId eventQRCodeBase64 ownerIdQRCodeBase64",
  GIFT: "publicId owner applicant order",
  ORDER: "publicId createdAt applicant gifts orderId  status",
};

/**
 * Population queries with field selection for related documents
 * These define how to populate relations while maintaining security
 */
export const POPULATION_CONFIGS = {
  EVENT_APPLICANTS: {
    path: "applicantList",
    model: "Person",
    select: PUBLIC_FIELD_SELECTIONS.PERSON,
  },
  EVENT_GIFTS: {
    path: "gifts",
    model: "Gift",
    select: PUBLIC_FIELD_SELECTIONS.GIFT,
  },
  ORDER_APPLICANT: {
    path: "applicant",
    model: "Person",
    select: PUBLIC_FIELD_SELECTIONS.PERSON,
  },
  ORDER_GIFTS: {
    path: "gifts",
    model: "Gift",
    select: PUBLIC_FIELD_SELECTIONS.GIFT,
    populate: {
      path: "applicant",
      select: PUBLIC_FIELD_SELECTIONS.PERSON,
    },
  },
};
