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
  event: EventCreationData
): Promise<Result<boolean, string>> => {
  logger.info("[CREATE] createEvent", {
    name: event.name,
    timestamp: Date.now(),
  });
  const result = await withDatabaseResult(createEventInternal)(event);
  return result._tag === "Success"
    ? result.value // This should already be Result<boolean, string>
    : failure(result.error.message);
};

/**
 * Fetches event applicants list with populated applicant data using publicIds.
 * Optimized to fetch only applicant data without full event object.
 * @param eventId - The unique identifier for the event
 * @returns Promise<Person[]> - Array of applicant persons with publicIds
 */
const getEventApplicantsInternal = async (
  eventId: string
): Promise<Person[]> => {
  logger.info("[FETCH] getEventApplicantsInternal", {
    eventId,
    timestamp: Date.now(),
  });
  const result = await fetchEventApplicants(eventId);
  if (isSuccess(result)) {
    logger.info("[FETCH:RESULT] getEventApplicantsInternal", {
      eventId,
      count: Array.isArray(result.value) ? result.value.length : undefined,
      timestamp: Date.now(),
    });
    return result.value;
  } else {
    logger.error("[FETCH:ERROR] getEventApplicantsInternal", {
      eventId,
      error: result.error,
      timestamp: Date.now(),
    });
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
  logger.info("[FETCH] getEventApproversInternal", {
    eventId,
    timestamp: Date.now(),
  });
  const result = await fetchEventApprovers(eventId);
  if (isSuccess(result)) {
    logger.info("[FETCH:RESULT] getEventApproversInternal", {
      eventId,
      count: Array.isArray(result.value) ? result.value.length : undefined,
      timestamp: Date.now(),
    });
    return result.value;
  } else {
    logger.error("[FETCH:ERROR] getEventApproversInternal", {
      eventId,
      error: result.error,
      timestamp: Date.now(),
    });
    return [];
  }
};

/**
 * Action: Gets event approvers with publicId-based data
 */
export const getEventApprovers = withDatabase(getEventApproversInternal);

/**
 * Fetches all events with minimal data using publicIds.
 * @returns Promise<Event[]> - Array of events with publicId fields
 */
const getAllEventsInternal = async (): Promise<Event[]> => {
  logger.info("[FETCH] getAllEventsInternal", { timestamp: Date.now() });
  const result = await fetchAllEvents();
  if (isSuccess(result)) {
    logger.info("[FETCH:RESULT] getAllEventsInternal", {
      count: Array.isArray(result.value) ? result.value.length : undefined,
      timestamp: Date.now(),
    });
    return result.value.map((event) => serializeForClient<Event>(event));
  } else {
    logger.error("[FETCH:ERROR] getAllEventsInternal", {
      error: result.error,
      timestamp: Date.now(),
    });
    return [];
  }
};

/**
 * Action: Gets all events with publicId-based data
 */
export const getAllEvents = withDatabase(getAllEventsInternal);

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
 * Exported server action wrapper for publicId validation
 */
export const isValidPublicId = withDatabase(
  async (publicId: string): Promise<boolean> => {
    return isValidPublicIdInternal(publicId);
  }
);

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
 * Exported server action wrapper for event data sanitization
 */
export const sanitizeEventData = withDatabase(
  async (event: any): Promise<any> => {
    return sanitizeEventDataInternal(event);
  }
);
/**
 * event.action.ts
 *
 * Server actions for event management using publicId strategy.
 * - Exposes only publicId-based APIs to the client.
 * - Handles event creation, retrieval, and validation.
 * - Uses type-safe error handling and logging.
 * - Wraps all DB operations for reliability.
 */

import logger from "@/lib/logger";
import { Event } from "@/database/models/event.model";
import { Person } from "@/database/models/person.model";
import { NewPerson } from "@/types/common.types";
import {
  createEventInternal,
  fetchEventApprovers,
  fetchEventApplicants,
  getEventWithDetails,
  fetchAllEvents,
} from "@/service/eventService";
import { serializeForClient } from "@/service/databaseService";
import { withDatabase, withDatabaseResult } from "@/lib/withDatabase";
import { Result, isSuccess, failure } from "@/utils/fp";

// --- Types ---

/** Data required to create a new event */
export interface EventCreationData {
  name: string;
  email: string;
  eventId: string;
  ownerId: string;
  eventQRCodeBase64: string;
  ownerIdQRCodeBase64: string;
  applicantList: NewPerson[];
  approverList: NewPerson[];
}

/**
 * Fetches the full event object as it is in the database (no field selection or transformation).
 * @param eventId - The event's unique identifier (publicId or internal id, as supported by DB layer).
 * @returns The full Event object or null if not found.
 */
export const getEvent = withDatabase(
  async (eventId: string): Promise<Event | null> => {
    logger.info("[FETCH] getEvent", { eventId, timestamp: Date.now() });
    const result = await getEventWithDetails(eventId);
    if (isSuccess(result)) {
      logger.info("[FETCH:RESULT] getEvent", {
        eventId,
        found: !!result.value,
        timestamp: Date.now(),
      });
      return result.value;
    } else if (result._tag === "Failure") {
      logger.error("[FETCH:ERROR] getEvent", {
        eventId,
        error: result.error,
        timestamp: Date.now(),
      });
      return null;
    } else {
      return null;
    }
  }
);

/**
 * Fetches only the publicId, name, and email fields for an event.
 * @param eventId - The event's unique identifier (publicId or internal id, as supported by DB layer).
 * @returns An object with publicId, name, and email, or null if not found.
 */
export interface EventDetails {
  publicId: string;
  name: string;
  email: string;
}

export const getEventDetails = withDatabase(
  async (eventId: string): Promise<EventDetails | null> => {
    logger.info("[FETCH] getEventDetails", { eventId, timestamp: Date.now() });
    const result = await getEventWithDetails(eventId);
    if (isSuccess(result) && result.value) {
      const { publicId, name, email } = result.value;
      logger.info("[FETCH:RESULT] getEventDetails", {
        eventId,
        publicId,
        name,
        email,
        timestamp: Date.now(),
      });
      return { publicId, name, email };
    } else if (result._tag === "Failure") {
      logger.error("[FETCH:ERROR] getEventDetails", {
        eventId,
        error: result.error,
        timestamp: Date.now(),
      });
      return null;
    } else {
      return null;
    }
  }
);
