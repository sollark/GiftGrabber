'use client'

import { ReactNode, useState } from 'react'

export function useMultistep(steps: ReactNode[]): {
  currentStepIndex: number
  step: ReactNode
  steps: ReactNode[]
  next: () => void
  back: () => void
  goTo: (stepIndex: number) => void
  isFirstStep: boolean
  isLastStep: boolean
} {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  function next(): void {
    if (currentStepIndex < steps.length - 1)
      setCurrentStepIndex((prev) => prev + 1)
  }

  function back(): void {
    if (currentStepIndex > 0) setCurrentStepIndex((prev) => prev - 1)
  }

  function goTo(stepIndex: number): void {
    setCurrentStepIndex(stepIndex)
  }

  return {
    currentStepIndex,
    step: steps[currentStepIndex],
    steps,
    next,
    back,
    goTo,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === steps.length - 1,
  }
}
