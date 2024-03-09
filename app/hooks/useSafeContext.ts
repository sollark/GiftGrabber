import { Context, useContext } from 'react'

/**
 * Hook that returns the value of a given context. Throws an error if the context is undefined.
 * This is useful when you want to ensure that a component is wrapped in a provider for the given context.
 *
 * @param {Context<T | undefined>} context - The context to use.
 * @returns {T} - The value of the context.
 * @throws Will throw an error if the context is undefined.
 */

export function useSafeContext<T>(context: Context<T | undefined>): T {
  const contextValue = useContext(context)
  if (contextValue === undefined) {
    throw new Error('useSafeContext must be used within a Provider')
  }
  return contextValue
}
