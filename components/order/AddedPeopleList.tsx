import { Person } from '@/database/models/person.model'
import { ApplicantContext } from '@/lib/ApplicantContext'
import { Types } from 'mongoose'
import { useContext } from 'react'
import StyledButton from '../StyledButton'

const AddedPeopleList = () => {
  const { selectedPeople, setSelectedPeople } = useContext(ApplicantContext)!

  const handleRemove = (person: Person & { _id: Types.ObjectId }) => {
    setSelectedPeople((prev) => prev.filter((p) => p._id !== person._id))
  }

  return (
    <ul>
      {selectedPeople.map((person: Person & { _id: Types.ObjectId }) => (
        <li key={person._id.toString()}>
          {person.firstName} {person.lastName}
          <StyledButton onClick={() => handleRemove(person)}>
            Remove
          </StyledButton>
        </li>
      ))}
    </ul>
  )
}

export default AddedPeopleList
