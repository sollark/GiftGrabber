import { Schema, Types, model, models } from 'mongoose'
import { Order } from './order.model'
import { Person } from './person.model'

export type Gift = {
  _id: Types.ObjectId
  owner: Person
  receiver?: Person
  order?: Order
}

type GiftDoc = {
  _id: Types.ObjectId
  owner: Types.ObjectId
  receiver?: Types.ObjectId
  order?: Types.ObjectId
}

const giftSchema: Schema = new Schema({
  owner: { type: Types.ObjectId, ref: 'Person', required: true },
  receiver: { type: Types.ObjectId, ref: 'Person' },
  order: { type: Types.ObjectId, ref: 'Order' },
})

const GiftModel = models.Gift || model<GiftDoc>('Gift', giftSchema)

export default GiftModel
