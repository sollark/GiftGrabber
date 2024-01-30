'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import StyledButton from './StyledButton'

const CreateEventForm = () => {
  const router = useRouter()
  const [eventName, setEventName] = useState('')

  const handleEventNameChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEventName(event.target.value)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    // Do something with the event name
    console.log(eventName)
    // Navigate to events/newEvent
    router.push(`/newEvent`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Event Name:
        <input type='text' value={eventName} onChange={handleEventNameChange} />
      </label>
      <StyledButton type='submit'>Create</StyledButton>
    </form>
  )
}

export default CreateEventForm
