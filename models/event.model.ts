import mongoose, { Schema } from 'mongoose'
import Person from './person.model'

type Event = {
  email: string
  eventId: string
  ownerId: string
  applicantRQCodeImage: string
  ownerRQCodeImage: string
  applicantList: Person[]
}

const eventSchema: Schema = new Schema({
  email: { type: String, required: true },
  eventId: { type: String, required: true },
  ownerId: { type: String, required: true },
  applicantRQCodeImage: { type: String, required: true },
  ownerRQCodeImage: { type: String, required: true },
  applicantList: [Person],
})

const Event = mongoose.model<Event>('Event', eventSchema)

export default Event
