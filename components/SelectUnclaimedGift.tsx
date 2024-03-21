import { ApplicantContext } from '@/app/contexts/ApplicantContext'
import { useSafeContext } from '@/app/hooks/useSafeContext'
import { Person } from '@/database/models/person.model'
import { FC } from 'react'
import PersonAutocomplete from './form/PersonAutocomplete'

const SelectUnclaimedGift: FC = () => {
  const { giftList, setApplicantGifts, applicantList, setSelectedPerson } =
    useSafeContext(ApplicantContext)

  // On change person in autocomplete, how gift information for the selected person
  function onChangePerson(selectedPerson: Person) {
    setSelectedPerson(selectedPerson)
  }

  // On select person, add his gift to the applicant's gift list
  function onSelectGiftPasser(selectedPerson: Person) {
    if (!selectedPerson) return

    const selectedGift = giftList.find(
      (gift) => gift.owner._id === selectedPerson._id
    )

    if (selectedGift && !selectedGift.receiver)
      setApplicantGifts((prev) => [...prev, selectedGift])
  }

  return (
    <div>
      <PersonAutocomplete
        peopleList={applicantList}
        onSelectPerson={onSelectGiftPasser}
        onChangePerson={onChangePerson}
      />
    </div>
  )
}

export default SelectUnclaimedGift
