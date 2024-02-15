import { Schema, Types, model, models } from 'mongoose'
import { Person } from './person.model'
import { Gift } from './gift.model'

export type Event = {
  name: string
  email: string
  eventId: string
  ownerId: string
  eventQRCodeBase64: string
  ownerIdQRCodeBase64: string
  applicantList: Person[]
  giftList: Gift[]
}

type EventDoc = {
  _id: Types.ObjectId
  name: string
  email: string
  eventId: string
  ownerId: string
  eventQRCodeBase64: string
  ownerIdQRCodeBase64: string
  applicantList: Types.ObjectId[]
  giftList: Types.ObjectId[]
}

export const eventSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  eventId: { type: String, required: true },
  ownerId: { type: String, required: true },
  eventQRCodeBase64: { type: String, required: true },
  ownerIdQRCodeBase64: { type: String, required: true },
  applicantList: [
    {
      type: Types.ObjectId,
      ref: 'Person',
      required: true,
    },
  ],
  giftList: [
    {
      type: Types.ObjectId,
      ref: 'Gift',
      required: true,
    },
  ],
})

const EventModel = models.Event || model<EventDoc>('Event', eventSchema)

export default EventModel
