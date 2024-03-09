import { Schema, Types, model, models } from 'mongoose'
import { Gift } from './gift.model'
import { Person } from './person.model'

export enum OrderStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  COMPLETE = 'Complete',
  CANCELLED = 'Cancelled',
}

export type Order = {
  _id: Types.ObjectId
  createdAt: Date
  applicant: Person
  gifts: Gift[]
  orderId: string
  confirmationRQCode: string
  confirmedBy?: Person
  confirmedAt?: Date
  status: OrderStatus
}
type OrderDoc = {
  _id: Types.ObjectId
  createdAt: Date
  applicant: Types.ObjectId
  gifts: Types.ObjectId[]
  orderId: string
  confirmationRQCode: string
  confirmedAt?: Date
  confirmedBy?: Types.ObjectId
  status: OrderStatus
}

const orderSchema: Schema = new Schema({
  createdAt: { type: Date, default: Date.now },
  applicant: { type: Types.ObjectId, ref: 'Person', required: true },
  gifts: [{ type: Types.ObjectId, ref: 'Gift', required: true }],
  orderId: { type: String, required: true },
  confirmationRQCode: { type: String, required: true },
  confirmedAt: { type: Date },
  confirmedBy: { type: Types.ObjectId, ref: 'Person' },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  },
})

const OrderModel = models.Order || model<OrderDoc>('Order', orderSchema)

export default OrderModel
