import mongoose, { Schema, Types } from 'mongoose'
import connectionPlugin from '../connectionPlugin'
import { Order } from './order.model'

export type Person = {
  firstName: string
  lastName: string
  orders: Order[] | []
}

type PersonDoc = {
  firstName: string
  lastName: string
  orders: Types.ObjectId[] | []
}

const personSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  orders: [
    {
      type: Types.ObjectId,
      ref: 'Order',
    },
  ],
})

personSchema.plugin(connectionPlugin)
const PersonModel = mongoose.model<PersonDoc>('Person', personSchema)

export default PersonModel
