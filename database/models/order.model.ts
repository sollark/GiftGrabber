import mongoose, { Schema, Types } from 'mongoose'
import connectionPlugin from '../connectionPlugin'
import { Person } from './person.model'

export type Order = {
  applicant: Person
  giftHandlers: Person[]
  confirmationRQCode: string
  approvedBy: Person
  confirmationDate: Date
}
type OrderDoc = {
  applicant: Types.ObjectId
  giftHandlers: Types.ObjectId[]
  confirmationRQCode: string
  approvedBy: Types.ObjectId
  confirmationDate: Date
}

const orderSchema: Schema = new Schema({
  applicant: { type: Types.ObjectId, ref: 'Person', required: true },
  giftHandlers: [{ type: Types.ObjectId, ref: 'Person', required: true }],
  confirmationRQCode: { type: String, required: true },
  approvedBy: { type: Types.ObjectId, ref: 'Person', required: true },
  confirmationDate: { type: Date, required: true },
})

orderSchema.plugin(connectionPlugin)
const OrderModel = mongoose.model<OrderDoc>('Order', orderSchema)

export default OrderModel
