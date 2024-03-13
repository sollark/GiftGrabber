'use client'

import { MultistepContext } from '@/app/contexts/MultistepContext'
import { OrderContext } from '@/app/contexts/OrderContext'
import { useSafeContext } from '@/app/hooks/useSafeContext'
import { OrderStatus } from '@/components/types/OrderStatus'
import { Person } from '@/database/models/person.model'
import { FC } from 'react'
import ConditionalRender from './ConditionalRender'
import PersonAutocomplete from './PersonAutocomplete'

const Approver: FC = () => {
  const { order, approverList, setApprover } = useSafeContext(OrderContext)
  const { goToNextStep } = useSafeContext(MultistepContext)

  function onSelectApprover(selectedPerson: Person) {
    if (!selectedPerson) return

    setApprover(selectedPerson)
    goToNextStep()
  }

  return (
    <div>
      <ConditionalRender condition={order.status !== OrderStatus.COMPLETE}>
        <PersonAutocomplete
          peopleList={approverList}
          onSelectPerson={onSelectApprover}
        />
      </ConditionalRender>
    </div>
  )
}

export default Approver
