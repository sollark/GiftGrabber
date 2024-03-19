'use client'

import { Person } from '@/database/models/person.model'
import { Autocomplete, TextField } from '@mui/material'
import { FC, SyntheticEvent, useState } from 'react'
import StyledButton from './buttons/StyledButton'

export type OptionType = {
  id: string
  label: string
  person: Person // {_id: Types.ObjectId, firstName: string, lastName: string}
}

type PersonAutocompleteProps = {
  peopleList: Person[]
  onSelectPerson: (person: Person) => void
}

const PersonAutocomplete: FC<PersonAutocompleteProps> = ({
  peopleList,
  onSelectPerson,
}: PersonAutocompleteProps) => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const optionList = mapPersonListToOptionList(peopleList)

  function handleSelect(event: SyntheticEvent, value: OptionType | null) {
    if (value) setSelectedPerson(value.person)
  }

  function confirm() {
    if (selectedPerson) onSelectPerson(selectedPerson)
  }

  return (
    <div>
      <Autocomplete
        disablePortal
        options={optionList}
        onChange={(event: any, value: any) => handleSelect(event, value)}
        sx={{ width: 300 }}
        renderInput={(params) => (
          <TextField {...params} label='Select option' />
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />
      <StyledButton onClick={confirm}>Select</StyledButton>
    </div>
  )
}

export default PersonAutocomplete

function mapPersonListToOptionList(people: Person[]): OptionType[] {
  return people.map((person) => ({
    id: person._id.toString(),
    label: `${person.firstName} ${person.lastName}`,
    person,
  }))
}
