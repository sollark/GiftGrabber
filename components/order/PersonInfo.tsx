import { ApplicantContext } from '@/app/contexts/ApplicantContext'
import { useSafeContext } from '@/app/hooks/useSafeContext'

const PersonInfo = () => {
  const { selectedPerson, setSelectedPerson } = useSafeContext(ApplicantContext)

  return (
    <div>
      {selectedPerson && (
        <p>{`${selectedPerson.firstName} ${selectedPerson.lastName}`}</p>
      )}
    </div>
  )
}

export default PersonInfo
