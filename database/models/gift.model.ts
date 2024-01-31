import { Schema, Types, model, models } from 'mongoose'
import connectionPlugin from '../connectionPlugin'
import { Order } from './order.model'
import { Person } from './person.model'

export type Gift = {
  owner: Person
  receiver?: Person
  orderId?: Order
}
type GiftDoc = {
  _id: Types.ObjectId
  owner: Types.ObjectId
  receiver?: Types.ObjectId
  orderId?: Types.ObjectId
}

const giftSchema: Schema = new Schema({
  owner: { type: Types.ObjectId, ref: 'People', required: true },
  receiver: { type: Types.ObjectId, ref: 'People' },
  orderId: { type: Types.ObjectId, ref: 'Order' },
})

giftSchema.plugin(connectionPlugin)
const GiftModel = models.GiftModel || model<GiftDoc>('Gift', giftSchema)

export default GiftModel
