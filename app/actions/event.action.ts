/**
 * @file event.action.refactored.ts
 * @description Refactored Event Actions using PublicId Strategy
 *
 * This demonstrates the new approach where:
 * - All external APIs use publicId
 * - _id is kept internal to database layer
 * - Consistent Result<T, E> pattern for error handling
 * - Type-safe operations with proper validation
 */

"use server";

import { Event } from "@/database/models/event.model";
import { Person } from "@/database/models/person.model";
import {
  createEventInternal,
  fetchEventApprovers,
  fetchEventApplicants,
  getEventWithDetails,
  fetchAllEvents,
  parseEventData,
} from "@/service/eventService";
import { withDatabase, withDatabaseResult } from "@/lib/withDatabase";
import { Result, isSuccess, mapError, flatMap, failure } from "@/utils/fp";

/**
 * Logs event-related errors
 */
const logEventError = (message: string): void => {
  console.log(message);
};

/**
 * Configuration constants for event operations
 * Note: selectFields are now ignored as we use standardized publicId selections
 */
const EVENT_CONFIG = {
  // Legacy field configurations (kept for backward compatibility)
  QUERY_FIELDS: {
    APPLICANTS: { name: 1, applicantList: 1, giftList: 1 },
    APPROVERS: { approverList: 1 },
    DETAILS: {
      eventId: 1,
      name: 1,
      email: 1,
      applicantList: 1,
      giftList: 1,
      approverList: 1,
    },
  },
} as const;

/**
 * Log messages for event operations
 */
const LOG_MESSAGES = {
  EVENT_CREATED: "Event created with publicId strategy:",
  GET_EVENT_DETAILS: "Getting event details for eventId:",
  USING_PUBLIC_ID: "Operation using publicId instead of _id",
} as const;

/**
 * Error messages for event operations
 */
const ERROR_MESSAGES = {
  CREATE_EVENT: "Error in createEvent",
  GET_EVENT_APPLICANTS: "Error in getEventApplicants",
  GET_EVENT_APPROVERS: "Error in getEventApprovers",
  GET_EVENT_DETAILS: "Error in getEventDetails",
  GET_ALL_EVENTS: "Error in getAllEvents",
  EVENT_NOT_FOUND: "Event not found",
  INVALID_PUBLIC_ID: "Invalid publicId provided",
} as const;

/**
 * createEvent (Public API) - Refactored for PublicId Strategy
 *
 * Server action for creating new events with applicants and gifts.
 * Now ensures all related entities get publicIds and no _id exposure.
 * @param event EventCreationData - Event data from form
 * @returns Result<boolean, string> - Result with success status or error message
 * @sideEffects Creates database records with publicIds, sends confirmation emails
 */
export const createEvent = async (
  event: any
): Promise<Result<boolean, string>> => {
  const databaseResult = await withDatabaseResult(async () => {
    console.log(LOG_MESSAGES.EVENT_CREATED, event.name);
    return await createEventInternal(event);
  })();

  // Handle nested Result and convert Error to string
  if (isSuccess(databaseResult)) {
    const innerResult = databaseResult.value;
    if (isSuccess(innerResult)) {
      return innerResult;
    } else {
      return failure(innerResult.error);
    }
  } else {
    return failure(databaseResult.error.message);
  }
};

/**
 * Fetches event applicants list with populated applicant data using publicIds.
 * Optimized to fetch only applicant data without full event object.
 * @param eventId - The unique identifier for the event
 * @returns Promise<Person[]> - Array of applicant persons with publicIds
 */
export const getEventApplicantsInternal = async (
  eventId: string
): Promise<Person[]> => {
  console.log(LOG_MESSAGES.USING_PUBLIC_ID);
  const result = await fetchEventApplicants(eventId);
  if (isSuccess(result)) {
    return result.value;
  } else {
    logEventError(ERROR_MESSAGES.GET_EVENT_APPLICANTS);
    logEventError(
      result.error instanceof Error
        ? result.error.message
        : String(result.error)
    );
    return [];
  }
};

/**
 * Action: Gets event applicants with publicId-based populated data
 */
export const getEventApplicants = withDatabase(getEventApplicantsInternal);

/**
 * Fetches event approvers list with populated approver data using publicIds.
 * Optimized to fetch only approver data without full event object.
 * @param eventId - The unique identifier for the event
 * @returns Promise<Person[]> - Array of approver persons with publicIds
 */
