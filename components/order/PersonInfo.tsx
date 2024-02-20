import { ApplicantContext } from '@/lib/ApplicantContext'
import { useContext } from 'react'
import StyledButton from '../StyledButton'

const PersonInfo = () => {
  const { selectedPerson, setSelectedPeople } = useContext(ApplicantContext)

  const handleAdd = () => {
    if (selectedPerson) {
      setSelectedPeople((prev) => [...prev, selectedPerson])
    }
  }

  return (
    <div>
      {selectedPerson && <p>{selectedPerson.firstName}</p>}
      <StyledButton onClick={handleAdd}>Add</StyledButton>
    </div>
  )
}

export default PersonInfo
