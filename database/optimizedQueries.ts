/**
 * Optimized Database Query Patterns - Issue D Fix
 *
 * This service provides optimized query patterns that replace inefficient
 * database access patterns found throughout the codebase.
 *
 * Key optimizations:
 * - Batch queries instead of N+1 patterns
 * - Lean queries for read-only operations
 * - Aggregation pipelines for complex data
 * - Proper field selection
 * - Connection pooling awareness
 */

import { Result, success, failure, fromPromise } from "@/utils/fp";
import EventModel from "@/database/models/event.model";
import PersonModel from "@/database/models/person.model";
import GiftModel from "@/database/models/gift.model";
import OrderModel from "@/database/models/order.model";
import { PUBLIC_FIELD_SELECTIONS } from "../service/databaseConstants";

// ============================================================================
// BATCH QUERY OPTIMIZATIONS
// ============================================================================

/**
 * Efficiently finds multiple persons by their publicIds in a single query.
 * Replaces N+1 pattern of individual Person.findOne calls.
 */
export const findPersonsByPublicIds = async (
  publicIds: string[]
): Promise<Result<any[], Error>> => {
  if (publicIds.length === 0) {
    return success([]);
  }

  return fromPromise(
    PersonModel.find(
      { publicId: { $in: publicIds } },
      PUBLIC_FIELD_SELECTIONS.PERSON
    )
      .lean() // Read-only optimization
      .exec()
  );
};
/**
 * Efficiently finds multiple gifts by their publicIds in a single query.
 * Includes populated owner information.
 */
export const findGiftsByPublicIds = async (
  publicIds: string[]
): Promise<Result<any[], Error>> => {
  if (publicIds.length === 0) {
    return success([]);
  }

  return fromPromise(
    GiftModel.find(
      { publicId: { $in: publicIds } },
      PUBLIC_FIELD_SELECTIONS.GIFT
    )
      .populate({
        path: "owner",
        select: PUBLIC_FIELD_SELECTIONS.PERSON,
      })
      .lean()
      .exec()
  );
};

/**
 * Batch find events by multiple eventIds with optional population.
 */
export const findEventsByEventIds = async (
  eventIds: string[],
  populate: boolean = false
): Promise<Result<any[], Error>> => {
  if (eventIds.length === 0) {
    return success([]);
  }

  let query = EventModel.find(
    { eventId: { $in: eventIds } },
    PUBLIC_FIELD_SELECTIONS.EVENT
  );

  if (populate) {
    query = query.populate({
      path: "applicantList",
      select: PUBLIC_FIELD_SELECTIONS.PERSON,
    });
  }

  return fromPromise(query.lean().exec());
};

// ============================================================================
// AGGREGATION PIPELINE OPTIMIZATIONS
// ============================================================================

/**
 * Gets comprehensive event statistics using aggregation pipeline.
 * More efficient than multiple separate queries.
 */
export const getEventStatistics = async (
  eventId: string
): Promise<Result<any, Error>> => {
  try {
    const pipeline = [
      { $match: { eventId } },
      {
        $lookup: {
          from: "gifts",
          localField: "giftList",
          foreignField: "_id",
          as: "gifts",
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "applicant",
          as: "orders",
        },
      },
      {
        $project: {
          totalApplicants: { $size: "$applicantList" },
          totalGifts: { $size: "$giftList" },
          availableGifts: {
            $size: {
              $filter: {
                input: "$gifts",
                cond: { $eq: ["$$this.applicant", null] },
              },
            },
          },
          pendingOrders: {
            $size: {
              $filter: {
                input: "$orders",
                cond: { $eq: ["$$this.status", "pending"] },
              },
            },
          },
          completedOrders: {
            $size: {
              $filter: {
                input: "$orders",
                cond: { $eq: ["$$this.status", "completed"] },
              },
            },
          },
        },
      },
    ];

    const result = await EventModel.aggregate(pipeline).exec();

    if (result.length === 0) {
      return failure(new Error("Event not found"));
    }

    return success(result[0]);
  } catch (error) {
    return failure(error as Error);
  }
};

/**
 * Gets order analytics using aggregation pipeline.
 * Provides insights into order patterns and performance.
 */
