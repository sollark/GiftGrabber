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

/**
 * Standard field selections that include publicId but exclude _id
 */
export const PUBLIC_FIELD_SELECTIONS = {
  PERSON: "publicId firstName lastName employeeId personId sourceFormat",
  EVENT:
    "publicId eventId name email ownerId eventQRCodeBase64 ownerIdQRCodeBase64",
  GIFT: "publicId owner applicant order",
  ORDER:
    "publicId createdAt applicant gifts orderId confirmationRQCode confirmedByApprover confirmedAt status",
} as const;

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
   * Find person by publicId
   */
  static async findByPublicId(
    publicId: string
  ): Promise<Result<Person | null, Error>> {
    return fromPromise(
      PersonModel.findOne({ publicId }, PUBLIC_FIELD_SELECTIONS.PERSON).exec()
    );
  }

  /**
   * Create person and return with publicId
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
   * Create multiple persons and return their publicIds
   */
  static async createMany(
    personList: Omit<Person, "publicId">[]
  ): Promise<Result<string[], Error>> {
    try {
      const docs = await PersonModel.insertMany(personList);
      const publicIds = docs.map((doc) => doc.publicId);
      return success(publicIds);
    } catch (error) {
      return failure(error as Error);
    }
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
    return fromPromise(
      EventModel.findOne({ eventId }, PUBLIC_FIELD_SELECTIONS.EVENT)
        .populate(POPULATION_CONFIG.EVENT_APPLICANTS)
        .exec()
    );
  }

  /**
   * Find event with populated approvers by eventId
   */
  static async findWithApprovers(
    eventId: string
  ): Promise<Result<Event | null, Error>> {
    return fromPromise(
      EventModel.findOne({ eventId }, PUBLIC_FIELD_SELECTIONS.EVENT)
        .populate(POPULATION_CONFIG.EVENT_APPROVERS)
        .exec()
    );
  }

  /**
   * Find event with all populated relationships by eventId
   */
  static async findWithAllDetails(
    eventId: string
  ): Promise<Result<Event | null, Error>> {
    return fromPromise(
      EventModel.findOne({ eventId }, PUBLIC_FIELD_SELECTIONS.EVENT)
        .populate([
          POPULATION_CONFIG.EVENT_APPLICANTS,
          POPULATION_CONFIG.EVENT_APPROVERS,
          POPULATION_CONFIG.EVENT_GIFTS,
        ])
        .exec()
    );
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
      // Convert publicIds to ObjectIds for internal storage
      const [applicantDocs, approverDocs, giftDocs] = await Promise.all([
        PersonModel.find(
          { publicId: { $in: eventData.applicantPublicIds } },
          "_id"
        ).exec(),
        PersonModel.find(
          { publicId: { $in: eventData.approverPublicIds } },
          "_id"
        ).exec(),
        GiftModel.find(
          { publicId: { $in: eventData.giftPublicIds } },
          "_id"
        ).exec(),
      ]);

      const eventDoc = await EventModel.create({
        name: eventData.name,
        email: eventData.email,
        eventId: eventData.eventId,
        ownerId: eventData.ownerId,
        eventQRCodeBase64: eventData.eventQRCodeBase64,
        ownerIdQRCodeBase64: eventData.ownerIdQRCodeBase64,
        applicantList: applicantDocs.map((doc) => doc._id),
        approverList: approverDocs.map((doc) => doc._id),
        giftList: giftDocs.map((doc) => doc._id),
      });

      // Return with only public fields
      const result = await EventModel.findOne(
        { _id: eventDoc._id },
        PUBLIC_FIELD_SELECTIONS.EVENT
      ).exec();

      return success(result!);
    } catch (error) {
      return failure(error as Error);
    }
  }

  /**
   * Get all events with minimal data
   */
  static async findAll(): Promise<Result<Event[], Error>> {
    return fromPromise(
      EventModel.find({}, PUBLIC_FIELD_SELECTIONS.EVENT).exec()
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

      // Return with populated fields
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
