import { Schema, Types, model, models } from 'mongoose'
import { Order } from './order.model'

export type Person = {
  firstName: string
  lastName: string
  // orders: Order[] | []
}

type PersonDoc = {
  _id: Types.ObjectId
  firstName: string
  lastName: string
  // orders: Types.ObjectId[] | []
}

const personSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  // orders: [
  //   {
  //     type: Types.ObjectId,
  //     ref: 'Order',
  //   },
  // ],
})

const PersonModel = models.Person || model<PersonDoc>('Person', personSchema)

export default PersonModel
