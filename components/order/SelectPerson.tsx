'use client'

import { ApplicantContext } from '@/lib/ApplicantContext'
import { useContext } from 'react'
import ApplicantList from '../ApplicantList'
import StyledButton from '../StyledButton'

const SelectPerson = () => {
  const { applicant, setApplicant, selectedPerson } =
    useContext(ApplicantContext)

  // only for choice an applicant
  function handleSelect() {
    console.log('handleSelect')
    if (!applicant) setApplicant(selectedPerson)
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
