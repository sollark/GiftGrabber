'use client'

import { Person } from '@/database/models/person.model'
import { OrderContext } from '@/app/contexts/OrderContext'
import { FC, useContext } from 'react'
import PersonAutocomplete from './PersonAutocomplete'

const Approver: FC = () => {
  const { approverList, setApprover } = useContext(OrderContext)

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
