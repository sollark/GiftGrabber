import { Schema, Types, model, models } from 'mongoose'
import connectionPlugin from '../connectionPlugin'
import { Person } from './person.model'

export type Order = {
  createdAt: Date
  applicant: Person
  giftHandlers: Person[]
  confirmationRQCode: string
  confirmedBy?: Person
  confirmedAt?: Date
}
type OrderDoc = {
  createdAt: Date
  applicant: Types.ObjectId
  giftHandlers: Types.ObjectId[]
  confirmationRQCode: string
  confirmedAt?: Date
  confirmedBy?: Types.ObjectId
}

const orderSchema: Schema = new Schema({
  createdAt: { type: Date, default: Date.now },
  applicant: { type: Types.ObjectId, ref: 'Person', required: true },
  giftHandlers: [{ type: Types.ObjectId, ref: 'Person', required: true }],
  confirmationRQCode: { type: String, required: true },
  confirmedAt: { type: Date },
  confirmedBy: { type: Types.ObjectId, ref: 'Person' },
})

orderSchema.plugin(connectionPlugin)
const OrderModel = models.OrderModel || model<OrderDoc>('Order', orderSchema)

export default OrderModel
