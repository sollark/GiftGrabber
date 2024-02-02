'use client'

import { EventSchema } from '@/utils/z/schema'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ControlledFileInput from './form/ControlledFileInput'
import ControlledTextInput from './form/ControlledTextInput'
import ErrorMessage from './form/ErrorMessage'
import Form from './form/Form'

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
    const { base64File, eventFile } = data
    console.log('handleSubmit', data)
    console.log('handleSubmit', base64File, eventFile)

    // const newEvent = createEvent()
    // router.push(`/`)
  }

  return (
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
  )
}

export default CreateEventForm
