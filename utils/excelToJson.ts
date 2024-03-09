import * as XLSX from 'xlsx'

export const convertExcelToJson = async (
  excelFile: File
): Promise<Record<string, string>[]> => {
  try {
    const arrayBuffer = await excelFile.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

    const resultArray = jsonData.reduce(
      (result: Record<string, string>[], row: string[]) => {
        // Check if the row is not empty
        if (
          row.some((cell) => cell !== null && cell !== undefined && cell !== '')
        ) {
          const obj: Record<string, string> = {}
          for (let i = 0; i < jsonData[0].length; i++) {
            obj[jsonData[0][i]] = row[i]
          }
          result.push(obj)
        }
        return result
      },
      []
    )

    return resultArray.slice(1)
  } catch (error) {
    console.error('Error converting Excel to JSON:', error)
    throw error
  }
}
