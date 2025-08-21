import { failure, success, Result } from "@/utils/fp";
import { Event } from "@/database/models/event.model";
import { Person } from "@/database/models/person.model";
import { NewPerson } from "@/types/common.types";
import { CreateEventData, EventFormData } from "@/types/common.types";
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
 */

/**
 * Validates that an event exists.
 * @param event - The Event object or null.
/**
 * Creates person records for a list of person data (applicants or approvers).
 * @param personList - Array of person objects without publicId.
 * @returns Promise<Result<string[], Error>> - Result with array of created person publicIds.
 */
export const createPersonList = async (
  personList: NewPerson[]
): Promise<Result<string[], Error>> => {
  return PersonService.createMany(personList);
};

/**
 * Creates gift records for a list of applicant publicIds.
 * @param applicantPublicIds - Array of applicant publicIds.
 * @returns Promise<Result<string[], Error>> - Result with array of created gift publicIds.
 */
export const createGiftList = async (
  applicantPublicIds: string[]
): Promise<Result<string[], Error>> => {
  return GiftService.createForApplicants(applicantPublicIds);
};

/**
 * Creates the actual event record in the database using publicIds.
 * @param eventData - Object containing all event creation fields and related publicIds.
 * @returns Promise<Result<Event, Error>> - Result with the created Event document.
 */
const createEventRecord = async (
  eventData: CreateEventData
): Promise<Result<Event, Error>> => {
  const {
    name,
    email,
    eventId,
    ownerId,
    eventQRCodeBase64,
    ownerIdQRCodeBase64,
    applicantIds,
    giftIds,
    approverIds,
  } = eventData;

  return DatabaseEventService.create({
    name,
    email,
    eventId,
    ownerId,
    eventQRCodeBase64,
    ownerIdQRCodeBase64,
    applicantPublicIds: applicantIds,
    approverPublicIds: approverIds,
    giftPublicIds: giftIds,
  });
};

/**
 * Orchestrates creation of a new event with all related applicants, approvers, and gifts.
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

  // Create applicants and approvers
  const applicantResult = await createPersonList(applicantList);
  if (applicantResult._tag === "Failure") {
    console.error(applicantResult.error);
    return failure("Failed to create applicants");
  }

  const approverResult = await createPersonList(approverList);
  if (approverResult._tag === "Failure") {
    console.error(approverResult.error);
    return failure("Failed to create approvers");
  }

  // Create gifts for applicants
  const giftResult = await createGiftList(applicantResult.value);
  if (giftResult._tag === "Failure") {
    console.error(giftResult.error);
    return failure("Failed to create gifts");
  }

  const eventData: CreateEventData = {
    name,
    email,
    eventId,
    ownerId,
    eventQRCodeBase64,
    ownerIdQRCodeBase64,
    applicantIds: applicantResult.value,
    giftIds: giftResult.value,
    approverIds: approverResult.value,
  };

  const eventResult = await createEventRecord(eventData);
  if (eventResult._tag === "Failure") {
    console.error(eventResult.error);
    return failure("Failed to create event record");
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
): Promise<Person[]> => {
  const result = await DatabaseEventService.getApprovers(eventId);
  return result._tag === "Success" ? result.value : [];
};

/**
 * Gets only applicants list for an event.
 * Optimized function that fetches only applicant data without full event object.
 * @param eventId - The unique identifier for the event.
 * @returns Promise<Person[]> - Array of applicant persons with publicIds.
 */
export const fetchEventApplicants = async (
  eventId: string
): Promise<Person[]> => {
  const result = await DatabaseEventService.getApplicants(eventId);
  return result._tag === "Success" ? result.value : [];
};

/**
 * Gets event with full details including all populated fields.
 * @param eventId - The unique identifier for the event.
 * @returns Promise<Event | null> - Event with all relationships populated or null.
 */
export const getEventWithDetails = async (
  eventId: string
): Promise<Event | null> => {
  const result = await DatabaseEventService.findWithAllDetails(eventId);
  return result._tag === "Success" ? result.value : null;
};

/**
 * Gets all events from the database.
 * @returns Promise<Event[]> - Array of all events.
 */
export const fetchAllEvents = async (): Promise<Event[]> => {
  const result = await DatabaseEventService.findAll();
  return result._tag === "Success" ? result.value : [];
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
