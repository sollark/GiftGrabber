'use client'

import { ApplicantProvider } from '@/app/contexts/ApplicantContext'
import { Event } from '@/database/models/event.model'
import MultistepNavigator from '../MultistepNavigator'
import SelectUnclaimedGift from '../SelectUnclaimedGift'
import Applicant from './Applicant'
import GiftList from './GiftList'
import PersonInfo from './PersonGiftInfo'

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
        <Applicant />
        <>
          <SelectUnclaimedGift />
          <PersonInfo />
          <GiftList />
        </>
      </MultistepNavigator>
    </ApplicantProvider>
  )
}

export default OrderGifts
