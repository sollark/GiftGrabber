import mongoose, { Schema, Types } from 'mongoose'

type Person = {
  firstName: string
  lastName: string
  orders: Types.ObjectId[] | []
}

const personSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  orders: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
  ],
})

const Person = mongoose.model<Person>('Person', personSchema)

export default Person
