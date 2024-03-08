import { OrderContext } from '@/app/contexts/OrderContext'
import { FC, useContext } from 'react'
import StyledButton from './StyledButton'

const ConfirmOrderButton: FC = () => {
  const { order } = useContext(OrderContext)

  const handleConfirmOrder = () => {
    // Logic to confirm the order
  }

  return <StyledButton onClick={handleConfirmOrder}>Confirm</StyledButton>
}

export default ConfirmOrderButton
