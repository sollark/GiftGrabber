'use client'

import { Person } from '@/database/models/person.model'
import { Autocomplete, TextField } from '@mui/material'
import { FC, SyntheticEvent } from 'react'

export type OptionType = {
  id: string
  label: string
  person: Person // {_id: Types.ObjectId, firstName: string, lastName: string}
}

type PersonAutocompleteProps = {
  peopleList: Person[]
  onChange: (event: SyntheticEvent, value: OptionType | null) => void
}

const PersonAutocomplete: FC<PersonAutocompleteProps> = ({
  peopleList,
  onChange,
}) => {
  const optionList = mapPersonListToOptionList(peopleList)

  return (
    <Autocomplete
      disablePortal
      id='combo-box-demo'
      options={optionList}
      onChange={onChange}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label='Select option' />}
      isOptionEqualToValue={(option, value) => option.id === value.id}
    />
  )
}

export default PersonAutocomplete

function mapPersonListToOptionList(people: Person[]) {
  return people.map((person) => ({
    id: person._id.toString(),
    label: `${person.firstName} ${person.lastName}`,
    person: person,
  }))
}
