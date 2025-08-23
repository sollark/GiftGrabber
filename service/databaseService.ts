/**
 * databaseService.ts
 *
 * Purpose: Centralized database abstraction layer with publicId security strategy
 *
 * Main Responsibilities:
 * - Provides secure database operations using publicId instead of internal ObjectIds
 * - Implements Result<T, E> pattern for type-safe error handling across all operations
 * - Offers optimized query patterns with proper population and field selection
 * - Manages batch operations for Person, Gift, Event, and Order entities
 * - Encapsulates MongoDB-specific logic to protect business layer from database changes
 *
 * Architecture Role:
 * - Security boundary preventing ObjectId exposure to external APIs
 * - Performance optimization layer with indexed queries and batch operations
 * - Error handling standardization across all database interactions
 * - Single source of truth for entity relationship management
 * - Foundation for all service layer operations requiring data persistence
 *
 * @businessLogic
 * - All public APIs use publicId for security (prevents enumeration attacks)
 * - Batch operations reduce database round trips for performance
 * - Population queries maintain referential integrity while selecting only necessary fields
 * - Result pattern eliminates throwing exceptions for predictable error handling
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
 * Transforms any Mongoose document to a plain object safe for client components
 * Removes MongoDB-specific fields (_id, __v) and handles nested objects/arrays
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
 * Population configurations that use publicId
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
 * Person Service - All operations use publicId
 */
export class PersonService {
  /**
   * Retrieves a single person by their public identifier
   *
   * @param publicId - The public identifier string for the person to find
   * @returns Promise<Result<Person | null, Error>> - Success with person or null if not found, or Failure with error
   *
   * @sideEffects Performs database read operation
   * @performance O(1) with publicId index - single document lookup
   * @notes Returns null instead of throwing when person not found for safe handling
   * @publicAPI Core method used throughout application for person retrieval
   */
  static async findByPublicId(
    publicId: string
  ): Promise<Result<Person | null, Error>> {
    return fromPromise(
      PersonModel.findOne({ publicId }, PUBLIC_FIELD_SELECTIONS.PERSON).exec()
    );
  }

  /**
   * Creates a new person with auto-generated publicId
   *
   * @param personData - Person data without publicId (will be auto-generated)
   * @returns Promise<Result<Person, Error>> - Success with created person including publicId, or Failure with error
   *
   * @sideEffects Creates new document in database, generates unique publicId via nanoid
   * @performance O(1) for single document creation
   * @notes publicId is automatically generated by the model's nanoid default
   * @publicAPI Used for single person creation from forms or individual operations
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
   * Batch creates multiple persons for optimal performance during Excel imports
   *
   * @param personList - Array of person data objects without publicIds
   * @returns Promise<Result<string[], Error>> - Success with array of generated publicIds, or Failure with error
   *
   * @sideEffects
   * - Creates multiple documents in database in single operation
   * - Generates unique publicIds for each person via nanoid
   *
   * @performance
   * - O(n) with single database round trip for batch insertion
   * - Significantly faster than individual creates for bulk operations
   * - Optimized for Excel import scenarios with hundreds of people
   *
   * @notes
   * - Uses MongoDB insertMany for atomic batch operation
   * - Essential for Excel import performance optimization
   * - Returns only publicIds for memory efficiency in bulk operations
   *
   * @publicAPI Used by Excel import services and bulk data migration tools
   */
  static async createMany(
    personList: Omit<Person, "publicId">[]
  ): Promise<Result<string[], Error>> {
    try {
      // Batch create operation instead of individual creates
      const docs = await PersonModel.insertMany(personList);
      const publicIds = docs.map((doc) => doc.publicId);
      return success(publicIds);
    } catch (error) {
      return failure(error as Error);
    }
  }

  /**
   * Batch find persons by publicIds - Issue D Fix (replaces N+1 pattern)
   */
  static async findManyByPublicIds(
    publicIds: string[]
  ): Promise<Result<Person[], Error>> {
    return findPersonsByPublicIds(publicIds);
  }

  /**
   * Transform function to exclude _id and include publicId
   */
  private static transformToPublic = (doc: any, ret: any) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  };
}

/**
 * Event Service - All operations use publicId
 */
export class EventService {
  /**
   * Find event by business eventId (legacy field, will be migrated to publicId)
   */
  static async findByEventId(
    eventId: string
  ): Promise<Result<Event | null, Error>> {
    return fromPromise(
      EventModel.findOne({ eventId }, PUBLIC_FIELD_SELECTIONS.EVENT).exec()
    );
  }

  /**
   * Find event by publicId
   */
  static async findByPublicId(
    publicId: string
  ): Promise<Result<Event | null, Error>> {
    return fromPromise(
      EventModel.findOne({ publicId }, PUBLIC_FIELD_SELECTIONS.EVENT).exec()
    );
  }

  /**
   * Find event with populated applicants by eventId
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
   * Find event with populated approvers by eventId
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
   * Get only approvers list for an event by eventId
   * Optimized query that fetches only approverList field + populated approvers
   * @param eventId - The unique identifier for the event
   * @returns Promise<Result<Person[], Error>> - Array of approver persons with publicIds
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
   * Get only applicants list for an event by eventId
   * Optimized query that fetches only applicantList field + populated applicants
   * @param eventId - The unique identifier for the event
   * @returns Promise<Result<Person[], Error>> - Array of applicant persons with publicIds
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
   * Find event with all populated relationships by eventId
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
   * Create event with related documents
   * @param eventData - Event data with arrays of publicIds for relationships
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
   * Get all events with pagination support - Issue D Fix (optimized)
   * @param page - Page number (default: 1)
   * @param limit - Results per page (default: 20)
   * @returns Promise<Result<{ events: Event[]; total: number; page: number; pages: number }, Error>>
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
   * Get all events (legacy method - consider using pagination)
   * @deprecated Use findAllPaginated for better performance
   */
  static async findAll(): Promise<Result<any[], Error>> {
    console.warn(
      "⚠️  EventService.findAll is deprecated. Use findAllPaginated for better performance."
    );
    return fromPromise(
      EventModel.find({}, PUBLIC_FIELD_SELECTIONS.EVENT).lean().exec()
    );
  }
}

/**
 * Gift Service - All operations use publicId
 */
export class GiftService {
  /**
   * Find gift by publicId
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
   * Create gifts for applicants
   */
  static async createForApplicants(
    applicantPublicIds: string[]
  ): Promise<Result<string[], Error>> {
    try {
      // Convert publicIds to ObjectIds
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
      return failure(error as Error);
    }
  }

  /**
   * Update gift with applicant
   */
  static async assignToApplicant(
    giftPublicId: string,
    applicantPublicId: string
  ): Promise<Result<Gift, Error>> {
    try {
      // Get ObjectIds from publicIds
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
      return failure(error as Error);
    }
  }
}

/**
 * Order Service - All operations use publicId
 */
export class OrderService {
  /**
   * Find order by publicId
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
   * Create order
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
 * Utility function to convert publicIds to ObjectIds
 * Used internally when we need to query by relationships
 */
export const getObjectIdFromPublicId = async (
  model: any,
  publicId: string
): Promise<Types.ObjectId | null> => {
  const doc = await model.findOne({ publicId }, "_id").exec();
  return doc?._id || null;
};

/**
 * Utility function to convert multiple publicIds to ObjectIds
 */
export const getObjectIdsFromPublicIds = async (
  model: any,
  publicIds: string[]
): Promise<Types.ObjectId[]> => {
  const docs = await model.find({ publicId: { $in: publicIds } }, "_id").exec();
  return docs.map((doc: any) => doc._id);
};
