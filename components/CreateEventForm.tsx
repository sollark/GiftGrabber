'use client'

import { convertExcelToJson } from '@/utils/excelToJson'
import { EventSchema } from '@/utils/validator'
import parse from 'html-react-parser'
import { useRouter } from 'next/navigation'
import { ReactNode, useState } from 'react'
import ControlledFileInput from './form/ControlledFileInput'
import ControlledTextInput from './form/ControlledTextInput'
import ErrorMessage from './form/ErrorMessage'
import Form from './form/Form'
import QRcode from './QRcode'
import { excelToTable } from '@/utils/excelToTable'

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

    const eventListJson = await convertExcelToJson(data.eventFile)
    console.log('handleSubmit, eventListJson:', eventListJson)

    const reactTable = excelToTable(data.eventFile)
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
