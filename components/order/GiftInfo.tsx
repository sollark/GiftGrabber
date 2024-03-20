import { ApplicantContext } from '@/app/contexts/ApplicantContext'
import { useSafeContext } from '@/app/hooks/useSafeContext'
import GiftComponent from '../GiftComponent'

const GiftInfo = () => {
  const { selectedPerson, giftList } = useSafeContext(ApplicantContext)
  if (!selectedPerson) return <></>

  const gift = giftList.find(
    (gift) => selectedPerson._id === gift.owner._id && !gift.receiver
  )
  if (!gift) return <></>

  return <GiftComponent gift={gift} />
}

export default GiftInfo
