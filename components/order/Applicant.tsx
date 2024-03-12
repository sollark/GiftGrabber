'use client'

import { ApplicantContext } from '@/app/contexts/ApplicantContext'
import { MultistepContext } from '@/app/contexts/MultistepContext'
import { useSafeContext } from '@/app/hooks/useSafeContext'
import { Person } from '@/database/models/person.model'
import PersonAutocomplete from '../PersonAutocomplete'

const Applicant = () => {
  const { applicantList, setApplicant } = useSafeContext(ApplicantContext)
  const { goToNextStep } = useSafeContext(MultistepContext)

  function onSelectApplicant(selectedPerson: Person) {
    if (!selectedPerson) return

    setApplicant(selectedPerson)
    goToNextStep()
  }

  return (
    <div>
      <h2>Your name:</h2>
      <PersonAutocomplete
        peopleList={applicantList}
        onSelectPerson={onSelectApplicant}
      />
    </div>
  )
}

export default Applicant
