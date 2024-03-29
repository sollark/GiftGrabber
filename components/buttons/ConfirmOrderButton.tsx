import { confirmOrder } from '@/app/actions/order.action'
import { OrderContext } from '@/app/contexts/OrderContext'
import { useSafeContext } from '@/app/hooks/useSafeContext'
import { FC } from 'react'
import StyledButton from './AccentButton'
import { OrderStatus } from '../types/OrderStatus'

const ConfirmOrderButton: FC = () => {
  const { order, getApprover } = useSafeContext(OrderContext)

  let isOrderCompleted = order.status === OrderStatus.COMPLETE

  const handleConfirmOrder = async () => {
    const approver = getApprover()
    if (!approver || !order) return

    const confirmedOrder = await confirmOrder(order.orderId, approver._id)

    if (confirmedOrder) {
      isOrderCompleted = true

      window.location.reload()
    }
  }

  return isOrderCompleted ? (
    'Congratulation'
  ) : (
    <StyledButton onClick={handleConfirmOrder}>Confirm</StyledButton>
  )
}

export default ConfirmOrderButton
