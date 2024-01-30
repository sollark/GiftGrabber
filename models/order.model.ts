import mongoose, { Schema } from 'mongoose'

type Order = {
  applicant: Schema.Types.ObjectId
  giftPassers: Schema.Types.ObjectId[]
  generatedRqCode: string
  approvedBy: Schema.Types.ObjectId
  confirmationDate: Date
}

const OrderSchema: Schema = new Schema({
  applicant: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
  giftPassers: [{ type: Schema.Types.ObjectId, ref: 'Person', required: true }],
  generatedRqCode: { type: String, required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
  confirmationDate: { type: Date, required: true },
})

const OrderModel = mongoose.model<Order>('Order', OrderSchema)

export default OrderModel
