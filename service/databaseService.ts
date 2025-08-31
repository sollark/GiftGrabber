/**
 * databaseService.ts
 *
 * Purpose:
 *   Centralized database abstraction layer for all Person, Event, Gift, and Order operations.
 *   Enforces publicId security, type-safe error handling, and consistent field selection.
 *
 * Main Responsibilities:
 *   - Exposes service classes (PersonService, EventService, GiftService, OrderService) as the public API for all business logic and server actions.
 *   - Handles all CRUD, batch, and relationship operations for core entities.
 *   - Implements the Result<T, E> pattern for predictable, type-safe error handling.
 *   - Ensures all queries use publicId (never exposes MongoDB _id to business logic).
 *   - Delegates to optimizedQueries.ts for batch, aggregation, and performance-critical queries (see notes below).
 *   - Provides utility functions for serialization and ID conversion.
 *
 * Architectural Role:
 *   - The only layer that should access the database directly from business logic or API routes.
 *   - Orchestrates and composes lower-level query utilities for performance and DRYness.
 *   - Maintains security and business rules at the data access boundary.
 *
 * When does it use optimizedQueries.ts?
 *   - For batch operations (e.g., fetching many persons by publicId, paginated event queries, parallel lookups for event creation).
 *   - For any query that would otherwise result in N+1 patterns or inefficient DB access.
 *   - For aggregation, analytics, or complex data retrieval (delegated to optimizedQueries.ts).
 *   - All such usage is explicit via imports at the top of the file.
 *
 * Business Logic Rules:
 *   - All public APIs use publicId for security (prevents enumeration attacks).
 *   - Batch operations are preferred for performance.
 *   - Population queries select only necessary fields.
 *   - No exceptions are thrown for predictable errors; all errors are returned as Result<T, Error>.
 *
 * Notes:
 *   - This file should not be imported by lower-level utility files to avoid circular dependencies.
 *   - All public API functions are static methods on the exported service classes.
 *   - Internal helpers are marked as private or not exported.
 */

/**
 * Database Service - PublicId Abstraction Layer
 *
 * This service provides a clean abstraction over MongoDB operations,
 * ensuring that only publicId is used in business logic while keeping
 * _id strictly internal to the database layer.
 *
 * Strategy:
 * - All public APIs use publicId
 * - Internal _id queries are encapsulated here
 * - Population queries select publicId instead of _id
 * - Consistent error handling with Result<T, E> pattern
 */

import { Result, success, failure, fromPromise } from "@/utils/fp";
import { Types } from "mongoose";
import EventModel, { Event } from "@/database/models/event.model";
import PersonModel, { Person } from "@/database/models/person.model";
import GiftModel, { Gift } from "@/database/models/gift.model";
import OrderModel, { Order } from "@/database/models/order.model";
import { PUBLIC_FIELD_SELECTIONS } from "./databaseConstants";
import {
  populateEventApplicants,
  populateEventApprovers,
  populateEvent,
} from "./mongoPopulationService";
import {
  findPersonsByPublicIds,
  executeParallelQueries,
  findEventsPaginated,
} from "@/database/optimizedQueries";

// ============================================================================
// CENTRALIZED SERIALIZATION UTILITIES
// ============================================================================

/**
 * Transforms any Mongoose document to a plain object safe for client components.
 * Removes MongoDB-specific fields (_id, __v) and recursively serializes nested objects/arrays.
 *
 * @param data - any - The data to serialize (can be a document, array, or plain object)
 * @returns T - The serialized, client-safe object
 * @sideEffects None
 * @publicAPI
 */
export const serializeForClient = <T = any>(data: any): T => {
  if (!data) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(serializeForClient) as T;
  }

  // Handle Mongoose documents
  if (data.toObject && typeof data.toObject === "function") {
    data = data.toObject();
  }

  // Handle plain objects
  if (data && typeof data === "object") {
    const { _id, __v, ...cleanObj } = data;
    const result: any = {};

    for (const [key, value] of Object.entries(cleanObj)) {
      result[key] = serializeForClient(value);
    }

    return result as T;
  }

  return data as T;
};

// ============================================================================
// CORE PERSON OPERATIONS

/**
 * Population configurations for Mongoose populate() that use publicId and field selection.
 * Used to ensure only publicId and safe fields are exposed in population.
 * @publicAPI
 */
