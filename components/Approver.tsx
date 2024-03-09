'use client'

import { OrderContext } from '@/app/contexts/OrderContext'
import { useSafeContext } from '@/app/hooks/useSafeContext'
import { Person } from '@/database/models/person.model'
import { FC } from 'react'
import PersonAutocomplete from './PersonAutocomplete'

const Approver: FC = () => {
  const { approverList, setApprover } = useSafeContext(OrderContext)

  console.log('Approver', approverList)
  function onSelectApprover(selectedPerson: Person) {
    if (selectedPerson) setApprover(selectedPerson)
  }

  return (
    <div>
      <PersonAutocomplete
        peopleList={approverList}
        onSelectPerson={onSelectApprover}
      />
    </div>
  )
}

export default Approver
