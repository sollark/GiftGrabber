import { Schema, Types, model, models } from 'mongoose'
import connectionPlugin from '../connectionPlugin'
import { Person } from './person.model'

export type Event = {
  name: string
  email: string
  eventId: string
  ownerId: string
  applicantRQCodeImage: string
  ownerRQCodeImage: string
  applicantList: Person[]
}

type EventDoc = {
  _id: Types.ObjectId
  name: string
  email: string
  eventId: string
  ownerId: string
  applicantRQCodeImageBuffer: string
  ownerRQCodeImageBuffer: string
  applicantList: Types.ObjectId[]
}

export const eventSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  eventId: { type: String, required: true },
  ownerId: { type: String, required: true },
  applicantRQCodeImageBuffer: { type: String, required: true },
  ownerRQCodeImageBuffer: { type: String, required: true },
  applicantList: [
    {
      type: Types.ObjectId,
      ref: 'Person',
      required: true,
    },
  ],
})

eventSchema.plugin(connectionPlugin)

const EventModel = models.Event || model<EventDoc>('Event', eventSchema)

export default EventModel
