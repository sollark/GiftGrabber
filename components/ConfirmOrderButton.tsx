import { OrderContext } from '@/app/contexts/OrderContext'
import { FC, useContext } from 'react'
import StyledButton from './StyledButton'
import { confirmOrder } from '@/app/actions/order.action'

const ConfirmOrderButton: FC = () => {
  const { order, getApprover } = useContext(OrderContext)

  let isOrderConfirmed = false

  const handleConfirmOrder = async () => {
    const approver = getApprover()
    if (!approver || !order) return

    const confirmedOrder = await confirmOrder(order.orderId, approver._id)

    if (confirmedOrder) isOrderConfirmed = true
  }

  return isOrderConfirmed ? (
    'Congratulation'
  ) : (
    <StyledButton onClick={handleConfirmOrder}>Confirm</StyledButton>
  )
}

export default ConfirmOrderButton
