import { getEvent } from '@/app/actions/event.action'
import GrabGift from '@/components/GrabGift'
import React, { FC } from 'react'

type SearchParamProps = {
  params: {
    eventId: string
  }
}

const ApplicantPage: FC<SearchParamProps> = async ({
  params: { eventId },
}: SearchParamProps) => {
  const people = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Bob Johnson' },
  ]

  const event = await getEvent(eventId)
  console.log('event in people page', event)

  return (
    <div>
      <h1>List of People</h1>
      <ul>
        {people.map((person) => (
          <li key={person.id}>{person.name}</li>
        ))}
      </ul>
      <GrabGift />
      <div>
        <h1>Event details</h1>
      </div>
    </div>
  )
}

export default ApplicantPage
