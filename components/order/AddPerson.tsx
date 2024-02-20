import { ApplicantContext } from '@/lib/ApplicantContext'
import { useContext } from 'react'
import ApplicantList from '../ApplicantList'
import StyledButton from '../StyledButton'

const AddPerson = () => {
  const { applicants } = useContext(ApplicantContext)
  return (
    <div>
      <h2>Enter name</h2>
      <div className='flex'>
        <ApplicantList applicants={applicants} />
        <StyledButton>Identify</StyledButton>
      </div>
    </div>
  )
}

export default AddPerson
