import { Schema, Types, model, models } from 'mongoose'
import { Person } from './person.model'
import { Gift } from './gift.model'

export type Order = {
  _id: string
  createdAt: Date
  applicant: Person
  gifts: Gift[]
  confirmationRQCode: string
  confirmedBy?: Person
  confirmedAt?: Date
}
type OrderDoc = {
  _id: Types.ObjectId
  createdAt: Date
  applicant: Types.ObjectId
  gifts: Types.ObjectId[]
  confirmationRQCode: string
  confirmedAt?: Date
  confirmedBy?: Types.ObjectId
}

const orderSchema: Schema = new Schema({
  createdAt: { type: Date, default: Date.now },
  applicant: { type: Types.ObjectId, ref: 'Person', required: true },
  gifts: [{ type: Types.ObjectId, ref: 'Gift', required: true }],
  confirmationRQCode: { type: String, required: true },
  confirmedAt: { type: Date },
  confirmedBy: { type: Types.ObjectId, ref: 'Person' },
})

const OrderModel = models.Order || model<OrderDoc>('Order', orderSchema)

export default OrderModel
