"use server";

import EventModel, { Event } from "@/database/models/event.model";
import PersonModel, { Person } from "@/database/models/person.model";
import GiftModel from "@/database/models/gift.model";
import { createEventInternal } from "@/service/eventService";
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
import {
  PersonWithoutId,
  EventForm,
  CreateEventData,
} from "@/types/event.types";

/**
 * Creates a new event with associated applicants, approvers, and gifts
 * @param event - The event form data containing all necessary information
 * @returns Promise<boolean> - True if event was created successfully, undefined on error
 */

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

import {
  populateEventApplicants,
  populateEventApprovers,
  populateEvent,
} from "@/service/eventPopulationService";

// Helper Functions

/**
 * Creates person records for a list of person data (applicants or approvers).
 * Pure function: only creates and returns IDs.
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
 * Pure function: only creates and returns gift IDs.
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
 * Pure function: only creates and returns the event document.
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

import { parseEventData } from "@/utils/parseEventData";
