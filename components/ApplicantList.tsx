'use client'

import { Person } from '@/database/models/person.model'
import { ApplicantContext } from '@/lib/ApplicantContext'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { Types } from 'mongoose'
import { FC, useContext } from 'react'

function mapPersonListToOptionList(
  people: (Person & { _id: Types.ObjectId })[]
) {
  return people.map((person, index) => ({
    id: index + 1,
    label: `${person.firstName} ${person.lastName}`,
    person: person,
  }))
}

const ApplicantList: FC = () => {
  const { applicantList, setSelectedPerson } = useContext(ApplicantContext)
  const applicantsOptionList = mapPersonListToOptionList(applicantList)

  console.log('applicantsOptionList', applicantsOptionList)

  return (
    <Autocomplete
      disablePortal
      id='combo-box-demo'
      options={applicantsOptionList}
      onChange={(event, value) => value && setSelectedPerson(value.person)}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label='People' />}
      isOptionEqualToValue={(option, value) => option.id === value.id}
    />
  )
}

export default ApplicantList
