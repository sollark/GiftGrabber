import { failure, success, Result } from "@/utils/fp";
import EventModel, { Event } from "@/database/models/event.model";
import GiftModel from "@/database/models/gift.model";
import PersonModel, { Person } from "@/database/models/person.model";
import { CreateEventData, EventFormData } from "@/types/common.types";

/**
 * Validates that an event exists.
 * @param event - The Event object or null.
 * @returns Result<Event, string> - Success if event exists, failure otherwise.
 */
export const validateEventExists = (
  event: Event | null
): Result<Event, string> => {
  return event ? success(event) : failure("Event not found");
};

/**
 * Creates person records for a list of person data (applicants or approvers).
 * @param personList - Array of person objects without _id.
 * @returns Promise<string[]> - Array of created person IDs as strings.
 */
export const createPersonList = async (
  personList: Person[]
): Promise<string[]> => {
  return Promise.all(
    personList.map(async (person) => {
      const personDoc = await PersonModel.create(person);
      return personDoc._id.toString();
    })
  );
};

/**
 * Creates gift records for a list of applicant IDs.
 * @param applicantIds - Array of applicant IDs.
 * @returns Promise<string[]> - Array of created gift IDs as strings.
 */
export const createGiftList = async (
  applicantIds: string[]
): Promise<string[]> => {
  return Promise.all(
    applicantIds.map(async (applicantId) => {
      const giftDoc = await GiftModel.create({
        owner: applicantId,
        applicant: null,
        order: null,
      });
      return giftDoc._id.toString();
    })
  );
};

/**
 * Creates the actual event record in the database.
 * @param eventData - Object containing all event creation fields and related IDs.
 * @returns Promise<Event> - The created Event document.
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

  let applicantIds: string[] = [];
  let approverIds: string[] = [];
  let giftIds: string[] = [];

  try {
    applicantIds = await createPersonList(applicantList);
    approverIds = await createPersonList(approverList);
  } catch (error) {
    console.error(error);
    return failure("Failed to create applicants or approvers");
  }

  try {
    giftIds = await createGiftList(applicantIds);
  } catch (error) {
    console.error(error);
    return failure("Failed to create gifts");
  }

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

  try {
    const newEvent = await createEventRecord(eventData);
    return success(Boolean(newEvent));
  } catch (error) {
    console.error(error);
    return failure("Failed to create event record");
  }
};

/**
 * Gets event with populated applicants for service layer.
 * @param eventId - The unique identifier for the event.
 * @param selectFields - Fields to select from the event.
 * @returns Promise<Event | null> - Event with populated applicants or null.
 */
export const getEventWithApplicants = async (
  eventId: string,
  selectFields: Record<string, number>
): Promise<Event | null> => {
  const event = await EventModel.findOne({ eventId }, selectFields);
  if (!event) return null;

  return await event.populate({
    path: "applicantList",
    model: "Person",
    select: "firstName lastName employeeId personId sourceFormat",
  });
};

/**
 * Gets event with populated approvers for service layer.
 * @param eventId - The unique identifier for the event.
 * @param selectFields - Fields to select from the event.
 * @returns Promise<Event | null> - Event with populated approvers or null.
 */
export const getEventWithApprovers = async (
  eventId: string,
  selectFields: Record<string, number>
): Promise<Event | null> => {
  const event = await EventModel.findOne({ eventId }, selectFields);
  if (!event) return null;

  return await event.populate({
    path: "approverList",
    model: "Person",
    select: "firstName lastName employeeId personId sourceFormat",
  });
};

/**
 * Gets event with full details including all populated fields.
 * @param eventId - The unique identifier for the event.
 * @param selectFields - Fields to select from the event.
 * @returns Promise<Event | null> - Event with all relationships populated or null.
 */
export const getEventWithDetails = async (
  eventId: string,
  selectFields: Record<string, number>
): Promise<Event | null> => {
  const event = await EventModel.findOne({ eventId }, selectFields);
  if (!event) return null;

  const populatedEvent = await event.populate([
    {
      path: "applicantList",
      model: "Person",
      select: "firstName lastName",
    },
    {
      path: "giftList",
      model: "Gift",
      select: "owner applicant order",
      populate: {
        path: "owner",
        model: "Person",
        select: "firstName lastName",
      },
    },
    {
      path: "approverList",
      model: "Person",
      select: "firstName lastName",
    },
  ]);

  return populatedEvent;
};

/**
 * Gets all events from the database.
 * @returns Promise<Event[]> - Array of all events.
 */
export const getAllEvents = async (): Promise<Event[]> => {
  return await EventModel.find();
};

/**
 * Helper to serialize any object for safe JSON transmission.
 * @param data - The data to serialize.
 * @returns Serialized object.
 */
export const parseEventData = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};
