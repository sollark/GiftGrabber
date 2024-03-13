'use client'

import { FC, ReactNode } from 'react'

type ConditionalRenderProps = {
  condition: boolean
  children: ReactNode
}

const ConditionalRender: FC<ConditionalRenderProps> = ({
  condition,
  children,
}) => {
  return condition ? <>{children}</> : null
}

export default ConditionalRender
