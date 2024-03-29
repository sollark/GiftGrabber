import { Person } from '@/database/models/person.model'
import { customAlphabet } from 'nanoid'
import { convertExcelToJson } from './excelToJson'

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

export function generateOrderId(): string {
  const nanoid = customAlphabet('1234567890order', 15)
  const ownerId = nanoid()
  return ownerId
}

export async function excelToPersonList(file: File) {
  const jsonList = await convertExcelToJson(file)

  // Convert json list to array of Person objects
  const personArray: Omit<Person, '_id'>[] = jsonList.map((record) => ({
    firstName: record['firstName'],
    lastName: record['lastName'],
  }))

  return personArray
}

export const getQRcodeBuffer = async (qrRef: any) => {
  if (qrRef.current) {
    const canvas = qrRef.current.querySelector('canvas')
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png')
      const buffer = Buffer.from(pngUrl.split(',')[1], 'base64')

      return buffer
    }
  }
}

export const debounce = (
  func: (...args: any[]) => void,
  wait: number
): ((...args: any[]) => void) => {
  let timerId: NodeJS.Timeout | null = null
  return (...args: any[]): void => {
    if (timerId) clearTimeout(timerId)
    timerId = setTimeout(() => {
      func(...args)
    }, wait)
  }
}
