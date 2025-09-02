/**
 * MongoPopulationService - Updated for PublicId Strategy
 * Handles population of related documents with proper field selection
 * All Person fields now include publicId and exclude _id for security
 */

import { PUBLIC_FIELD_SELECTIONS } from "./databaseConstants";

/**
 * Standard Person field selection for consistent population across all functions
 * Updated to include publicId and exclude _id
 */
const PERSON_SELECT_FIELDS = PUBLIC_FIELD_SELECTIONS.PERSON;

/**
 * Standard Gift field selection for population
 */
const GIFT_SELECT_FIELDS = PUBLIC_FIELD_SELECTIONS.GIFT;

/**
 * Populates the applicantList field of an event query with Person documents.
 * Updated to include all Person fields after PersonDoc schema changes.
 * @param query - Mongoose query for Event
 * @returns Mongoose query with populated applicantList
 */
export const populateEventApplicants = (query: any): any => {
  return query.populate({
    path: "applicantList",
    model: "Person",
    select: PERSON_SELECT_FIELDS,
  });
};

/**
 * Populates all related fields (applicantList, giftList) of an event query.
 * Updated to include all Person fields after PersonDoc schema changes.
 * @param query - Mongoose query for Event
 * @returns Mongoose query with all relationships populated
 */
export const populateEvent = (query: any): any => {
  return query
    .populate({
      path: "applicantList",
      select: PERSON_SELECT_FIELDS,
    })
    .populate({
      path: "giftList",
      select: GIFT_SELECT_FIELDS,
      populate: {
        path: "owner",
        model: "Person",
        select: PERSON_SELECT_FIELDS,
      },
    });
};

/**
 * Populates only the gift list with owner information for performance optimization.
 * Useful when only gift data is needed without full event population.
 * @param query - Mongoose query for Event
 * @returns Mongoose query with populated giftList only
 */
export const populateEventGifts = (query: any): any => {
  return query.populate({
    path: "giftList",
    select: GIFT_SELECT_FIELDS,
    populate: {
      path: "owner",
      model: "Person",
      select: PERSON_SELECT_FIELDS,
    },
  });
};

/**
 * Populates order query with all related fields (applicant, gifts, confirmedBy).
 * Uses PublicId field selections for security and consistency.
 * @param query - Mongoose query for Order
 * @returns Mongoose query with all relationships populated
 */
export const populateOrder = (query: any): any => {
  return query
    .populate({
      path: "applicant",
      select: PERSON_SELECT_FIELDS,
    })
    .populate({
      path: "gifts",
      select: GIFT_SELECT_FIELDS,
      populate: {
        path: "owner",
        model: "Person",
        select: PERSON_SELECT_FIELDS,
      },
    })
    .populate({
      path: "confirmedBy",
      select: PERSON_SELECT_FIELDS,
    });
};
