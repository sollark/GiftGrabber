import { createContext, ReactNode } from 'react'

type MultistepContextProps = {
  children: ReactNode
  goToNextStep: () => void
  goToPreviousStep: () => void
}

export type MultistepContextValue = {
  children: ReactNode
  goToNextStep: () => void
  goToPreviousStep: () => void
}

export const MultistepContext = createContext<
  MultistepContextValue | undefined
>(undefined)

export const MultistepProvider = ({
  children,
  goToNextStep,
  goToPreviousStep,
}: MultistepContextProps) => {
  const contextValue: MultistepContextValue = {
    children,
    goToNextStep,
    goToPreviousStep,
  }

  return (
    <MultistepContext.Provider value={contextValue}>
      {children}
    </MultistepContext.Provider>
  )
}
