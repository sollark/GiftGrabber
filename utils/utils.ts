import { customAlphabet } from 'nanoid'

export const handleError = (error: unknown) => {
  console.error('An error occurred:', error)
  throw new Error(typeof error === 'string' ? error : JSON.stringify(error))
}

export async function convertFileToBase64(
  file: File
): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

export function generateEventId(): string {
  const nanoid = customAlphabet('1234567890event', 10)
  const eventId = nanoid()
  return eventId
}
export function generateOwnerId(): string {
  const nanoid = customAlphabet('1234567890owner', 5)
  const ownerId = nanoid()
  return ownerId
}
