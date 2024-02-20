import { ApplicantContext } from '@/lib/ApplicantContext'
import { useContext } from 'react'
import ApplicantList from '../ApplicantList'
import StyledButton from '../StyledButton'

const SelectPerson = () => {
  const {
    applicant,
    setApplicant,
    selectedPerson,
    setApplicantGifts,
    giftList,
  } = useContext(ApplicantContext)

  function handleSelect() {
    console.log('handleSelect')
    if (!applicant) setApplicant(selectedPerson)

    if (selectedPerson) {
      const foundGift = giftList.find(
        (gift) => gift.owner._id === selectedPerson._id
      )
      if (foundGift) {
        console.log('Gift is available')
        setApplicantGifts((prev) => [...prev, foundGift])
      }
    }
  }

  return (
    <div>
      <h2>{applicant ? "Choose person's gift:" : 'Your name:'}</h2>
      <div className='flex'>
        <ApplicantList />
        {!applicant && (
          <StyledButton onClick={() => handleSelect()}>Identify</StyledButton>
        )}
      </div>
      <p>{applicant ? `${applicant.firstName} ${applicant.lastName}` : ''}</p>
    </div>
  )
}

export default SelectPerson
