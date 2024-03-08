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
  return (
    <OrderProvider order={order}>
      <Approver />
      <OrderDetails />
      <ConfirmOrderButton />
    </OrderProvider>
  )
}

export default ConfirmOrder
