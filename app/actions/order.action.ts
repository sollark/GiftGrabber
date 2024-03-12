'use server'

import { OrderStatus } from '@/components/types/OrderStatus'
import { connectToDatabase } from '@/database/connect'
import GiftModel, { Gift } from '@/database/models/gift.model'
import OrderModel, { Order } from '@/database/models/order.model'
import { Person } from '@/database/models/person.model'
import { handleError } from '@/utils/utils'
import { Types } from 'mongoose'

export const makeOrder = async (
  approverList: Person[],
  applicant: Person,
  gifts: Gift[],
  orderId: string,
  confirmationRQCode: string
) => {
  try {
    await connectToDatabase()

    const newOrder = await OrderModel.create({
      createdAt: new Date(),
      approverList: approverList.map((approver) => approver._id),
      applicant: applicant._id,
      gifts: gifts.map((gift) => gift._id),
      orderId,
      confirmationRQCode,
    })
    console.log('newOrder created:', newOrder)

    return newOrder ? true : false
  } catch (error) {
    console.log('Error in makeOrder')
    handleError(error)
  }
}

export const getOrder = async (orderId: string): Promise<Order | null> => {
  try {
    await connectToDatabase()

    const order = await populateOrder(OrderModel.findOne({ orderId }))
    if (!order) throw new Error('Order not found')

    return JSON.parse(JSON.stringify(order))
  } catch (error) {
    console.log('Error in getOrder')
    handleError(error)
  }
  return null
}

export const confirmOrder = async (
  orderId: string,
  confirmedBy: Types.ObjectId
) => {
  try {
    await connectToDatabase()

    console.log('in confirmOrder:', orderId, confirmedBy)
    const order = await populateOrder(
      OrderModel.findOne({
        orderId,
        confirmedBy: null,
      })
    )
    if (!order) throw new Error('Order not found or already confirmed')

    order.confirmedBy = confirmedBy
    order.confirmedAt = new Date()
    order.status = OrderStatus.COMPLETE
    await order.save()

    // update gifts status
    const { applicant } = order
    const gifts = order.gifts.map(async (gift: Gift) => {
      const giftToUpdate = await GiftModel.findById(gift._id)
      giftToUpdate.receiver = applicant._id
      giftToUpdate.order = order._id
      await giftToUpdate.save()
      return giftToUpdate
    })

    return JSON.parse(JSON.stringify(order))
  } catch (error) {
    console.log('Error in confirmOrder')
    handleError(error)
  }
  return false
}

const populateOrder = async (query: any) => {
  return query
    .populate({
      path: 'applicant',
      select: 'firstName lastName',
    })
    .populate({
      path: 'gifts',
      select: 'owner',
      populate: {
        path: 'owner',
        select: 'firstName lastName',
      },
    })
}
