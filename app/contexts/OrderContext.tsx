import { Order } from '@/database/models/order.model'
import { Person } from '@/database/models/person.model'
import {
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  createContext,
  useState,
} from 'react'

type OrderContextValues = {
  order: Order
  approverList: Person[]
  approver: Person | null
  setApprover: Dispatch<SetStateAction<Person | null>>
  getApprover: () => Person | null
}

type OrderProviderProps = {
  order: Order
  approverList: Person[]
  children: ReactNode
}

export const OrderContext = createContext<OrderContextValues | undefined>(
  undefined
)

export const OrderProvider: FC<OrderProviderProps> = ({
  order,
  approverList,
  children,
}) => {
  const [approver, setApprover] = useState<Person | null>(order.confirmedBy)

  const getApprover = () => approver

  const contextValue: OrderContextValues = {
    order,
    approverList,
    approver,
    setApprover,
    getApprover,
  }

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  )
}
