'use client'

import { convertExcelToJson } from '@/utils/excelToJson'
import { EventSchema } from '@/utils/validator'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import QRcode from './QRcode'
import ControlledFileInput from './form/ControlledFileInput'
import ControlledTextInput from './form/ControlledTextInput'
import ErrorMessage from './form/ErrorMessage'
import Form from './form/Form'
import { createEvent } from '@/app/actions/event.action'
import { Person } from '@/database/models/person.model'

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

  const handleSubmit = async (data: any) => {
    console.log('handleSubmit', data)
    const { eventName: name, eventEmail: email, eventFile } = data

    const eventListJson = await convertExcelToJson(eventFile)
    console.log('handleSubmit, eventListJson:', eventListJson)

    const applicantList: Person[] = eventListJson.map((record) => ({
      firstName: record['firstName'],
      lastName: record['lastName'],
      orders: [],
    }))
    console.log('handleSubmit, applicantList:', applicantList)

    const response = await createEvent({ name, email, applicantList })
    console.log('handleSubmit, response:', response)

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
      </Form>
      <QRcode url='https://www.google.com' />
    </>
  )
}

export default CreateEventForm
