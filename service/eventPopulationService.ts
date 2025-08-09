export const populateEventApplicants = async (query: any) => {
  return query.populate({
    path: "applicantList",
    model: "Person",
    select: "firstName lastName",
  });
};

export const populateEventApprovers = async (query: any) => {
  return query.populate({
    path: "approverList",
    model: "Person",
    select: "firstName lastName",
  });
};

export const populateEvent = async (query: any) => {
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
