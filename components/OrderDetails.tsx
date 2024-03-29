import { OrderContext } from '@/app/contexts/OrderContext'
import { useSafeContext } from '@/app/hooks/useSafeContext'
import React from 'react'
import GiftList from './GiftList'

const OrderDetails: React.FC = () => {
  const { order, approver } = useSafeContext(OrderContext)
  if (!order) return null

  const { createdAt, applicant, gifts } = order
  return (
    <div>
      <h2>Order Details</h2>
      {order ? (
        <div>
          <p>
            <strong>Order date:</strong> {new Date(createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Applicant:</strong> {applicant.firstName}{' '}
            {applicant.lastName}
          </p>
          <p>
            <strong>Approver:</strong>{' '}
            {order.confirmedBy
              ? `${order.confirmedBy.firstName} ${order.confirmedBy.lastName}`
              : approver
              ? `${approver.firstName} ${approver.lastName}`
              : ''}
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
