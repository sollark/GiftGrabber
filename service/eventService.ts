import { Gift } from "@/database/models/gift.model";
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
 * Fetches all gifts for a given event by eventId (publicId).
 * Returns Result<Gift[], Error> for functional error handling.
 * @param eventId - The unique identifier for the event
 * @returns Promise<Result<Gift[], Error>>
 */
export const fetchEventGifts = async (
  eventId: string
): Promise<Result<Gift[], Error>> => {
  try {
    const result = await GiftService.findByEventId(eventId);
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
 * Validates that an event exists.
 * @param event - The Event object or null.
 * @returns boolean - True if event is valid, false otherwise.
 */
const validateEvent = (event: Event | null): boolean => {
  return event !== null;
};

/**
 * Orchestrates creation of a new event with all related applicants, and gifts.
 * Enhanced with direct service calls, validation, and functional Result composition.
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
  } = event;

  // Use parallel processing for better performance and direct service calls
  const [applicantResult] = await Promise.all([
    PersonService.createMany(applicantList),
  ]);

  // Enhanced error handling with Result composition
  if (applicantResult._tag === "Failure") {
    console.error("Failed to create applicants:", applicantResult.error);
    return failure("Failed to create applicants");
  }

  // Create gifts for applicants using direct service call
  const giftResult = await GiftService.createForApplicants(
    applicantResult.value
  );

  if (giftResult._tag === "Failure") {
    console.error("Failed to create gifts:", giftResult.error);
    return failure("Failed to create gifts");
  }

  // Create event record using enhanced service call with validation
  const eventResult = await DatabaseEventService.createEnhanced({
    name,
    email,
    eventId,
    ownerId,
    eventQRCodeBase64,
    ownerIdQRCodeBase64,
    applicantPublicIds: applicantResult.value,
    giftPublicIds: giftResult.value,
  });

  if (eventResult._tag === "Failure") {
    console.error("Failed to create event:", eventResult.error);
    return failure(`Failed to create event: ${eventResult.error.message}`);
  }

  return success(true);
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
