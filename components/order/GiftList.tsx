import { Gift } from '@/database/models/gift.model'
import { ApplicantContext } from '@/lib/ApplicantContext'
import { Types } from 'mongoose'
import { useContext } from 'react'
import StyledButton from '../StyledButton'

const GiftList = () => {
  const { applicantGifts, setApplicantGifts } = useContext(ApplicantContext)!

  const handleRemove = (giftToRemove: Gift & { _id: Types.ObjectId }) => {
    setApplicantGifts((prev) =>
      prev.filter((gift) => gift._id !== giftToRemove._id)
    )
  }

  return (
    <>
      <h3>Gift list</h3>
      <ul>
        {applicantGifts.map((gift: Gift & { _id: Types.ObjectId }) => (
          <li key={gift._id.toString()}>
            {gift.owner.firstName} {gift.owner.lastName}
            <StyledButton onClick={() => handleRemove(gift)}>
              Remove
            </StyledButton>
          </li>
        ))}
      </ul>
    </>
  )
}

export default GiftList
