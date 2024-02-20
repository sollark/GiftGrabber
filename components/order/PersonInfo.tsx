import { ApplicantContext } from '@/lib/ApplicantContext'
import { useContext } from 'react'

const PersonInfo = () => {
  const { selectedPerson, setSelectedPerson } = useContext(ApplicantContext)

  return (
    <div>
      {selectedPerson && (
        <p>{`${selectedPerson.firstName} ${selectedPerson.lastName}`}</p>
      )}
    </div>
  )
}

export default PersonInfo
