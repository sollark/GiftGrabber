'use client'

import { MultistepProvider } from '@/app/contexts/MultistepContext'
import { useMultistep } from '@/app/hooks/useMultistep'
import { FC, ReactNode } from 'react'

type MultistepNavigatorProps = {
  children: ReactNode[]
  [key: string]: any
}
const MultistepNavigator: FC<MultistepNavigatorProps> = ({ children }) => {
  const { step, steps, back, next, currentStepIndex, goTo } = useMultistep([
    ...children,
  ])

  return (
    <MultistepProvider goToPreviousStep={back} goToNextStep={next} goTo={goTo}>
      {step}
    </MultistepProvider>
  )
}

export default MultistepNavigator
