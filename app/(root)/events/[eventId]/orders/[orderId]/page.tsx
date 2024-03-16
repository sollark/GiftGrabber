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
  // const order = await getOrder(orderId)

  return (
    <div>
      <ConfirmOrder orderId={orderId} eventId={eventId} />
    </div>
  )
}

export default OrderPage
