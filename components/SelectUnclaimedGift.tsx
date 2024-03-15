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

    const selectedGift = giftList.find(
      (gift) => gift.owner._id === selectedPerson._id
    )

    if (selectedGift && selectedGift.receiver!!)
      setApplicantGifts((prev) => [...prev, selectedGift])
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
