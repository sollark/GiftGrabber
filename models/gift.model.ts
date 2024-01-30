import mongoose, { Schema } from 'mongoose'

type Gift = {
  owner: mongoose.Types.ObjectId
  receiver?: mongoose.Types.ObjectId
  orderId?: mongoose.Types.ObjectId
}

const GiftSchema: Schema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'People', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'People' },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
})

export default mongoose.model<Gift>('Gift', GiftSchema)
