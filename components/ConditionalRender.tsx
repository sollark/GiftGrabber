import { FC, ReactNode } from 'react'

type ConditionalRenderProps = {
  condition: boolean
  children: ReactNode
}

const ConditionalRender: FC<ConditionalRenderProps> = ({
  condition,
  children,
}) => {
  if (condition) {
    return <>{children}</>
  } else {
    return null
  }
}

export default ConditionalRender
