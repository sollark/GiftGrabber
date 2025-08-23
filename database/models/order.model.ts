/**
 * order.model.ts
 *
 * Purpose: Mongoose model definition for Order entities representing gift claim transactions
 *
 * Main Responsibilities:
 * - Defines Order schema with applicant, gifts, and approval workflow tracking
 * - Manages order lifecycle: creation → pending → approval → confirmation
 * - Provides QR code integration for mobile-friendly order verification
 * - Maintains audit trail with timestamps and approver tracking
 * - Supports order status management through OrderStatus enumeration
 *
 * Architecture Role:
 * - Aggregates multiple Gift entities into single transaction unit
 * - Links Person applicant to their claimed gifts with approval workflow
 * - Stores QR code data for offline/mobile order verification scenarios
 * - Uses optimized indexes for real-time order tracking and approval dashboards
 * - Central entity for business reporting and gift distribution analytics
 */

import { Schema, Types, model, models } from "mongoose";
import { nanoid } from "nanoid";
import { OrderStatus } from "@/types/common.types";
import { Gift } from "./gift.model";
import { Person } from "./person.model";

export type Order = {
  publicId: string;
  createdAt: Date;
  applicant: Person;
  gifts: Gift[];
  orderId: string;
  confirmationRQCode: string;
  confirmedByApprover: Person | null;
  confirmedAt?: Date;
  status: OrderStatus;
};
type OrderDoc = {
  _id: Types.ObjectId;
  publicId: string;
  createdAt: Date;
  applicant: Types.ObjectId;
  gifts: Types.ObjectId[];
  orderId: string;
  confirmationRQCode: string;
  confirmedAt: Date | null;
  confirmedByApprover: Types.ObjectId | null;
  status: OrderStatus;
};

const orderSchema: Schema = new Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    default: () => nanoid(),
  },
  createdAt: { type: Date, default: Date.now },
  applicant: { type: Types.ObjectId, ref: "Person", required: true },
  gifts: [{ type: Types.ObjectId, ref: "Gift", required: true }],
  orderId: { type: String, required: true },
  confirmationRQCode: { type: String, required: true },
  confirmedAt: { type: Date, default: null },
  confirmedByApprover: {
    type: Types.ObjectId,
    ref: "Person",
    default: null,
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  },
});

// ============================================================================
// DATABASE INDEXES - Issue E Fix
// ============================================================================

// Primary lookup indexes - removed because unique: true already creates this index
// orderSchema.index({ publicId: 1 }); // External API queries
orderSchema.index({ orderId: 1 }); // Business ID queries

// Relationship-based queries
orderSchema.index({ applicant: 1 }); // Orders by applicant
orderSchema.index({ confirmedByApprover: 1 }); // Orders by approver

// Status-based queries for dashboards/monitoring
orderSchema.index({ status: 1 }); // Orders by status
orderSchema.index({ createdAt: -1 }); // Recent orders first

// Compound indexes for complex filtering
orderSchema.index({ applicant: 1, status: 1 }); // Applicant's orders by status
orderSchema.index({ status: 1, createdAt: -1 }); // Status with recency
orderSchema.index({ confirmedByApprover: 1, status: 1 }); // Approver's decisions
orderSchema.index({ orderId: 1, status: 1 }); // Business ID with status

// Performance optimization for gift relationship queries
orderSchema.index({ gifts: 1 }); // Orders containing specific gifts

// Date-based queries for reporting
orderSchema.index({ confirmedAt: -1 }); // Recent confirmations
orderSchema.index({ createdAt: 1, confirmedAt: 1 }); // Order lifecycle timing

const OrderModel = models.Order || model<OrderDoc>("Order", orderSchema);

export default OrderModel;
