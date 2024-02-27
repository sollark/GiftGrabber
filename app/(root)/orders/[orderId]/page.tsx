import { getOrder } from '@/app/actions/order.action'
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
  const { applicant } = order
  const orderApprover = null

  function handleConfirm() {}
  return (
    <div>
      <h2>OrderPage</h2>
      <p>{`applicant: ${applicant.firstName} ${applicant.lastName}`}</p>
      <GiftList gifts={order.gifts} />
      <StyledButton>Confirm </StyledButton>
    </div>
  )
}

export default OrderPage