const getEventApproversInternal = async (
  eventId: string
): Promise<Person[]> => {
  console.log(LOG_MESSAGES.USING_PUBLIC_ID);
  const result = await fetchEventApprovers(eventId);
  if (isSuccess(result)) {
    return result.value;
  } else {
    logEventError(ERROR_MESSAGES.GET_EVENT_APPROVERS);
    logEventError(
      result.error instanceof Error
        ? result.error.message
        : String(result.error)
    );
    return [];
  }
};

/**
 * Action: Gets event approvers with publicId-based data
 */
export const getEventApprovers = withDatabase(getEventApproversInternal);

/**
 * Fetches complete event details with all populated relationships using publicIds.
 * @param eventId - The unique identifier for the event
 * @returns Promise<Event | null> - Complete event with publicId-based relationships
 */
const getEventDetailsInternal = async (
  eventId: string
): Promise<Event | null> => {
  console.log(LOG_MESSAGES.GET_EVENT_DETAILS, eventId);
  console.log(LOG_MESSAGES.USING_PUBLIC_ID);
  const result = await getEventWithDetails(eventId);
  if (isSuccess(result)) {
    return parseEventData(result.value);
  } else {
    logEventError(ERROR_MESSAGES.GET_EVENT_DETAILS);
    logEventError(
      result.error instanceof Error
        ? result.error.message
        : String(result.error)
    );
    return null;
  }
};

/**
 * Action: Gets complete event details with publicId-based data
 */
export const getEventDetails = withDatabase(getEventDetailsInternal);

/**
 * Fetches all events with minimal data using publicIds.
 * @returns Promise<Event[]> - Array of events with publicId fields
 */
const getAllEventsInternal = async (): Promise<Event[]> => {
  console.log(LOG_MESSAGES.USING_PUBLIC_ID);
  const result = await fetchAllEvents();
  if (isSuccess(result)) {
    return result.value.map((event) => parseEventData(event));
  } else {
    logEventError(ERROR_MESSAGES.GET_ALL_EVENTS);
    logEventError(
      result.error instanceof Error
        ? result.error.message
        : String(result.error)
    );
    return [];
  }
};

/**
 * Action: Gets all events with publicId-based data
 */
export const getAllEvents = withDatabase(getAllEventsInternal);

/**
 * NEW: Find event by publicId (demonstrating new public API pattern)
 * @param publicId - The event's publicId
 * @returns Promise<Event | null> - Event with publicId-based data
 */
export const getEventByPublicId = withDatabase(
  async (publicId: string): Promise<Event | null> => {
    if (!publicId || typeof publicId !== "string") {
      logEventError(ERROR_MESSAGES.INVALID_PUBLIC_ID);
      return null;
    }

    console.log(LOG_MESSAGES.USING_PUBLIC_ID, publicId);

    try {
      // This would use DatabaseEventService.findByPublicId
      // For now, we'll use the legacy eventId approach
      // TODO: Implement publicId-based lookup when eventId is migrated to publicId

      return null; // Placeholder - full implementation pending
    } catch (error) {
      logEventError(`Error finding event by publicId: ${error}`);
      return null;
    }
  }
);

/**
 * Validation helper for publicIds
 * @param publicId - The publicId to validate
 * @returns boolean - Whether the publicId is valid
 */
const isValidPublicIdInternal = (publicId: string): boolean => {
  // Basic validation - publicIds should be non-empty strings
  // Could be enhanced with format validation for nanoid
  return typeof publicId === "string" && publicId.length > 0;
};

/**
 * Safe event data serializer that removes any remaining _id fields
 * @param event - Event data to sanitize
 * @returns Event data with only publicId fields
 */
const sanitizeEventDataInternal = (event: any): any => {
  if (!event) return null;

  // Recursively remove any _id fields and ensure publicId presence
  const sanitized = JSON.parse(JSON.stringify(event));

  const removeId = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(removeId);
    }
    if (obj && typeof obj === "object") {
      const { _id, __v, ...rest } = obj;
      const result: any = {};
      for (const [key, value] of Object.entries(rest)) {
        result[key] = removeId(value);
      }
      return result;
    }
    return obj;
  };

  return removeId(sanitized);
};

/**
 * Exported server action wrapper for publicId validation
 */
export const isValidPublicId = withDatabase(
  async (publicId: string): Promise<boolean> => {
    return isValidPublicIdInternal(publicId);
  }
);

/**
 * Exported server action wrapper for event data sanitization
 */
export const sanitizeEventData = withDatabase(
  async (event: any): Promise<any> => {
    return sanitizeEventDataInternal(event);
  }
);
