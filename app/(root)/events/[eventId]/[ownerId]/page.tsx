import { getEventDetails } from '@/app/actions/event.action'
import { FC } from 'react'

type SearchParamProps = {
  params: {
    eventId: string
    ownerId: string
  }
}

const EventDetails: FC<SearchParamProps> = async ({
  params: { eventId, ownerId },
}: SearchParamProps) => {
  const event = await getEventDetails(eventId)
  console.log('event in EventDetails', event)

  return (
    <div>
      <h1>Event Details</h1>
    </div>
  )
}

export default EventDetails
