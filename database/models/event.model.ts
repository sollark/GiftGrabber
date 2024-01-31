import { Schema, Types, model, models } from 'mongoose'
import connectionPlugin from '../connectionPlugin'
import { Person } from './person.model'

export type Event = {
  email: string
  eventId: string
  ownerId: string
  applicantRQCodeImage: string
  ownerRQCodeImage: string
  applicantList: Person[]
}

type EventDoc = {
  _id: Types.ObjectId
  email: string
  eventId: string
  ownerId: string
  applicantRQCodeImage: string
  ownerRQCodeImage: string
  applicantList: Types.ObjectId[]
}

const eventSchema: Schema = new Schema({
  email: { type: String, required: true },
  eventId: { type: String, required: true },
  ownerId: { type: String, required: true },
  applicantRQCodeImage: { type: String, required: true },
  ownerRQCodeImage: { type: String, required: true },
  applicantList: [
    {
      type: Types.ObjectId,
      ref: 'Person',
      required: true,
    },
  ],
})

eventSchema.plugin(connectionPlugin)
const EventModel = models.EventModel || model<EventDoc>('Event', eventSchema)

export default EventModel