export const POPULATION_CONFIG = {
  PERSON: {
    select: PUBLIC_FIELD_SELECTIONS.PERSON,
  },
  GIFT_WITH_OWNER: {
    path: "owner",
    select: PUBLIC_FIELD_SELECTIONS.PERSON,
  },
  EVENT_APPLICANTS: {
    path: "applicantList",
    select: PUBLIC_FIELD_SELECTIONS.PERSON,
  },
  EVENT_APPROVERS: {
    path: "approverList",
    select: PUBLIC_FIELD_SELECTIONS.PERSON,
  },
  EVENT_GIFTS: {
    path: "giftList",
    select: PUBLIC_FIELD_SELECTIONS.GIFT,
  },
  ORDER_APPLICANT: {
    path: "applicant",
    select: PUBLIC_FIELD_SELECTIONS.PERSON,
  },
  ORDER_GIFTS: {
    path: "gifts",
    select: PUBLIC_FIELD_SELECTIONS.GIFT,
    populate: {
      path: "owner",
      select: PUBLIC_FIELD_SELECTIONS.PERSON,
    },
  },
} as const;

/**
 * PersonService
 * Public API for all person-related database operations.
 * All methods use publicId for security and batch performance.
 */
export class PersonService {
  /**
   * Retrieves a single person by their public identifier.
   * @param publicId {string} - The person's publicId
   * @returns Promise<Result<Person | null, Error>> - Success with person or null, or Failure with error
   * @sideEffects DB read
   * @publicAPI
   */
  static async findByPublicId(
    publicId: string
  ): Promise<Result<Person | null, Error>> {
    return fromPromise(
      PersonModel.findOne({ publicId }, PUBLIC_FIELD_SELECTIONS.PERSON).exec()
    );
  }

  /**
   * Creates a new person with auto-generated publicId.
   * @param personData {Omit<Person, "publicId">} - Person data (publicId auto-generated)
   * @returns Promise<Result<Person, Error>> - Success with created person, or Failure with error
   * @sideEffects DB write
   * @publicAPI
   */
  static async create(
    personData: Omit<Person, "publicId">
  ): Promise<Result<Person, Error>> {
    return fromPromise(
      PersonModel.create(personData).then((doc) =>
        doc.toObject({ transform: this.transformToPublic })
      )
    );
  }

  /**
   * Batch creates multiple persons for optimal performance (Excel import, etc).
   * @param personList {Omit<Person, "publicId">[]} - Array of person data
   * @returns Promise<Result<string[], Error>> - Success with array of publicIds, or Failure with error
   * @sideEffects DB write (batch)
   * @publicAPI
   */
  /**
   * Batch creates multiple persons for optimal performance during Excel imports
   * @param personList - Array of person data objects without publicIds
   * @returns Promise<Result<string[], Error>> - Success with array of generated publicIds, or Failure with error
   */
  static async createMany(
    personList: Omit<Person, "publicId">[]
  ): Promise<Result<string[], Error>> {
    try {
      const docs = await PersonModel.insertMany(personList);
      const publicIds = docs.map((doc) => doc.publicId);
      return success(publicIds);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Batch finds persons by publicIds using optimizedQueries.ts (avoids N+1).
   * @param publicIds {string[]} - Array of publicIds
   * @returns Promise<Result<Person[], Error>> - Success with array of persons, or Failure with error
   * @sideEffects DB read (batch)
   * @publicAPI
   * @notes Uses findPersonsByPublicIds from optimizedQueries.ts for performance.
   */
  static async findManyByPublicIds(
    publicIds: string[]
  ): Promise<Result<Person[], Error>> {
    return findPersonsByPublicIds(publicIds);
  }

  /**
   * Internal helper to transform a document to public format (removes _id, __v).
   * @param doc {any} - The Mongoose document
   * @param ret {any} - The returned object
   * @returns {any} - The transformed object
   * @sideEffects None
   * @private
   */
  private static transformToPublic = (doc: any, ret: any) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  };
}

/**
 * EventService
 * Public API for all event-related database operations.
 * Handles event creation, lookup, population, and batch operations.
 */
export class EventService {
  /**
   * Finds an event by its business eventId (legacy).
   * @param eventId {string}
   * @returns Promise<Result<Event | null, Error>>
   * @sideEffects DB read
   * @publicAPI
   */
  static async findByEventId(
    eventId: string
  ): Promise<Result<Event | null, Error>> {
    return fromPromise(
      EventModel.findOne({ eventId }, PUBLIC_FIELD_SELECTIONS.EVENT).exec()
    );
  }

