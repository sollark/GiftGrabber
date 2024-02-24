import { getOrder } from '@/app/actions/order.action'
import GiftList from '@/components/GiftList'
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
  const { applicant } = order
  console.log('order, applicant', order.applicant)
  console.log('order, gifts', order.gifts)

  return (
    <div>
      <h2>OrderPage</h2>
      <p>{`${applicant.firstName} ${applicant.lastName}`}</p>
      <GiftList gifts={order.gifts} />
    </div>
  )
}

export default OrderPage
