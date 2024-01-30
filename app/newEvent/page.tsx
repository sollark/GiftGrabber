'use client'

import StyledButton from '@/components/StyledButton'
import { useState } from 'react'

const NewEventPage: React.FC = () => {
  // const history = useHistory();
  const [eventName, setEventName] = useState('')
  const [eventId, setEventId] = useState('')

  const handleEventNameChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEventName(event.target.value)
  }

  const generateEventId = () => {
    // Generate event ID logic here
    const newEventId = Math.random().toString(36).substring(7)
    setEventId(newEventId)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    // Save event logic here

    // Navigate to event/:eventId page
    // history.push(`/event/${eventId}`);
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Handle file upload logic here
  }

  return (
    <section className='full-screen flex align-center justify-center flex-col'>
      <h1>Create New Event</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Event Password:
          <input
            type='text'
            value={eventName}
            onChange={handleEventNameChange}
          />
        </label>
        <label>
          Upload Excel File:
          <input type='file' accept='.xlsx,.xls' onChange={handleFileUpload} />
        </label>

        <p>Event ID: {eventId}</p>
        <StyledButton type='submit'>Create Event</StyledButton>
      </form>
    </section>
  )
}

export default NewEventPage
