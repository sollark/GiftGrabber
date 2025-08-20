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

const OrderModel = models.Order || model<OrderDoc>("Order", orderSchema);

export default OrderModel;
