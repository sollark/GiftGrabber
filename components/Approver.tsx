'use client'

import { Person } from '@/database/models/person.model'
import { useState } from 'react'
import PersonAutocomplete from './PersonAutocomplete'

type ApproverProps = {
  approverList: Person[]
}

const Approver = ({ approverList }: ApproverProps) => {
  const [approver, setApprover] = useState<Person | null>(null)

  function onSelectApprover(selectedPerson: Person) {
    console.log('onSelectApprover', selectedPerson)
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
