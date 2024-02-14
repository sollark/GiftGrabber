import { getEvent } from '@/app/actions/event.action'
import ApplicantList from '@/components/ApplicantList'
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
    <div>
      <h1>List of People</h1>
      <ApplicantList applicants={event.applicantList} />
    </div>
  )
}

export default ApplicantPage
