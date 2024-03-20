import { getEventDetails } from '@/app/actions/event.action'
import Section from '@/components/Section'
import OrderGifts from '@/components/order/OrderGifts'
import { FC } from 'react'

type SearchParamProps = {
  params: {
    eventId: string
  }
}

const ApplicantPage: FC<SearchParamProps> = async ({
  params: { eventId },
}: SearchParamProps) => {
  const event = await getEventDetails(eventId)
  if (!event) return <div>Event not found</div>

  return (
    <Section>
      <Section.Title>{event.name}</Section.Title>
      <OrderGifts event={event} />
    </Section>
  )
}

export default ApplicantPage
