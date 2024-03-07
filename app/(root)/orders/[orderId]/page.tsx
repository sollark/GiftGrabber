import { getOrder } from '@/app/actions/order.action'
import Approver from '@/components/Approver'
import GiftList from '@/components/GiftList'
import StyledButton from '@/components/StyledButton'
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
  const { approverList, applicant } = order

  return (
    <div>
      <h2>OrderPage</h2>
      <Approver approverList={order.approverList} />

      {/* <p>{`applicant: ${applicant.firstName} ${applicant.lastName}`}</p> */}
    </div>
  )
}

export default OrderPage
