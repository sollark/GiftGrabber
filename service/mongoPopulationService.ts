/**
 * Populates the applicantList field of an event query with Person documents.
 * @param query - Mongoose query for Event
 * @returns Promise<Event> - Event with populated applicantList
 */
export const populateEventApplicants = async (query: any): Promise<any> => {
  return query.populate({
    path: "applicantList",
    model: "Person",
    select: "firstName lastName",
  });
};

/**
 * Populates the approverList field of an event query with Person documents.
 * @param query - Mongoose query for Event
 * @returns Promise<Event> - Event with populated approverList
 */
export const populateEventApprovers = async (query: any): Promise<any> => {
  return query.populate({
    path: "approverList",
    model: "Person",
    select: "firstName lastName",
  });
};

/**
 * Populates all related fields (applicantList, giftList, approverList) of an event query.
 * @param query - Mongoose query for Event
 * @returns Promise<Event> - Event with all relationships populated
 */
export const populateEvent = async (query: any): Promise<any> => {
  return query
    .populate({
      path: "applicantList",
      select: "firstName lastName",
    })
    .populate({
      path: "giftList",
      select: "owner receiver order",
      populate: {
        path: "owner",
        model: "Person",
      },
    })
    .populate({
      path: "approverList",
      select: "firstName lastName",
    });
};
