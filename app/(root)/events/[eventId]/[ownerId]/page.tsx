import { getEventDetails } from '@/app/actions/event.action'
import ApproverList from '@/components/ApproverList'
import { Gift } from '@/database/models/gift.model'
import { Person } from '@/database/models/person.model'
import { Types } from 'mongoose'
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
  if (!event) return <div>Event not found</div>

  console.log('event in EventDetails', event)

  const { applicantList, giftList, approverList } = event

  return (
    <div>
      <h1>Event Details</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Is Grabbed</th>
          </tr>
        </thead>
        <tbody>
          {applicantList.map((applicant: Person) => (
            <tr key={applicant._id.toString()}>
              <td>{`${applicant.firstName} ${applicant.lastName}`}</td>
              <td>
                {giftList.find((gift: Gift) => gift.owner._id === applicant._id)
                  ?.receiver
                  ? 'Taken'
                  : 'Available'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ApproverList personArray={approverList} />
    </div>
  )
}

export default EventDetails
