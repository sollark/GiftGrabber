import { getOrder } from '@/app/actions/order.action'
import ConfirmOrder from '@/components/ConfirmOrder'
import { FC } from 'react'

type SearchParamProps = {
  params: {
    orderId: string
  }
}

const OrderPage: FC<SearchParamProps> = async ({
  params: { orderId },
}: SearchParamProps) => {
  const order = await getOrder(orderId)
  if (!order) return <div>Order not found</div>

  console.log('order in OrderPage', order)

  return (
    <div>
      <h2>OrderPage</h2>
      <ConfirmOrder order={order} />
    </div>
  )
}

export default OrderPage
