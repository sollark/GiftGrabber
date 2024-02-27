'use client'

import { ApplicantProvider } from '@/lib/ApplicantContext'
import GiftList from './GiftList'
import PersonInfo from './PersonInfo'
import SelectPerson from './SelectPerson'

type OrderGiftsProps = {
  event: any
}

const OrderGifts = (props: OrderGiftsProps) => {
  const { event } = props

  return (
    <ApplicantProvider
      approverList={event.approverList}
      applicantList={event.applicantList}
      giftList={event.giftList}>
      <SelectPerson />
      <PersonInfo />
      <GiftList />
    </ApplicantProvider>
  )
}

export default OrderGifts
