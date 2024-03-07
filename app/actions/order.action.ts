'use server'

import { connectToDatabase } from '@/database/connect'
import { Gift } from '@/database/models/gift.model'
import OrderModel, { Order } from '@/database/models/order.model'
import { Person } from '@/database/models/person.model'
import { handleError } from '@/utils/utils'

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

export const confirmOrder = async (orderId: string, confirmedBy: Person) => {
  try {
    await connectToDatabase()

    const order = await populateOrder(
      OrderModel.findOne({
        orderId,
        confirmedBy: { $exists: false },
      })
    )
    if (!order) throw new Error('Order not found')

    order.confirmedBy = confirmedBy._id
    order.confirmedAt = new Date()
    await order.save()

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
      path: 'approverList',
      select: 'firstName lastName',
    })
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
