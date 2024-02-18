import { getEventDetails } from '@/app/actions/event.action'
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
  console.log('event in EventDetails', event)

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
          {event.applicantList.map(
            (applicant: Person & { _id: Types.ObjectId }) => (
              <tr key={applicant._id.toString()}>
                <td>{`${applicant.firstName} ${applicant.lastName}`}</td>
                <td>
                  {event.giftList.find(
                    (gift: Gift) =>
                      gift.owner.firstName === applicant.firstName &&
                      gift.owner.lastName === applicant.lastName
                  )
                    ? 'Yes'
                    : 'No'}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  )
}

export default EventDetails
