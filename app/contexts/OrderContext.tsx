import { Order } from '@/database/models/order.model'
import { Person } from '@/database/models/person.model'
import React, {
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  createContext,
  useState,
} from 'react'

type Context = {
  order: Order | null
  approverList: Person[]
  approver: Person | null
  setApprover: Dispatch<SetStateAction<Person | null>>
  getApprover: () => Person | null
}

type OrderProviderProps = {
  order: Order
  children: ReactNode
}

const initialContext: Context = {
  order: null,
  approverList: [],
  approver: null,
  setApprover: () => null,
  getApprover: () => null,
}

export const OrderContext = createContext<Context>(initialContext)

export const OrderProvider: FC<OrderProviderProps> = ({ order, children }) => {
  const { approverList } = order
  const [approver, setApprover] = useState<Person | null>(null)

  const getApprover = () => approver

  const value = { order, approverList, approver, setApprover, getApprover }

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}
