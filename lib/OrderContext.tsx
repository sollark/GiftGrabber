import { Person } from '@/database/models/person.model'
import React, { FC, ReactNode, createContext, useState } from 'react'

type Context = {
  approverList: Person[]
}

type OrderProviderProps = {
  approverList: Person[]
  children: ReactNode
}

const initialContext: Context = {
  approverList: [],
}

export const OrderContext = createContext<Context>(initialContext)

export const OrderProvider: FC<OrderProviderProps> = ({
  approverList,
  children,
}) => {
  const value = { approverList }

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}
