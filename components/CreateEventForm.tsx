'use client'

import { convertExcelToJson } from '@/utils/excelToJson'
import { EventSchema } from '@/utils/z/schema'
import parse from 'html-react-parser'
import { useRouter } from 'next/navigation'
import { ReactNode, useState } from 'react'
import * as XLSX from 'xlsx'
import ControlledFileInput from './form/ControlledFileInput'
import ControlledTextInput from './form/ControlledTextInput'
import ErrorMessage from './form/ErrorMessage'
import Form from './form/Form'
import QRcode from './QRcode'

const defaultValues = {
  eventName: '',
  eventEmail: '',
  eventFile: undefined,
}

const CreateEventForm = () => {
  const router = useRouter()
  const [eventName, setEventName] = useState('')
  const [eventEmail, setEventEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [table, setTable] = useState<ReactNode>()

  const handleSubmit = async (data: any) => {
    console.log('handleSubmit', data)

    const json = await convertExcelToJson(data.eventFile)
    console.log('handleSubmit json', json)

    /* generate and display HTML */
    const workbook = XLSX.read(await data.eventFile.arrayBuffer())
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
    setTable(reactTable)

    // const newEvent = createEvent()
    // router.push(`/`)
  }

  return (
    <>
      <Form
        schema={EventSchema}
        defaultValues={defaultValues}
        submit={handleSubmit}>
        <ControlledTextInput
          name='eventName'
          label='Event name'
          type='text'
          variant='outlined'
          inputProps={{ style: { fontSize: 24 } }}
        />
        <ControlledTextInput
          name='eventEmail'
          label='Event email'
          type='email'
          variant='outlined'
          inputProps={{ style: { fontSize: 24 } }}
        />
        <ControlledFileInput
          name='eventFile'
          label='List of participants'
          type='file'
          variant='outlined'
          inputProps={{ style: { fontSize: 24 } }}
        />
        <ErrorMessage message={errorMessage} />
        {/* <div>{table}</div> */}
      </Form>
      <QRcode url='https://www.google.com' />
    </>
  )
}

export default CreateEventForm
