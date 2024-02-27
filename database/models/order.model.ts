import { Schema, Types, model, models } from 'mongoose'
import { Gift } from './gift.model'
import { Person } from './person.model'

export type Order = {
  _id: Types.ObjectId
  createdAt: Date
  approverList: Person[]
  applicant: Person
  gifts: Gift[]
  orderId: string
  confirmationRQCode: string
  confirmedBy?: Person
  confirmedAt?: Date
}
type OrderDoc = {
  _id: Types.ObjectId
  createdAt: Date
  approverList: Types.ObjectId[]
  applicant: Types.ObjectId
  gifts: Types.ObjectId[]
  orderId: string
  confirmationRQCode: string
  confirmedAt?: Date
  confirmedBy?: Types.ObjectId
}

const orderSchema: Schema = new Schema({
  createdAt: { type: Date, default: Date.now },
  approverList: [{ type: Types.ObjectId, ref: 'Person', required: true }],
  applicant: { type: Types.ObjectId, ref: 'Person', required: true },
  gifts: [{ type: Types.ObjectId, ref: 'Gift', required: true }],
  orderId: { type: String, required: true },
  confirmationRQCode: { type: String, required: true },
  confirmedAt: { type: Date },
  confirmedBy: { type: Types.ObjectId, ref: 'Person' },
})

const OrderModel = models.Order || model<OrderDoc>('Order', orderSchema)

export default OrderModel
