import { Schema, Types, model, models } from 'mongoose'
import connectionPlugin from '../connectionPlugin'
import { Person } from './person.model'

export type Order = {
  creationDate: Date
  applicant: Person
  giftHandlers: Person[]
  confirmationRQCode: string
  approvedBy?: Person
  confirmationDate?: Date
}
type OrderDoc = {
  creationDate: Date
  applicant: Types.ObjectId
  giftHandlers: Types.ObjectId[]
  confirmationRQCode: string
  confirmationDate?: Date
  approvedBy?: Types.ObjectId
}

const orderSchema: Schema = new Schema({
  creationDate: { type: Date, required: true },
  applicant: { type: Types.ObjectId, ref: 'Person', required: true },
  giftHandlers: [{ type: Types.ObjectId, ref: 'Person', required: true }],
  confirmationRQCode: { type: String, required: true },
  confirmationDate: { type: Date },
  approvedBy: { type: Types.ObjectId, ref: 'Person' },
})

orderSchema.plugin(connectionPlugin)
const OrderModel = models.OrderModel || model<OrderDoc>('Order', orderSchema)

export default OrderModel