  /**
   * Finds an event by its publicId.
   * @param publicId {string}
   * @returns Promise<Result<Event | null, Error>>
   * @sideEffects DB read
   * @publicAPI
   */
  static async findByPublicId(
    publicId: string
  ): Promise<Result<Event | null, Error>> {
    return fromPromise(
      EventModel.findOne({ publicId }, PUBLIC_FIELD_SELECTIONS.EVENT).exec()
    );
  }

  /**
   * Finds an event with populated applicants.
   * @param eventId {string}
   * @returns Promise<Result<Event | null, Error>>
   * @sideEffects DB read with population
   * @publicAPI
   */
  static async findWithApplicants(
    eventId: string
  ): Promise<Result<Event | null, Error>> {
    const query = EventModel.findOne(
      { eventId },
      PUBLIC_FIELD_SELECTIONS.EVENT
    );
    return fromPromise(populateEventApplicants(query).exec());
  }

  /**
   * Finds an event with populated approvers.
   * @param eventId {string}
   * @returns Promise<Result<Event | null, Error>>
   * @sideEffects DB read with population
   * @publicAPI
   */
  static async findWithApprovers(
    eventId: string
  ): Promise<Result<Event | null, Error>> {
    const query = EventModel.findOne(
      { eventId },
      PUBLIC_FIELD_SELECTIONS.EVENT
    );
    return fromPromise(populateEventApprovers(query).exec());
  }

  /**
   * Gets only the approvers list for an event (populated).
   * @param eventId {string}
   * @returns Promise<Result<Person[], Error>>
   * @sideEffects DB read with population
   * @publicAPI
   */
  static async getApprovers(eventId: string): Promise<Result<Person[], Error>> {
    const query = EventModel.findOne({ eventId }, { approverList: 1 });
    const result = await fromPromise(populateEventApprovers(query).exec());

    if (result._tag === "Failure") {
      return failure(result.error);
    }

    // Return empty array if event not found or no approvers
    const event = result.value as any;
    const approverList = event?.approverList || [];
    return success(serializeForClient<Person[]>(approverList));
  }

  /**
   * Gets only the applicants list for an event (populated).
   * @param eventId {string}
   * @returns Promise<Result<Person[], Error>>
   * @sideEffects DB read with population
   * @publicAPI
   */
  static async getApplicants(
    eventId: string
  ): Promise<Result<Person[], Error>> {
    const query = EventModel.findOne({ eventId }, { applicantList: 1 });
    const result = await fromPromise(populateEventApplicants(query).exec());

    if (result._tag === "Failure") {
      return failure(result.error);
    }

    // Return empty array if event not found or no applicants
    const event = result.value as any;
    const applicantList = event?.applicantList || [];
    return success(serializeForClient<Person[]>(applicantList));
  }

  /**
   * Finds an event with all relationships populated.
   * @param eventId {string}
   * @returns Promise<Result<Event | null, Error>>
   * @sideEffects DB read with population
   * @publicAPI
   */
  static async findWithAllDetails(
    eventId: string
  ): Promise<Result<Event | null, Error>> {
    const query = EventModel.findOne(
      { eventId },
      PUBLIC_FIELD_SELECTIONS.EVENT
    );
    const result = await fromPromise(populateEvent(query).exec());

    if (result._tag === "Success") {
      return success(serializeForClient<Event>(result.value));
    }
    return result;
  }

