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

const GiftModel = models.Gift || model<GiftDoc>("Gift", giftSchema);

export default GiftModel;
