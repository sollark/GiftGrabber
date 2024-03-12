'use client'

import { MultistepContext } from '@/app/contexts/MultistepContext'
import { OrderContext } from '@/app/contexts/OrderContext'
import { useSafeContext } from '@/app/hooks/useSafeContext'
import { OrderStatus } from '@/components/types/OrderStatus'
import { Person } from '@/database/models/person.model'
import { FC } from 'react'
import PersonAutocomplete from './PersonAutocomplete'

const Approver: FC = () => {
  const { order, approverList, setApprover } = useSafeContext(OrderContext)
  const { goToNextStep } = useSafeContext(MultistepContext)

  if (order.status === OrderStatus.COMPLETE) goToNextStep()

  function onSelectApprover(selectedPerson: Person) {
    if (!selectedPerson) return

    setApprover(selectedPerson)
    goToNextStep()
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
