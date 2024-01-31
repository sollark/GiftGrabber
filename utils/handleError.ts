export const handleError = (error: unknown) => {
  console.error('An error occurred:', error)
  throw new Error(typeof error === 'string' ? error : JSON.stringify(error))
}
