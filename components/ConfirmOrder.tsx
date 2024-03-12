'use client'

import { OrderProvider } from '@/app/contexts/OrderContext'
import { Order } from '@/database/models/order.model'
import { Person } from '@/database/models/person.model'
import { FC } from 'react'
import Approver from './Approver'
import ConfirmOrderButton from './ConfirmOrderButton'
import MultistepNavigator from './MultistepNavigator'
import OrderDetails from './OrderDetails'

type ConfirmOrderProps = {
  order: Order
  approvers: Person[]
}

const ConfirmOrder: FC<ConfirmOrderProps> = ({
  approvers,
  order,
}: ConfirmOrderProps) => {
  const { status } = order

  return (
    <OrderProvider order={order} approverList={approvers}>
      <MultistepNavigator>
        <Approver />
        <>
          <OrderDetails />
          <ConfirmOrderButton />
        </>
      </MultistepNavigator>
    </OrderProvider>
  )
}

export default ConfirmOrder
