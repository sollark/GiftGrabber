'use client'

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

  return (
    <div>
      <h1>Create New Event</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Event Name:
          <input
            type='text'
            value={eventName}
            onChange={handleEventNameChange}
          />
        </label>
        <button type='button' onClick={generateEventId}>
          Generate Event ID
        </button>
        <p>Event ID: {eventId}</p>
        <button type='submit'>Create Event</button>
      </form>
    </div>
  )
}

export default NewEventPage
