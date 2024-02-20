'use client'

import { ApplicantProvider } from '@/lib/ApplicantContext'
import AddPerson from './AddPerson'
import AddedPeopleList from './AddedPeopleList'
import PersonInfo from './PersonInfo'

type OrderGiftsProps = {
  event: any
}

const OrderGifts = (props: OrderGiftsProps) => {
  const { event } = props

  return (
    <ApplicantProvider applicants={event.applicantList}>
      <AddPerson />
      <PersonInfo />
      <AddedPeopleList />
    </ApplicantProvider>
  )
}

export default OrderGifts
