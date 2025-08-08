"use server";

import EventModel, { Event } from "@/database/models/event.model";
import GiftModel from "@/database/models/gift.model";
import PersonModel, { Person } from "@/database/models/person.model";
import {
  withDatabase,
  withDatabaseBoolean,
  withDatabaseNullable,
  withDatabaseArray,
} from "@/lib/withDatabase";
import { handleError } from "@/lib/fp-utils";

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
 * Creates a new event with associated applicants, approvers, and gifts
 * @param event - The event form data containing all necessary information
 * @returns Promise<boolean> - True if event was created successfully, undefined on error
 */
const createEventInternal = async (
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
    const applicantIds = await createPersonList(applicantList);
    const approverIds = await createPersonList(approverList);
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
    console.log(LOG_MESSAGES.EVENT_CREATED, newEvent);

    return Boolean(newEvent);
  } catch (error) {
    console.log(ERROR_MESSAGES.CREATE_EVENT);
    handleError(error);
  }
};

export const createEvent = withDatabaseBoolean(createEventInternal);

/**
 * Gets event applicants with populated data
 * @param eventId - The unique identifier for the event
 * @returns Promise<Event | undefined> - Event with populated applicants or undefined on error
 */
const getEventApplicantsInternal = async (
  eventId: string
): Promise<Event | undefined> => {
  try {
    const event = await populateEventApplicants(
      EventModel.findOne({ eventId }, EVENT_CONFIG.QUERY_FIELDS.APPLICANTS)
    );

    if (!event) {
      throw new Error(ERROR_MESSAGES.EVENT_NOT_FOUND);
    }

    return parseEventData(event);
  } catch (error) {
    console.log(ERROR_MESSAGES.GET_EVENT_APPLICANTS);
    handleError(error);
  }
};

export const getEventApplicants = withDatabase(getEventApplicantsInternal);

/**
 * Gets event approvers list
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

export const getEventApprovers = withDatabaseArray(getEventApproversInternal);

/**
 * Gets complete event details with all populated relationships
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

export const getEventDetails = withDatabaseNullable(getEventDetailsInternal);

/**
 * Gets all events from the database
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

export const getAllEvents = withDatabase(getAllEventsInternal);

/**
 * Populates event with applicant data
 * @param query - Mongoose query to execute
 * @returns Promise with populated applicant data
 */
const populateEventApplicants = async (query: any) => {
  return query.populate({
    path: "applicantList",
    model: "Person",
    select: EVENT_CONFIG.POPULATE_FIELDS.PERSON_SELECT,
  });
};

/**
 * Populates event with approver data
 * @param query - Mongoose query to execute
 * @returns Promise with populated approver data
 */
const populateEventApprovers = async (query: any) => {
  return query.populate({
    path: "approverList",
    model: "Person",
    select: EVENT_CONFIG.POPULATE_FIELDS.PERSON_SELECT,
  });
};

/**
 * Populates event with complete relationship data
 * @param query - Mongoose query to execute
 * @returns Promise with fully populated event data
 */
const populateEvent = async (query: any) => {
  return query
    .populate({
      path: "applicantList",
      select: EVENT_CONFIG.POPULATE_FIELDS.PERSON_SELECT,
    })
    .populate({
      path: "giftList",
      select: EVENT_CONFIG.POPULATE_FIELDS.GIFT_SELECT,
      populate: {
        path: "owner",
        model: "Person",
      },
    })
    .populate({
      path: "approverList",
      select: EVENT_CONFIG.POPULATE_FIELDS.PERSON_SELECT,
    });
};

// Helper Functions

/**
 * Creates person records for a list of person data
 * @param personList - Array of person data without IDs
 * @returns Promise<string[]> - Array of created person IDs
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
 * Creates gift records for a list of applicant IDs
 * @param applicantIds - Array of applicant person IDs
 * @returns Promise<string[]> - Array of created gift IDs
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
 * Creates the actual event record in the database
 * @param eventData - The complete event data with IDs
 * @returns Promise<Event> - The created event document
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
 * Parses and serializes event data for client consumption
 * @param data - The event data to parse
 * @returns Parsed event data safe for client use
 */
const parseEventData = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};