  /**
   * Creates an event with related documents (applicants, approvers, gifts).
   * Uses executeParallelQueries from optimizedQueries.ts for batch lookups.
   * @param eventData {object} - Event data with arrays of publicIds
   * @returns Promise<Result<Event, Error>>
   * @sideEffects DB write, batch lookups
   * @publicAPI
   * @notes Uses executeParallelQueries from optimizedQueries.ts for performance.
   */
  static async create(eventData: {
    name: string;
    email: string;
    eventId: string;
    ownerId: string;
    eventQRCodeBase64: string;
    ownerIdQRCodeBase64: string;
    applicantPublicIds: string[];
    approverPublicIds: string[];
    giftPublicIds: string[];
  }): Promise<Result<Event, Error>> {
    try {
      // Convert publicIds to ObjectIds using optimized batch queries - Issue D Fix
      const lookupQueries = {
        applicants: () =>
          PersonModel.find(
            { publicId: { $in: eventData.applicantPublicIds } },
            "_id"
          )
            .lean()
            .exec(),
        approvers: () =>
          PersonModel.find(
            { publicId: { $in: eventData.approverPublicIds } },
            "_id"
          )
            .lean()
            .exec(),
        gifts: () =>
          GiftModel.find({ publicId: { $in: eventData.giftPublicIds } }, "_id")
            .lean()
            .exec(),
      };

      const lookupsResult = await executeParallelQueries(lookupQueries);
      if (lookupsResult._tag === "Failure") {
        return failure(lookupsResult.error);
      }

      const { applicants, approvers, gifts } = lookupsResult.value;

      const eventDoc = await EventModel.create({
        name: eventData.name,
        email: eventData.email,
        eventId: eventData.eventId,
        ownerId: eventData.ownerId,
        eventQRCodeBase64: eventData.eventQRCodeBase64,
        ownerIdQRCodeBase64: eventData.ownerIdQRCodeBase64,
        applicantList: (applicants as any[]).map((doc: any) => doc._id),
        approverList: (approvers as any[]).map((doc: any) => doc._id),
        giftList: (gifts as any[]).map((doc: any) => doc._id),
      });

      // Optimized: Transform to public format directly instead of redundant query
      return success({
        publicId: eventDoc.publicId,
        eventId: eventDoc.eventId,
        name: eventDoc.name,
        email: eventDoc.email,
        ownerId: eventDoc.ownerId,
        eventQRCodeBase64: eventDoc.eventQRCodeBase64,
        ownerIdQRCodeBase64: eventDoc.ownerIdQRCodeBase64,
      } as Event);
    } catch (error) {
      return failure(error as Error);
    }
  }

  /**
   * Gets all events with pagination (optimized).
   * Uses findEventsPaginated from optimizedQueries.ts.
   * @param page {number} - Page number
   * @param limit {number} - Results per page
   * @returns Promise<Result<{ events: Event[]; total: number; page: number; pages: number }, Error>>
   * @sideEffects DB read (batch)
   * @publicAPI
   * @notes Uses findEventsPaginated from optimizedQueries.ts for performance.
   */
  static async findAllPaginated(
    page: number = 1,
    limit: number = 20
  ): Promise<
    Result<
      {
        events: Event[];
        total: number;
        page: number;
        pages: number;
      },
      Error
    >
  > {
    return findEventsPaginated(page, limit);
  }

  /**
   * Gets all events (legacy, not optimized).
   * @deprecated Use findAllPaginated for better performance.
   * @returns Promise<Result<Event[], Error>>
   * @sideEffects DB read
   * @publicAPI
   */
  static async findAll(): Promise<Result<Event[], Error>> {
    console.warn(
      "⚠️  EventService.findAll is deprecated. Use findAllPaginated for better performance."
    );
    return fromPromise(
      EventModel.find({}, PUBLIC_FIELD_SELECTIONS.EVENT).lean().exec()
    ) as Promise<Result<Event[], Error>>;
  }
}

/**
 * GiftService
 * Public API for all gift-related database operations.
 * Handles gift creation, assignment, and batch queries.
 */
export class GiftService {
  /**
   * Finds a gift by its publicId.
   * @param publicId {string}
   * @returns Promise<Result<Gift | null, Error>>
   * @sideEffects DB read with population
   * @publicAPI
   */
  static async findByPublicId(
    publicId: string
  ): Promise<Result<Gift | null, Error>> {
    return fromPromise(
      GiftModel.findOne({ publicId }, PUBLIC_FIELD_SELECTIONS.GIFT)
        .populate(POPULATION_CONFIG.GIFT_WITH_OWNER)
        .exec()
    );
  }

