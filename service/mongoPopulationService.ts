/**
 * MongoPopulationService - Updated for PersonDoc schema changes
 * Handles population of related documents with proper field selection
 * All Person fields now included: firstName, lastName, employeeId, personId, sourceFormat
 */

/**
 * Standard Person field selection for consistent population across all functions
 */
const PERSON_SELECT_FIELDS =
  "firstName lastName employeeId personId sourceFormat";

/**
 * Populates the applicantList field of an event query with Person documents.
 * Updated to include all Person fields after PersonDoc schema changes.
 * @param query - Mongoose query for Event
 * @returns Promise<Event> - Event with populated applicantList
 */
export const populateEventApplicants = async (query: any): Promise<any> => {
  return query.populate({
    path: "applicantList",
    model: "Person",
    select: PERSON_SELECT_FIELDS,
  });
};

/**
 * Populates the approverList field of an event query with Person documents.
 * Updated to include all Person fields after PersonDoc schema changes.
 * @param query - Mongoose query for Event
 * @returns Promise<Event> - Event with populated approverList
 */
export const populateEventApprovers = async (query: any): Promise<any> => {
  return query.populate({
    path: "approverList",
    model: "Person",
    select: PERSON_SELECT_FIELDS,
  });
};

/**
 * Populates all related fields (applicantList, giftList, approverList) of an event query.
 * Updated to include all Person fields after PersonDoc schema changes.
 * @param query - Mongoose query for Event
 * @returns Promise<Event> - Event with all relationships populated
 */
export const populateEvent = async (query: any): Promise<any> => {
  return query
    .populate({
      path: "applicantList",
      select: PERSON_SELECT_FIELDS,
    })
    .populate({
      path: "giftList",
      select: "owner receiver order",
      populate: {
        path: "owner",
        model: "Person",
        select: PERSON_SELECT_FIELDS,
      },
    })
    .populate({
      path: "approverList",
      select: PERSON_SELECT_FIELDS,
    });
};

/**
 * Populates only the gift list with owner information for performance optimization.
 * Useful when only gift data is needed without full event population.
 * @param query - Mongoose query for Event
 * @returns Promise<Event> - Event with populated giftList only
 */
export const populateEventGifts = async (query: any): Promise<any> => {
  return query.populate({
    path: "giftList",
    select: "owner receiver order",
    populate: {
      path: "owner",
      model: "Person",
      select: PERSON_SELECT_FIELDS,
    },
  });
};
