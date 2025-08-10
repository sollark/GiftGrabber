/**
 * Logs event-related errors
 */
const logEventError = (message: string): void => {
  console.log(message);
};

/**
 * Logs event retrieval start
 */
const logEventRetrieval = (): void => {
  console.log(LOG_MESSAGES.GET_EVENT_DETAILS);
};
/**
 * @file event.action.ts
 * @description Server-side actions and data access logic for event operations in GiftGrabber.
 * Handles event creation, querying, and population of related data (applicants, approvers, gifts).
 * Exports functions for use in API routes and server components.
 */
("use server");

import { parseEventData } from "@/utils/parseEventData";
import EventModel, { Event } from "@/database/models/event.model";
import PersonModel, { Person } from "@/database/models/person.model";
import GiftModel from "@/database/models/gift.model";
import {
  createEventInternal,
  validateEventExists,
} from "@/service/eventService";
import {
  withDatabase,
  withDatabaseBoolean,
  withDatabaseNullable,
  withDatabaseArray,
} from "@/lib/withDatabase";
import { failure, handleError, Result, success } from "@/lib/fp-utils";

/**
 * Configuration constants for event operations
 */
const EVENT_CONFIG = {
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
  POPULATE_FIELDS: {
    PERSON_SELECT: "firstName lastName",
    GIFT_SELECT: "owner receiver order",
  },
} as const;

/**
 * Log messages for event operations
 */
const LOG_MESSAGES = {
  EVENT_CREATED: "newEvent created:",
  GET_EVENT_DETAILS: "getEventDetails, eventId:",
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
} as const;

/**
 * Type definitions for improved type safety
 */
import {
  PersonWithoutId,
  EventForm,
  CreateEventData,
} from "@/types/event.types";

/**
 * Creates a new event with associated applicants, approvers, and gifts.
 * Orchestrates creation of persons, gifts, and event record in the database.
 * @param event - The event form data containing all necessary information
 * @returns Promise<boolean | undefined> - True if event was created successfully, undefined on error
 */
export const createEvent = withDatabaseBoolean(createEventInternal);

/**
 * Fetches event applicants with populated applicant data.
 * @param eventId - The unique identifier for the event
 * @returns Result<Event, Error> - Success with Event or Failure with Error
 *
 * How to use it:
 * const result = await getEventApplicantsInternal("abc123");
 * if (result.isFailure()) {
 * console.error("Failed to fetch applicants:", result.error);
 * // decide: show error to user, retry, etc.
 * } else {
 * const event = result.value;
 * console.log("Got event:", event);}
 */

export const getEventApplicantsInternal = async (
  eventId: string
): Promise<Result<Event, Error>> => {
  try {
    const event = await populateEventApplicants(
      EventModel.findOne({ eventId }, EVENT_CONFIG.QUERY_FIELDS.APPLICANTS)
    );

    // Use a validation function for existence
    const validationResult = validateEventExists(event);
    if (validationResult._tag === "Failure") {
      const err = new Error(validationResult.error);
      logEventError(err.message);
      return failure(err);
    }

    return success(parseEventData(validationResult.value));
  } catch (error) {
    logEventError(ERROR_MESSAGES.GET_EVENT_APPLICANTS);
    return handleError(error as Error);
  }
};

/**
 * Action: Gets event applicants with populated data for use in API/server components.
 */
export const getEventApplicants = withDatabase(getEventApplicantsInternal);

/**
 * Fetches event approvers list with populated approver data.
 * @param eventId - The unique identifier for the event
 * @returns Promise<Person[]> - Array of approver persons or empty array on error
 */
const getEventApproversInternal = async (
  eventId: string
): Promise<Person[]> => {
  try {
    const event = await populateEventApprovers(
      EventModel.findOne({ eventId }, EVENT_CONFIG.QUERY_FIELDS.APPROVERS)
    );
    if (!event) {
      throw new Error(ERROR_MESSAGES.EVENT_NOT_FOUND);
    }
    return parseEventData(event.approverList);
  } catch (error) {
    console.log(ERROR_MESSAGES.GET_EVENT_APPROVERS);
    handleError(error);
    return [];
  }
};

/**
 * Action: Gets event approvers list for use in API/server components.
 */
export const getEventApprovers = withDatabaseArray(getEventApproversInternal);

/**
 * Fetches complete event details with all populated relationships (applicants, gifts, approvers).
 * @param eventId - The unique identifier for the event
 * @returns Promise<Event | null> - Complete event data or null on error
 */
const getEventDetailsInternal = async (
  eventId: string
): Promise<Event | null> => {
  try {
    console.log(LOG_MESSAGES.GET_EVENT_DETAILS, eventId);
    const event = await populateEvent(
      EventModel.findOne({ eventId }, EVENT_CONFIG.QUERY_FIELDS.DETAILS)
    );
    if (!event) {
      throw new Error(ERROR_MESSAGES.EVENT_NOT_FOUND);
    }
    return parseEventData(event);
  } catch (error) {
    console.log(ERROR_MESSAGES.GET_EVENT_DETAILS);
    handleError(error);
    return null;
  }
};

/**
 * Action: Gets complete event details for use in API/server components.
 */
export const getEventDetails = withDatabaseNullable(getEventDetailsInternal);

/**
 * Fetches all events from the database.
 * @returns Promise<Event[] | undefined> - Array of all events or undefined on error
 */
const getAllEventsInternal = async (): Promise<Event[] | undefined> => {
  try {
    const events = await EventModel.find();
    return parseEventData(events);
  } catch (error) {
    console.log(ERROR_MESSAGES.GET_ALL_EVENTS);
    handleError(error);
  }
};

/**
 * Action: Gets all events for use in API/server components.
 */
export const getAllEvents = withDatabase(getAllEventsInternal);

import {
  populateEventApplicants,
  populateEventApprovers,
  populateEvent,
} from "@/service/eventPopulationService";

// Helper Functions

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
