import { failure, success, Result } from "@/utils/fp";
import { Event } from "@/database/models/event.model";
import { Person } from "@/database/models/person.model";
import { EventFormData } from "@/types/common.types";
import {
  PersonService,
  GiftService,
  EventService as DatabaseEventService,
} from "./databaseService";

/**
 * Event Service - Refactored to use PublicId strategy
 *
 * This service now uses the new DatabaseService layer which ensures:
 * - All queries use publicId
 * - _id is kept internal to the database layer
 * - Consistent field selection across all operations
 * - Type-safe operations with Result<T, E> pattern
 * - Direct service imports for better maintainability
 */

/**
 * Validates that an event exists.
 * @param event - The Event object or null.
 * @returns boolean - True if event is valid, false otherwise.
 */
const validateEvent = (event: Event | null): boolean => {
  return event !== null;
};

/**
 * Orchestrates creation of a new event with all related applicants, approvers, and gifts.
 * Enhanced with direct service calls and functional Result composition.
 * @param event - The event form data containing all necessary information.
 * @returns Promise<Result<boolean, string>> - Success if event was created, failure with error message otherwise.
 */
export const createEventInternal = async (
  event: EventFormData
): Promise<Result<boolean, string>> => {
  const {
    name,
    email,
    eventId,
    ownerId,
    eventQRCodeBase64,
    ownerIdQRCodeBase64,
    applicantList,
    approverList,
  } = event;

  // Use parallel processing for better performance and direct service calls
  const [applicantResult, approverResult] = await Promise.all([
    PersonService.createMany(applicantList),
    PersonService.createMany(approverList),
  ]);

  // Enhanced error handling with Result composition
  if (applicantResult._tag === "Failure") {
    console.error("Failed to create applicants:", applicantResult.error);
    return failure("Failed to create applicants");
  }

  if (approverResult._tag === "Failure") {
    console.error("Failed to create approvers:", approverResult.error);
    return failure("Failed to create approvers");
  }

  // Create gifts for applicants using direct service call
  const giftResult = await GiftService.createForApplicants(
    applicantResult.value
  );
  if (giftResult._tag === "Failure") {
    console.error("Failed to create gifts:", giftResult.error);
    return failure("Failed to create gifts");
  }

  // Create event record using direct service call
  const eventResult = await DatabaseEventService.create({
    name,
    email,
    eventId,
    ownerId,
    eventQRCodeBase64,
    ownerIdQRCodeBase64,
    applicantPublicIds: applicantResult.value,
    approverPublicIds: approverResult.value,
    giftPublicIds: giftResult.value,
  });

  if (eventResult._tag === "Failure") {
    console.error("Failed to create event:", eventResult.error);
    return failure("Failed to create event");
  }

  return success(true);
};

/**
 * Gets only approvers list for an event.
 * Optimized function that fetches only approver data without full event object.
 * @param eventId - The unique identifier for the event.
 * @returns Promise<Person[]> - Array of approver persons with publicIds.
 */

export const fetchEventApprovers = async (
  eventId: string
): Promise<Result<Person[], Error>> => {
  try {
    const result = await DatabaseEventService.getApprovers(eventId);
    if (result._tag === "Success") {
      return success(result.value);
    } else {
      return failure(result.error);
    }
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * Gets only applicants list for an event.
 * Optimized function that fetches only applicant data without full event object.
 * @param eventId - The unique identifier for the event.
 * @returns Promise<Person[]> - Array of applicant persons with publicIds.
 */

export const fetchEventApplicants = async (
  eventId: string
): Promise<Result<Person[], Error>> => {
  try {
    const result = await DatabaseEventService.getApplicants(eventId);
    if (result._tag === "Success") {
      return success(result.value);
    } else {
      return failure(result.error);
    }
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * Gets event with full details including all populated fields.
 * @param eventId - The unique identifier for the event.
 * @returns Promise<Event | null> - Event with all relationships populated or null.
 */

export const getEventWithDetails = async (
  eventId: string
): Promise<Result<Event, Error>> => {
  try {
    const result = await DatabaseEventService.findWithAllDetails(eventId);
    if (result._tag === "Success") {
      if (result.value) {
        return success(result.value);
      } else {
        return failure(new Error(`Event with id ${eventId} not found`));
      }
    } else {
      return failure(result.error);
    }
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * Gets all events from the database.
 * @returns Promise<Event[]> - Array of all events.
 */

export const fetchAllEvents = async (): Promise<Result<Event[], Error>> => {
  try {
    const result = await DatabaseEventService.findAll();
    if (result._tag === "Success") {
      return success(result.value);
    } else {
      return failure(result.error);
    }
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * Helper to serialize any object for safe JSON transmission.
 * @param data - The data to serialize.
 * @returns Serialized object.
 */
export const parseEventData = (data: any): any => {
  // Remove any Mongoose-specific properties and ensure clean serialization
  if (data && typeof data.toObject === "function") {
    return data.toObject();
  }
  return JSON.parse(JSON.stringify(data));
};
