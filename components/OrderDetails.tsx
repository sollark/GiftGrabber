import { OrderContext } from '@/app/contexts/OrderContext'
import React, { useContext } from 'react'
import GiftList from './GiftList'

const OrderDetails: React.FC = () => {
  const { order } = useContext(OrderContext)
  if (!order) return null

  const { createdAt, applicant, gifts } = order

  return (
    <div>
      <h2>Order Details</h2>
      {order ? (
        <div>
          <p>Order date: {createdAt.toString()}</p>
          <p>
            Applicant: {applicant.firstName} {applicant.lastName}
          </p>
          <GiftList gifts={gifts} />
        </div>
      ) : (
        <p>No order found.</p>
      )}
    </div>
  )
}

export default OrderDetails
