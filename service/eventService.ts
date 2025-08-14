import { failure, success, Result } from "@/utils/fp";

/**
 * Validates that an event exists.
 * Returns Result<Event, string>.
 * @param event - The Event object or null.
 * @returns Result indicating success or failure.
 */
export const validateEventExists = (
  event: Event | null
): Result<Event, string> => {
  return event ? success(event) : failure("Event not found");
};

/**
 * @file eventService.ts
 * @description Service layer for event creation logic in GiftGrabber.
 * Contains helpers and orchestration functions for creating persons, gifts, and event records.
 * Used by server actions to modularize business logic and database operations.
 */
import EventModel, { Event } from "@/database/models/event.model";
import GiftModel from "@/database/models/gift.model";
import PersonModel, { Person } from "@/database/models/person.model";
import { handleError } from "@/utils/fp";

type PersonWithoutId = Omit<Person, "_id">;
type EventForm = Omit<
  Event,
  "_id" | "giftList" | "applicantList" | "approverList"
> & {
  applicantList: PersonWithoutId[];
  approverList: PersonWithoutId[];
};

interface CreateEventData {
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
 * Helper: Creates person records for a list of person data (applicants or approvers).
 * @param personList - Array of person objects without _id
 * @returns Promise resolving to array of created person IDs (as strings)
 * @remarks
 * Used for batch creation of applicants/approvers. Pure function: only creates and returns IDs.
 */
const createPersonList = async (
  personList: PersonWithoutId[]
): Promise<string[]> => {
  return Promise.all(
    personList.map(async (person) => {
      const personDoc = await PersonModel.create(person);
      return personDoc._id.toString();
    })
  );
};

/**
 * Helper: Creates gift records for a list of applicant IDs.
 * @param applicantIds - Array of applicant IDs
 * @returns Promise resolving to array of created gift IDs (as strings)
 * @remarks
 * Used for batch creation of gifts for each applicant. Pure function: only creates and returns IDs.
 */
const createGiftList = async (applicantIds: string[]): Promise<string[]> => {
  return Promise.all(
    applicantIds.map(async (applicantId) => {
      const giftDoc = await GiftModel.create({ owner: applicantId });
      return giftDoc._id.toString();
    })
  );
};

/**
 * Helper: Creates the actual event record in the database.
 * @param eventData - Object containing all event creation fields and related IDs
 * @returns Promise resolving to the created Event document
 * @remarks
 * Used after all related persons and gifts are created. Pure function: only creates and returns the event document.
 */
const createEventRecord = async (
  eventData: CreateEventData
): Promise<Event> => {
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
  return EventModel.create({
    name,
    email,
    eventId,
    ownerId,
    eventQRCodeBase64,
    ownerIdQRCodeBase64,
    applicantList: applicantIds,
    giftList: giftIds,
    approverList: approverIds,
  });
};

/**
 * Orchestrator: Creates applicants and approvers, returning their IDs.
 * @param applicantList - Array of applicant objects
 * @param approverList - Array of approver objects
 * @returns Promise resolving to object with applicantIds and approverIds
 * @remarks
 * Used by event creation workflow to batch-create related persons.
 */
export const createApplicantsAndApprovers = async (
  applicantList: PersonWithoutId[],
  approverList: PersonWithoutId[]
): Promise<{ applicantIds: string[]; approverIds: string[] }> => {
  const applicantIds = await createPersonList(applicantList);
  const approverIds = await createPersonList(approverList);
  return { applicantIds, approverIds };
};

/**
 * Orchestrator: Creates a new event with all related applicants, approvers, and gifts.
 * @param event - The event form data containing all necessary information
 * @returns Promise<boolean | undefined> - True if event was created successfully, undefined on error
 * @remarks
 * Main entry point for event creation. Handles all related entity creation and error handling.
 */
export const createEventInternal = async (
  event: EventForm
): Promise<boolean | undefined> => {
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
  try {
    const { applicantIds, approverIds } = await createApplicantsAndApprovers(
      applicantList,
      approverList
    );
    const giftIds = await createGiftList(applicantIds);
    const eventData: CreateEventData = {
      name,
      email,
      eventId,
      ownerId,
      eventQRCodeBase64,
      ownerIdQRCodeBase64,
      applicantIds,
      giftIds,
      approverIds,
    };
    const newEvent = await createEventRecord(eventData);
    return Boolean(newEvent);
  } catch (error) {
    handleError(error);
  }
};
