import { getOrder } from '@/app/actions/order.action'
import GiftList from '@/components/GiftList'
import { OptionType } from '@/components/PersonAutocomplete'
import { FC, SyntheticEvent } from 'react'

type SearchParamProps = {
  params: {
    orderId: string
  }
}

const OrderPage: FC<SearchParamProps> = async ({
  params: { orderId },
}: SearchParamProps) => {
  console.log('getting an order')
  const order = await getOrder(orderId)
  console.log('order', order)
  // const { approverList, applicant } = order

  const onSelectApprover = (
    event: SyntheticEvent,
    value: OptionType | null
  ) => {
    console.log('onSelectApprover', value)
  }

  // TODO move it to client component
  function handleConfirm() {}
  return (
    <div>
      <h2>OrderPage</h2>
      {/* 
      <p>{`applicant: ${applicant.firstName} ${applicant.lastName}`}</p>
      <GiftList gifts={order.gifts} /> */}
      {/* <StyledButton>Confirm</StyledButton> */}
    </div>
  )
}

export default OrderPage
