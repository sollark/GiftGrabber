'use client'

import { Person } from '@/database/models/person.model'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { FC } from 'react'

type ApplicantListProps = {
  applicants: Person[]
}

function mapPersonListToOptionList(people: Person[]) {
  return people.map((person, index) => ({
    id: index + 1,
    label: `${person.firstName} ${person.lastName}`,
  }))
}

const ApplicantList: FC<ApplicantListProps> = ({
  applicants,
}: ApplicantListProps) => {
  const applicantsOptionList = mapPersonListToOptionList(applicants)

  console.log('applicantsOptionList', applicantsOptionList)

  return (
    <Autocomplete
      disablePortal
      id='combo-box-demo'
      options={applicantsOptionList}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label='People' />}
    />
  )
}

export default ApplicantList
