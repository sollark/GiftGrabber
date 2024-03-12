'use client'

import { ApplicantProvider } from '@/app/contexts/ApplicantContext'
import { Event } from '@/database/models/event.model'
import GiftList from './GiftList'
import PersonInfo from './PersonInfo'
import SelectPerson from './Applicant'
import MultistepNavigator from '../MultistepNavigator'

type OrderGiftsProps = {
  event: Event
}

const OrderGifts = (props: OrderGiftsProps) => {
  const { event } = props

  return (
    <ApplicantProvider
      eventId={event.eventId}
      approverList={event.approverList}
      applicantList={event.applicantList}
      giftList={event.giftList}>
      <MultistepNavigator>
        <SelectPerson />
        <>
          <PersonInfo />
          <GiftList />
        </>
      </MultistepNavigator>
    </ApplicantProvider>
  )
}

export default OrderGifts