  /**
   * Creates gifts for a list of applicants.
   * @param applicantPublicIds {string[]}
   * @returns Promise<Result<string[], Error>>
   * @sideEffects DB write (batch)
   * @publicAPI
   */
  static async createForApplicants(
    applicantPublicIds: string[]
  ): Promise<Result<string[], Error>> {
    try {
      const applicantDocs = await PersonModel.find(
        { publicId: { $in: applicantPublicIds } },
        "_id"
      ).exec();

      const giftDocs = await GiftModel.insertMany(
        applicantDocs.map((doc) => ({
          owner: doc._id,
          applicant: null,
          order: null,
        }))
      );

      const giftPublicIds = giftDocs.map((doc) => doc.publicId);
      return success(giftPublicIds);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Assigns a gift to an applicant.
   * @param giftPublicId {string}
   * @param applicantPublicId {string}
   * @returns Promise<Result<Gift, Error>>
   * @sideEffects DB update
   * @publicAPI
   */
  static async assignToApplicant(
    giftPublicId: string,
    applicantPublicId: string
  ): Promise<Result<Gift, Error>> {
    try {
      const [giftDoc, applicantDoc] = await Promise.all([
        GiftModel.findOne({ publicId: giftPublicId }, "_id").exec(),
        PersonModel.findOne({ publicId: applicantPublicId }, "_id").exec(),
      ]);

      if (!giftDoc || !applicantDoc) {
        return failure(new Error("Gift or applicant not found"));
      }

      const updatedGift = await GiftModel.findByIdAndUpdate(
        giftDoc._id,
        { applicant: applicantDoc._id },
        { new: true }
      )
        .select(PUBLIC_FIELD_SELECTIONS.GIFT)
        .populate(POPULATION_CONFIG.GIFT_WITH_OWNER)
        .exec();

      return success(updatedGift!);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Finds all gifts for a given event by event publicId.
   * @param eventId {string}
   * @returns Promise<Result<Gift[], Error>>
   * @sideEffects DB read
   * @publicAPI
   */
  static async findByEventId(eventId: string): Promise<Result<Gift[], Error>> {
    try {
      const gifts = await GiftModel.find(
        { event: eventId },
        PUBLIC_FIELD_SELECTIONS.GIFT
      ).exec();
      return success(gifts);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

/**
 * OrderService
 * Public API for all order-related database operations.
 * Handles order creation, lookup, and batch queries.
 */
export class OrderService {
  /**
   * Finds an order by its publicId.
   * @param publicId {string}
   * @returns Promise<Result<Order | null, Error>>
   * @sideEffects DB read with population
   * @publicAPI
   */
  static async findByPublicId(
    publicId: string
  ): Promise<Result<Order | null, Error>> {
    return fromPromise(
      OrderModel.findOne({ publicId }, PUBLIC_FIELD_SELECTIONS.ORDER)
        .populate([
          POPULATION_CONFIG.ORDER_APPLICANT,
          POPULATION_CONFIG.ORDER_GIFTS,
        ])
        .exec()
    );
  }

  /**
   * Creates an order for an applicant and gifts.
   * @param orderData {object} - Order creation data
   * @returns Promise<Result<Order, Error>>
   * @sideEffects DB write, batch lookups
   * @publicAPI
   */
  static async create(orderData: {
    applicantPublicId: string;
    giftPublicIds: string[];
    orderId: string;
    confirmationRQCode: string;
  }): Promise<Result<Order, Error>> {
    try {
      // Convert publicIds to ObjectIds
      const [applicantDoc, giftDocs] = await Promise.all([
        PersonModel.findOne(
          { publicId: orderData.applicantPublicId },
          "_id"
        ).exec(),
        GiftModel.find(
          { publicId: { $in: orderData.giftPublicIds } },
          "_id"
        ).exec(),
      ]);

      if (!applicantDoc) {
        return failure(new Error("Applicant not found"));
      }

      const orderDoc = await OrderModel.create({
        applicant: applicantDoc._id,
        gifts: giftDocs.map((doc) => doc._id),
        orderId: orderData.orderId,
        confirmationRQCode: orderData.confirmationRQCode,
      });

      // Return with populated fields (keeping original approach for type safety)
      const result = await OrderModel.findOne(
        { _id: orderDoc._id },
        PUBLIC_FIELD_SELECTIONS.ORDER
      )
        .populate([
          POPULATION_CONFIG.ORDER_APPLICANT,
          POPULATION_CONFIG.ORDER_GIFTS,
        ])
        .exec();

      return success(result!);
    } catch (error) {
      return failure(error as Error);
    }
  }
}

/**
 * Converts a publicId to a MongoDB ObjectId for a given model.
 * @param model {any} - The Mongoose model
 * @param publicId {string}
 * @returns Promise<Types.ObjectId | null>
 * @sideEffects DB read
 * @internal
 */
export const getObjectIdFromPublicId = async (
  model: any,
  publicId: string
): Promise<Types.ObjectId | null> => {
  const doc = await model.findOne({ publicId }, "_id").exec();
  return doc?._id || null;
};

/**
 * Converts multiple publicIds to MongoDB ObjectIds for a given model.
 * @param model {any} - The Mongoose model
 * @param publicIds {string[]}
 * @returns Promise<Types.ObjectId[]>
 * @sideEffects DB read (batch)
 * @internal
 */
export const getObjectIdsFromPublicIds = async (
  model: any,
  publicIds: string[]
): Promise<Types.ObjectId[]> => {
  const docs = await model.find({ publicId: { $in: publicIds } }, "_id").exec();
  return docs.map((doc: any) => doc._id);
};
