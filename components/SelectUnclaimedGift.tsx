import { ApplicantContext } from '@/app/contexts/ApplicantContext'
import { useSafeContext } from '@/app/hooks/useSafeContext'
import { Person } from '@/database/models/person.model'
import { FC } from 'react'
import PersonAutocomplete from './PersonAutocomplete'

const SelectUnclaimedGift: FC = () => {
  const { giftList, setApplicantGifts, applicantList, setSelectedPerson } =
    useSafeContext(ApplicantContext)

  function onSelectGiftPasser(selectedPerson: Person) {
    if (!selectedPerson) return

    setSelectedPerson(selectedPerson)

    const selectedPersonsGift = giftList.find(
      (gift) => gift.owner._id === selectedPerson._id
    )

    if (selectedPersonsGift)
      setApplicantGifts((prev) => [...prev, selectedPersonsGift])
  }

  return (
    <div>
      <PersonAutocomplete
        peopleList={applicantList}
        onSelectPerson={onSelectGiftPasser}
      />
    </div>
  )
}

export default SelectUnclaimedGift
