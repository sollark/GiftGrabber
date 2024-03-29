import { Schema, Types, model, models } from 'mongoose'
import { Person } from './person.model'
import { Gift } from './gift.model'

export type Event = {
  _id: Types.ObjectId
  eventId: string
  name: string
  email: string
  ownerId: string
  eventQRCodeBase64: string
  ownerIdQRCodeBase64: string
  applicantList: Person[]
  giftList: Gift[]
  approverList: Person[]
}

type EventDoc = {
  _id: Types.ObjectId
  eventId: string
  name: string
  email: string
  ownerId: string
  eventQRCodeBase64: string
  ownerIdQRCodeBase64: string
  applicantList: Types.ObjectId[]
  giftList: Types.ObjectId[]
  approverList: Types.ObjectId[]
}

const eventSchema: Schema = new Schema({
  eventId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
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
  approverList: [
    {
      type: Types.ObjectId,
      ref: 'Person',
      required: true,
    },
  ],
})

const EventModel = models.Event || model<EventDoc>('Event', eventSchema)

export default EventModel
