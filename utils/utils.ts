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
