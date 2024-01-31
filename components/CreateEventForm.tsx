'use client'

import { EventSchema } from '@/utils/z/schema'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import ControlledTextInput from './form/ControlledTextInput'
import ErrorMessage from './form/ErrorMessage'
import Form from './form/Form'

const defaultValues = {
  eventName: '',
  eventEmail: '',
}

const CreateEventForm = () => {
  const router = useRouter()
  const [eventName, setEventName] = useState('')
  const [eventEmail, setEventEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0]
      const formData = new FormData()
      formData.append('file', file)
      // Rest of your code...
    } else {
      console.log('No file selected')
    }
  }

  const handleSubmit = (form: any) => {
    const { eventName, eventEmail, file } = form
    console.log('form', form, eventName, eventEmail, file)
    // const newEvent = createEvent()
    // router.push(`/`)
  }

  return (
    <Form
      schema={EventSchema}
      defaultValue={defaultValues}
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
      <ControlledTextInput
        name='file'
        label='List'
        type='file'
        onChange={handleFileUpload}
        variant='outlined'
        inputProps={{ style: { fontSize: 24 } }}
      />
      <ErrorMessage message={errorMessage} />
    </Form>
  )
}

export default CreateEventForm
