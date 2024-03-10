import { getEventDetails } from '@/app/actions/event.action'
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
  console.log('event in ApplicantPage', event)

  return (
    <section className='full-screen flex align-center justify-center flex-col'>
      <h1>{event.name}</h1>
      <OrderGifts event={event} />
    </section>
  )
}

export default ApplicantPage
