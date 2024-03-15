import { getEventApprovers } from '@/app/actions/event.action'
import { getOrder } from '@/app/actions/order.action'
import ConfirmOrder from '@/components/ConfirmOrder'
import { FC } from 'react'

type SearchParamProps = {
  params: {
    eventId: string
    orderId: string
  }
}

const OrderPage: FC<SearchParamProps> = async ({
  params: { eventId, orderId },
}: SearchParamProps) => {
  const approvers = await getEventApprovers(eventId)
  if (!approvers) return <div>Event not found</div>

  const order = await getOrder(orderId)
  if (!order) return <div>Order not found</div>

  return (
    <div>
      <h2>Order page</h2>
      <ConfirmOrder order={order} approvers={approvers} />
    </div>
  )
}

export default OrderPage
