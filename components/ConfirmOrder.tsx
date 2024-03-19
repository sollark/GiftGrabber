'use client'

import { getEventApprovers } from '@/app/actions/event.action'
import { getOrder } from '@/app/actions/order.action'
import { OrderProvider } from '@/app/contexts/OrderContext'
import { FC } from 'react'
import useSWR from 'swr'
import Approver from './Approver'
import ConfirmOrderButton from './buttons/ConfirmOrderButton'
import MultistepNavigator from './MultistepNavigator'
import OrderDetails from './OrderDetails'

type ConfirmOrderProps = {
  eventId: string
  orderId: string
}

const ConfirmOrder: FC<ConfirmOrderProps> = ({
  eventId,
  orderId,
}: ConfirmOrderProps) => {
  const {
    data: order,
    error: orderError,
    isValidating: orderLoading,
  } = useSWR(
    () => `orders/${orderId}`,
    () => getOrder(orderId),
    { revalidateOnFocus: false } // stop rerender when user navigates away
  )

  const {
    data: approvers,
    error: approversError,
    isValidating: approversLoading,
  } = useSWR(
    () => `events/${eventId}/approvers`,
    () => getEventApprovers(eventId),
    { revalidateOnFocus: false } // stop rerender when user navigates away
  )

  if (orderLoading || approversLoading) return <div>Loading...</div>
  if (orderError) return <div>Error loading order</div>
  if (!order) return <div>Order not found</div>
  if (approversError) return <div>Error loading approvers</div>
  if (!approvers) return <div>Event not found</div>

  return (
    <OrderProvider order={order} approverList={approvers}>
      <MultistepNavigator>
        <Approver />
        <>
          <OrderDetails />
          <ConfirmOrderButton />
        </>
      </MultistepNavigator>
    </OrderProvider>
  )
}

export default ConfirmOrder
