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

// Primary lookup indexes
giftSchema.index({ publicId: 1 }); // External API queries

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
