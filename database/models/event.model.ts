/**
 * event.model.ts
 *
 * Purpose: Mongoose model definition for Event entities representing gift exchange events
 *
 * Main Responsibilities:
 * - Defines Event schema as container for all event-related entities (applicants, gifts)
 * - Manages event metadata: owner information, QR codes, and contact details
 * - Aggregates references to Person, Gift, and Order collections for event-specific data
 * - Provides QR code storage for event access and owner verification
 * - Supports event-based access control and permission management
 *
 * Architecture Role:
 * - Top-level aggregate root for gift exchange event boundaries
 * - Links event owner to all participants through applicant lists
 * - Stores QR codes for mobile-friendly event access and verification
 * - Enables event-scoped queries for all related entities (gifts, orders, participants)
 * - Central entity for event lifecycle management and multi-tenant isolation
 */

import { Schema, Types, model, models } from "mongoose";
import { nanoid } from "nanoid";
import { Person } from "./person.model";
import { Gift } from "./gift.model";
import { Order } from "./order.model";

export type Event = {
  publicId: string;
  eventId: string;
  name: string;
  email: string;
  ownerId: string;
  eventQRCodeBase64: string;
  ownerIdQRCodeBase64: string;
  applicantList: Person[];
  giftList: Gift[];
  orders: Order[] | null;
};

type EventDoc = {
  _id: Types.ObjectId;
  publicId: string;
  eventId: string;
  name: string;
  email: string;
  ownerId: string;
  eventQRCodeBase64: string;
  ownerIdQRCodeBase64: string;
  applicantList: Types.ObjectId[];
  giftList: Types.ObjectId[];
  orders: Types.ObjectId[] | null;
};

const eventSchema: Schema = new Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    default: () => nanoid(),
  },
  eventId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  ownerId: { type: String, required: true },
  eventQRCodeBase64: { type: String, required: true },
  ownerIdQRCodeBase64: { type: String, required: true },
  applicantList: [
    {
      type: Types.ObjectId,
      ref: "Person",
      required: true,
    },
  ],
  giftList: [
    {
      type: Types.ObjectId,
      ref: "Gift",
      required: true,
    },
  ],
  orders: [
    {
      type: Types.ObjectId,
      ref: "Order",
      default: null,
    },
  ],
});

// ============================================================================
// DATABASE INDEXES - Issue E Fix
// ============================================================================

// Primary lookup indexes - removed publicId because unique: true already creates this index
eventSchema.index({ eventId: 1 }); // Most common query pattern
// eventSchema.index({ publicId: 1 }); // External API queries - removed duplicate
eventSchema.index({ ownerId: 1 }); // Owner-based queries

// Compound indexes for complex queries
eventSchema.index({ eventId: 1, ownerId: 1 }); // Event access verification
eventSchema.index({ eventId: 1, applicantList: 1 }); // Applicant membership

// Email-based lookups
eventSchema.index({ email: 1 });

const EventModel = models.Event || model<EventDoc>("Event", eventSchema);

export default EventModel;