export const getOrderAnalytics = async (): Promise<Result<any, Error>> => {
  try {
    const pipeline = [
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          ordersByStatus: {
            $push: "$status",
          },
          avgTime: {
            $avg: {
              $cond: {
                if: { $ne: ["$confirmedAt", null] },
                then: { $subtract: ["$confirmedAt", "$createdAt"] },
                else: null,
              },
            },
          },
        },
      },
    ];

    const result = await OrderModel.aggregate(pipeline).exec();

    if (result.length === 0) {
      return success({
        totalOrders: 0,
        ordersByStatus: {},
        averageOrderTime: 0,
      });
    }

    // Process status counts
    const statusCounts: Record<string, number> = {};
    result[0].ordersByStatus.forEach((status: string) => {
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return success({
      totalOrders: result[0].totalOrders,
      ordersByStatus: statusCounts,
      averageOrderTime: result[0].avgTime || 0,
    });
  } catch (error) {
    return failure(error as Error);
  }
};

// ============================================================================
// LEAN QUERY OPTIMIZATIONS
// ============================================================================

/**
 * Lightweight event lookup that only fetches essential fields.
 * Use for listing or basic validation.
 */
export const findEventBasicInfo = async (
  eventId: string
): Promise<Result<any, Error>> => {
  return fromPromise(
    EventModel.findOne(
      { eventId },
      { publicId: 1, eventId: 1, name: 1, ownerId: 1 }
    )
      .lean()
      .exec()
  );
};

/**
 * Lightweight person lookup for autocomplete/search.
 */
export const findPersonsForAutocomplete = async (
  searchTerm: string,
  limit: number = 10
): Promise<Result<any[], Error>> => {
  const regex = new RegExp(searchTerm, "i");

  return fromPromise(
    PersonModel.find(
      {
        $or: [
          { firstName: { $regex: regex } },
          { lastName: { $regex: regex } },
          { employeeId: { $regex: regex } },
        ],
      },
      { publicId: 1, firstName: 1, lastName: 1 }
    )
      .lean()
      .limit(limit)
      .exec()
  );
};

// ============================================================================
// PAGINATION OPTIMIZATIONS
// ============================================================================

/**
 * Paginated event listing with proper sorting and field selection.
 */
export const findEventsPaginated = async (
  page: number = 1,
  limit: number = 20,
  sortBy: string = "eventId",
  sortOrder: "asc" | "desc" = "desc"
): Promise<Result<any, Error>> => {
  try {
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [events, total] = await Promise.all([
      EventModel.find({}, PUBLIC_FIELD_SELECTIONS.EVENT)
        .sort(sort as any)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      EventModel.countDocuments({}).exec(),
    ]);

    return success({
      events,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return failure(error as Error);
  }
};

/**
 * Paginated order listing with filtering and sorting.
 */
export const findOrdersPaginated = async (
  filters: {
    status?: string;
    applicantPublicId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  } = {},
  page: number = 1,
  limit: number = 20
): Promise<Result<any, Error>> => {
  try {
    const skip = (page - 1) * limit;

    // Build filter query
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
    }

    // Handle applicant filter (requires ObjectId lookup)
    if (filters.applicantPublicId) {
      const applicant = await PersonModel.findOne(
        { publicId: filters.applicantPublicId },
        "_id"
      )
        .lean()
        .exec();

      let applicantId: any = null;
      if (Array.isArray(applicant) && applicant.length > 0) {
        applicantId = applicant[0]._id;
      } else if (
        applicant &&
        typeof applicant === "object" &&
        "_id" in applicant
      ) {
        applicantId = applicant._id;
      }
      if (applicantId) {
        query.applicant = applicantId;
      } else {
        // If applicant not found, return empty results
        return success({
          orders: [],
          total: 0,
          page,
          pages: 0,
        });
      }
    }

    const [orders, total] = await Promise.all([
      OrderModel.find(query, PUBLIC_FIELD_SELECTIONS.ORDER)
        .populate({
          path: "applicant",
          select: PUBLIC_FIELD_SELECTIONS.PERSON,
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      OrderModel.countDocuments(query).exec(),
    ]);

    return success({
      orders,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return failure(error as Error);
  }
};

// ============================================================================
// CONNECTION POOLING AWARENESS
// ============================================================================

/**
 * Executes multiple independent queries in parallel.
 * Takes advantage of connection pooling for better performance.
 */
export const executeParallelQueries = async <T extends Record<string, any>>(
  queries: Record<keyof T, () => Promise<any>>
): Promise<Result<T, Error>> => {
  try {
    const queryNames = Object.keys(queries) as Array<keyof T>;
    const queryPromises = queryNames.map((name) => queries[name]());

    const results = await Promise.all(queryPromises);

    const combinedResults = {} as T;
    queryNames.forEach((name, index) => {
      combinedResults[name] = results[index];
    });

    return success(combinedResults);
  } catch (error) {
    return failure(error as Error);
  }
};
