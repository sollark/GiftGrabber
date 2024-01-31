'use client'

import { TextField, styled } from '@mui/material'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import StyledButton from './StyledButton'

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused fieldset': {
      borderColor: 'white',
    },
  },
})

const CreateEventForm = () => {
  const router = useRouter()
  const [eventName, setEventName] = useState('')
  const [eventEmail, setEventEmail] = useState('')

  const handleEventNameChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEventName(event.target.value)
  }

  const handleEventEmailChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEventEmail(event.target.value)
  }

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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    // Do something with the event name
    console.log(eventName)
    // Navigate to events/newEvent
    router.push(`/`)
  }

  return (
    <form
      style={{
        width: '100%',
        maxWidth: '30rem',
        padding: '1rem 2rem',
        gap: '2rem',
      }}
      className='flex flex-col'
      onSubmit={handleSubmit}>
      <StyledTextField
        id='event-name'
        variant='outlined'
        onChange={handleEventNameChange}
        inputProps={{ style: { fontSize: 24 } }}
      />
      <StyledTextField
        id='event-email'
        variant='outlined'
        onChange={handleEventEmailChange}
        inputProps={{ style: { fontSize: 24 } }}
      />
      <TextField type='file' onChange={handleFileUpload} />

      <StyledButton type='submit'>Create</StyledButton>
    </form>
  )
}

export default CreateEventForm
