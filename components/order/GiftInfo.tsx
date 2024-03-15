import { ApplicantContext } from '@/app/contexts/ApplicantContext'
import { useSafeContext } from '@/app/hooks/useSafeContext'

const GiftInfo = () => {
  const { selectedPerson, giftList } = useSafeContext(ApplicantContext)

  const isGiftAvailable =
    selectedPerson &&
    giftList.find(
      (gift) => selectedPerson._id === gift.owner._id && !gift.receiver
    )

  return (
    <div>
      {selectedPerson && (
        <p>{`${selectedPerson.firstName} ${selectedPerson.lastName} ${
          isGiftAvailable ? 'Available' : 'Taken'
        }`}</p>
      )}
    </div>
  )
}

export default GiftInfo
