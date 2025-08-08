'use client'

import { FC, ReactNode } from 'react'

type ConditionalRenderProps = {
  condition: boolean
  children: ReactNode
}

/**
 * Functional conditional render component.
 * Renders children only if the condition is true.
 */
const ConditionalRender: FC<ConditionalRenderProps> = ({
  condition,
  children,
}) => {
  return condition ? <>{children}</> : null
}

export default ConditionalRender
