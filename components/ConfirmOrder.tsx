import { Order } from '@/database/models/order.model'
import React, { FC } from 'react'
import Approver from './Approver'
import { OrderProvider } from '@/lib/OrderContext'

type ConfirmOrderProps = {
  order: Order
}
const ConfirmOrder: FC<ConfirmOrderProps> = ({ order }: ConfirmOrderProps) => {
  const { approverList } = order

  return (
    <OrderProvider approverList={approverList}>
      <Approver approverList={approverList} />
    </OrderProvider>
  )
}

export default ConfirmOrder
