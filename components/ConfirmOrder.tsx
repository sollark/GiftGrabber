'use client'

import { OrderProvider } from '@/app/contexts/OrderContext'
import { Order } from '@/database/models/order.model'
import { FC } from 'react'
import Approver from './Approver'
import ConfirmOrderButton from './ConfirmOrderButton'
import OrderDetails from './OrderDetails'

type ConfirmOrderProps = {
  order: Order
}

const ConfirmOrder: FC<ConfirmOrderProps> = ({ order }: ConfirmOrderProps) => {
  const { confirmedBy } = order
  return (
    <OrderProvider order={order}>
      {!confirmedBy && <Approver />}
      <OrderDetails />
      {confirmedBy ? 'Order is confirmed' : <ConfirmOrderButton />}
    </OrderProvider>
  )
}

export default ConfirmOrder
