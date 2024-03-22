'use client'

import { ApplicantContext } from '@/app/contexts/ApplicantContext'
import { MultistepContext } from '@/app/contexts/MultistepContext'
import { useSafeContext } from '@/app/hooks/useSafeContext'
import { Person } from '@/database/models/person.model'
import PersonAutocomplete from '../form/PersonAutocomplete'

const Applicant = () => {
  const {
    applicantList,
    setApplicant,
    setSelectedPerson,
    giftList,
    setApplicantGifts,
  } = useSafeContext(ApplicantContext)
  const { goToNextStep } = useSafeContext(MultistepContext)

  function onSelectApplicant(selectedPerson: Person) {
    if (!selectedPerson) return

    setApplicant(selectedPerson)

    setSelectedPerson(selectedPerson)

    const selectedGift = giftList.find(
      (gift) => gift.owner._id === selectedPerson._id
    )

    if (selectedGift && !selectedGift.receiver)
      setApplicantGifts((prev) => [...prev, selectedGift])

    goToNextStep()
  }

  return (
    <PersonAutocomplete
      peopleList={applicantList}
      onSelectPerson={onSelectApplicant}
      onChangePerson={(person) => {}}
    />
  )
}

export default Applicant
