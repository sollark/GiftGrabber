'use client'

import { MultistepProvider } from '@/app/contexts/MultistepContext'
import { useMultistep } from '@/app/hooks/useMultistep'
import { FC, ReactElement } from 'react'

type MultistepNavigatorProps = {
  children: ReactElement[]
  [key: string]: any
}
const MultistepNavigator: FC<MultistepNavigatorProps> = ({ children }) => {
  const { step, steps, back, next, currentStepIndex, isFirstStep, isLastStep } =
    useMultistep([...children])

  return (
    <MultistepProvider goToPreviousStep={back} goToNextStep={next}>
      {step}
    </MultistepProvider>
  )
}

export default MultistepNavigator
