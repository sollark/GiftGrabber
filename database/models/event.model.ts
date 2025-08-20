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
  approverList: Person[] | null;
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
  approverList: Types.ObjectId[] | null;
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
  approverList: [
    {
      type: Types.ObjectId,
      ref: "Person",
      default: null,
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

const EventModel = models.Event || model<EventDoc>("Event", eventSchema);

export default EventModel;
