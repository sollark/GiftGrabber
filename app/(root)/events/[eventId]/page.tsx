import { getEvent } from '@/app/actions/event.action'
import ApplicantList from '@/components/ApplicantList'
import StyledButton from '@/components/StyledButton'
import { FC } from 'react'

type SearchParamProps = {
  params: {
    eventId: string
  }
}

const ApplicantPage: FC<SearchParamProps> = async ({
  params: { eventId },
}: SearchParamProps) => {
  const event = await getEvent(eventId)
  console.log('event in people page', event)

  return (
    <section className='full-screen flex align-center justify-center flex-col'>
      <h1>Enter name</h1>
      <div className='flex'>
        <ApplicantList applicants={event.applicantList} />
        <StyledButton>Identify</StyledButton>
      </div>
    </section>
  )
}

export default ApplicantPage
