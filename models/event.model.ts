import mongoose, { Schema } from 'mongoose'
import Person from './person.model'

type Event = {
  hashPassword: string
  id: string
  checkinRqCodeImage: string
  confirmRqCodeImage: string
  people: Person[]
}

const eventSchema: Schema = new Schema({
  hashPassword: { type: String, required: true },
  id: { type: String, required: true },
  checkinRqCodeImage: { type: String, required: true },
  confirmRqCodeImage: { type: String, required: true },
  people: [Person],
})

const Event = mongoose.model<Event>('Event', eventSchema)

export default Event
