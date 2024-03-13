import { createContext, ReactNode } from 'react'

type MultistepContextProps = {
  children: ReactNode
  goToNextStep: () => void
  goToPreviousStep: () => void
  goTo: (stepIndex: number) => void
}

export type MultistepContextValue = {
  children: ReactNode
  goToNextStep: () => void
  goToPreviousStep: () => void
  goTo: (stepIndex: number) => void
}

export const MultistepContext = createContext<
  MultistepContextValue | undefined
>(undefined)

export const MultistepProvider = ({
  children,
  goToNextStep,
  goToPreviousStep,
  goTo,
}: MultistepContextProps) => {
  const contextValue: MultistepContextValue = {
    children,
    goToNextStep,
    goToPreviousStep,
    goTo,
  }

  return (
    <MultistepContext.Provider value={contextValue}>
      {children}
    </MultistepContext.Provider>
  )
}
