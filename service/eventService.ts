import { failure, success, Result } from "@/utils/fp";
import EventModel, { Event } from "@/database/models/event.model";
import GiftModel from "@/database/models/gift.model";
import PersonModel from "@/database/models/person.model";

import {
  PersonWithoutId,
  CreateEventData,
  EventFormData,
} from "@/types/common.types";

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
 * Creates gift records for a list of applicant IDs.
 * @param applicantIds - Array of applicant IDs.
 * @returns Promise<string[]> - Array of created gift IDs as strings.
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
 * Creates applicants and approvers, returning their IDs.
 * @param applicantList - Array of applicant objects.
 * @param approverList - Array of approver objects.
 * @returns Promise<{ applicantIds: string[]; approverIds: string[] }>
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
    const result = await createApplicantsAndApprovers(
      applicantList,
      approverList
    );
    applicantIds = result.applicantIds;
    approverIds = result.approverIds;
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
