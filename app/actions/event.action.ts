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
  fetchEventGifts,
} from "@/service/eventService";
import { serializeForClient } from "@/service/databaseService";
import { withDatabase, withDatabaseResult } from "@/lib/withDatabase";
import { Result, isSuccess, failure, success } from "@/utils/fp";
import { Gift } from "@/database/models/gift.model";

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

// --- Event Actions (Public API) ---

/**
 * Creates a new event with applicants and gifts, ensuring all related entities get publicIds.
 * @param event - EventCreationData from form
 * @returns Result<boolean, string> - Success or error message
 */
export const createEvent = async (
  event: EventCreationData
): Promise<Result<boolean, string>> => {
  logger.info("[CREATE] createEvent", {
    name: event.name,
    timestamp: Date.now(),
  });
  const result = await withDatabaseResult(createEventInternal)(event);
  if (result._tag === "Success") {
    logger.info("[CREATE:SUCCESS] createEvent", {
      name: event.name,
      timestamp: Date.now(),
    });
    return success(true);
  } else {
    logger.error("[CREATE:FAILURE] createEvent", {
      name: event.name,
      error: result.error,
      timestamp: Date.now(),
    });
    return failure(result.error.message);
  }
};

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
    } else {
      logger.error("[FETCH:ERROR] getEvent", {
        eventId,
        error: result.error,
        timestamp: Date.now(),
      });
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
      logger.error("[FETCH:ERROR] getEventDetails", {
        eventId,
        error: "Unknown error",
        timestamp: Date.now(),
      });
      return null;
    }
  }
);

/**
 * Fetches event applicants list with populated applicant data using publicIds.
 * Returns Result<Person[], string> for functional error handling.
 * @param eventId - The unique identifier for the event
 * @returns Promise<Result<Person[], string>>
 */
export const getEventApplicants = withDatabase(
  async (eventId: string): Promise<Result<Person[], string>> => {
    logger.info("[FETCH] getEventApplicants", {
      eventId,
      timestamp: Date.now(),
    });
    const result = await fetchEventApplicants(eventId);
    if (isSuccess(result)) {
      logger.info("[FETCH:RESULT] getEventApplicants", {
        eventId,
        count: Array.isArray(result.value) ? result.value.length : undefined,
        timestamp: Date.now(),
      });
      return success(result.value);
    } else {
      logger.error("[FETCH:ERROR] getEventApplicants", {
        eventId,
        error: result.error,
        timestamp: Date.now(),
      });
      return failure(result.error?.message || "Failed to fetch applicants");
    }
  }
);

/**
 * Fetches event approvers list with populated approver data using publicIds.
 * Returns Result<Person[], string> for functional error handling.
 * @param eventId - The unique identifier for the event
 * @returns Promise<Result<Person[], string>>
 */
export const getEventApprovers = withDatabase(
  async (eventId: string): Promise<Result<Person[], string>> => {
    logger.info("[FETCH] getEventApprovers", {
      eventId,
      timestamp: Date.now(),
    });
    const result = await fetchEventApprovers(eventId);
    if (isSuccess(result)) {
      logger.info("[FETCH:RESULT] getEventApprovers", {
        eventId,
        count: Array.isArray(result.value) ? result.value.length : undefined,
        timestamp: Date.now(),
      });
      return success(result.value);
    } else {
      logger.error("[FETCH:ERROR] getEventApprovers", {
        eventId,
        error: result.error,
        timestamp: Date.now(),
      });
      return failure(result.error?.message || "Failed to fetch approvers");
    }
  }
);

/**
 * Fetches all events with minimal data using publicIds.
 * Returns Result<Event[], string> for functional error handling.
 * @returns Promise<Result<Event[], string>>
 */
export const getAllEvents = withDatabase(
  async (): Promise<Result<Event[], string>> => {
    logger.info("[FETCH] getAllEvents", { timestamp: Date.now() });
    const result = await fetchAllEvents();
    if (isSuccess(result)) {
      logger.info("[FETCH:RESULT] getAllEvents", {
        count: Array.isArray(result.value) ? result.value.length : undefined,
        timestamp: Date.now(),
      });
      return success(
        result.value.map((event) => serializeForClient<Event>(event))
      );
    } else {
      logger.error("[FETCH:ERROR] getAllEvents", {
        error: result.error,
        timestamp: Date.now(),
      });
      return failure(result.error?.message || "Failed to fetch events");
    }
  }
);

/**
 * Fetches all gifts for a given event using publicId.
 * Returns Result<Gift[], string> for functional error handling.
 * @param eventId - The unique identifier for the event
 * @returns Promise<Result<Gift[], string>>
 */

export const getGifts = withDatabase(
  async (eventId: string): Promise<Result<Gift[], string>> => {
    logger.info("[FETCH] getGifts", {
      eventId,
      timestamp: Date.now(),
    });
    const result = await fetchEventGifts(eventId);
    if (isSuccess(result)) {
      logger.info("[FETCH:RESULT] getGifts", {
        eventId,
        count: Array.isArray(result.value) ? result.value.length : undefined,
        timestamp: Date.now(),
      });
      return success(result.value);
    } else {
      logger.error("[FETCH:ERROR] getGifts", {
        eventId,
        error: result.error,
        timestamp: Date.now(),
      });
      return failure(result.error?.message || "Failed to fetch gifts");
    }
  }
);

/**
 * Validation helper for publicIds
 * @param publicId - The publicId to validate
 * @returns boolean - Whether the publicId is valid
 * @note: This function is not used anywhere in this file. Consider removing or moving to a shared utility if not needed.
 */
const isValidPublicIdInternal = (publicId: string): boolean => {
  // Basic validation - publicIds should be non-empty strings
  // Could be enhanced with format validation for nanoid
  return typeof publicId === "string" && publicId.length > 0;
};

/**
 * Exported server action wrapper for publicId validation
 * @note: This function is not used by any other exported action in this file. If not used elsewhere, consider removing.
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
 * @note: This function is not used by any other exported action in this file. If not used elsewhere, consider removing.
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
 * @note: This function is not used by any other exported action in this file. If not used elsewhere, consider removing.
 */
export const sanitizeEventData = withDatabase(
  async (event: any): Promise<any> => {
    return sanitizeEventDataInternal(event);
  }
);
