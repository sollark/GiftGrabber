'use client'

import { Gift } from '@/database/models/gift.model'
import { Person } from '@/database/models/person.model'
import { ApplicantContext } from '@/lib/ApplicantContext'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { FC, SyntheticEvent, useContext } from 'react'

type OptionType = {
  id: number
  label: string
  person: Person // {_id: Types.ObjectId, firstName: string, lastName: string}
}

const ApplicantList: FC = () => {
  const { applicantList, setSelectedPerson, giftList, setApplicantGifts } =
    useContext(ApplicantContext)
  const applicantsOptionList = mapPersonListToOptionList(applicantList)

  function handleSelect(event: SyntheticEvent, value: OptionType | null) {
    if (value) {
      setSelectedPerson(value.person)

      // if selected person has a gift, add it to the applicant's gift list
      const gift = availableGift(value.person, giftList)
      if (gift) setApplicantGifts((prev) => [...prev, gift])
    }
  }

  return (
    <Autocomplete
      disablePortal
      options={applicantsOptionList}
      onChange={(event: any, value: any) => handleSelect(event, value)}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label='People' />}
      isOptionEqualToValue={(option, value) => option.id === value.id}
    />
  )
}

export default ApplicantList

function mapPersonListToOptionList(people: Person[]) {
  return people.map((person) => ({
    id: person._id.toString(),
    label: `${person.firstName} ${person.lastName}`,
    person: person,
  }))
}

function availableGift(person: Person, giftList: Gift[]) {
  for (let gift of giftList) {
    if (gift.owner._id === person._id && gift.receiver !== null) {
      return gift
    }
  }

  return null
}
