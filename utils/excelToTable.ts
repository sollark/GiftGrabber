import * as XLSX from 'xlsx'
import parse from 'html-react-parser'

export async function excelToTable(file: File) {
  /* generate and display HTML */
  const workbook = XLSX.read(await file.arrayBuffer())
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const html = XLSX.utils.sheet_to_html(worksheet)

  // Parse the HTML string into a DOM object
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Extract the table element
  const table = doc.querySelector('table')

  if (!table) {
    console.error('No table found in the worksheet')
    return
  }

  // Convert the table element to a HTML string
  const tableHtml = table ? table.outerHTML : '<div></div>'
  const reactTable = parse(tableHtml)

  return reactTable
}
