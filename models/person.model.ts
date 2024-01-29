import mongoose, { Schema } from 'mongoose'

type Person = {
  firstName: string
  lastName: string
  hasReceivedGift: boolean
  giftReceiver: Person | null
  hasOtherPeoplesGifts: Person[] | []
}

const personSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  hasReceivedGift: { type: Boolean, required: true, default: false },
  giftReceiver: this,
  hasOtherPeoplesGifts: [this],
})

const Person = mongoose.model<Person>('Person', personSchema)

export default Person
