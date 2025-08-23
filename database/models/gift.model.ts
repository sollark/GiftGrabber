/**
 * gift.model.ts
 *
 * Purpose: Mongoose model definition for Gift entities representing claimable items in events
 *
 * Main Responsibilities:
 * - Defines Gift schema with ownership and assignment tracking
 * - Manages gift lifecycle: created for owner → assigned to applicant → included in order
 * - Provides public ID strategy for secure external API access
 * - Maintains referential relationships with Person (owner/applicant) and Order models
 * - Supports efficient queries for gift availability and assignment status
 *
 * Architecture Role:
 * - Central entity connecting Person owners to Person applicants through gift claims
 * - Tracks gift state progression through null → applicant → order workflow
 * - Uses optimized indexes for real-time availability queries during gift selection
 * - Referenced by Order model for gift aggregation and by UI components for selection
 * - Enables business logic for gift claiming, order creation, and conflict resolution
 */

import { Schema, Types, model, models } from "mongoose";
import { nanoid } from "nanoid";
import { Order } from "./order.model";
import { Person } from "./person.model";

export type Gift = {
  publicId: string;
  owner: Person;
  applicant: Person | null;
  order: Order | null;
};

type GiftDoc = {
  _id: Types.ObjectId;
  publicId: string;
  owner: Types.ObjectId;
  applicant: Types.ObjectId | null;
  order: Types.ObjectId | null;
};

const giftSchema: Schema = new Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    default: () => nanoid(),
  },
  owner: { type: Types.ObjectId, ref: "Person", required: true },
  applicant: { type: Types.ObjectId, ref: "Person", default: null },
  order: { type: Types.ObjectId, ref: "Order", default: null },
});

// ============================================================================
// DATABASE INDEXES - Issue E Fix
// ============================================================================

// Primary lookup indexes - removed because unique: true already creates this index
// giftSchema.index({ publicId: 1 }); // External API queries

// Relationship-based queries
giftSchema.index({ owner: 1 }); // Gifts by owner
giftSchema.index({ applicant: 1 }); // Gifts by applicant (claimed gifts)
giftSchema.index({ order: 1 }); // Gifts in specific orders

// Availability queries for gift selection
giftSchema.index({ applicant: 1, order: 1 }); // Available vs claimed gifts

// Compound indexes for complex filtering
giftSchema.index({ owner: 1, applicant: 1 }); // Owner's gifts by availability
giftSchema.index({ owner: 1, order: 1 }); // Owner's gifts by order status

const GiftModel = models.Gift || model<GiftDoc>("Gift", giftSchema);

export default GiftModel;
