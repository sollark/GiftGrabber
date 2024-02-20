import { getEventApplicants } from '@/app/actions/event.action'
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
  const event = await getEventApplicants(eventId)
  // console.log('event in people page', event)

  return (
    <section className='full-screen flex align-center justify-center flex-col'>
      <h1>{event.name}</h1>
      <OrderGifts event={event} />
    </section>
  )
}

export default ApplicantPage
