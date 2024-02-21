'use client'

import { Person } from '@/database/models/person.model'
import { ApplicantContext } from '@/lib/ApplicantContext'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { Types } from 'mongoose'
import { FC, SyntheticEvent, useContext } from 'react'

type OptionType = {
  id: number
  label: string
  person: Person & { _id: Types.ObjectId }
}

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
  const { applicantList, setSelectedPerson, giftList, setApplicantGifts } =
    useContext(ApplicantContext)
  const applicantsOptionList = mapPersonListToOptionList(applicantList)

  console.log('applicantsOptionList', applicantsOptionList)

  function handleSelect(event: SyntheticEvent, value: OptionType | null) {
    console.log('event', event)
    console.log('value', value)

    if (value) {
      setSelectedPerson(value.person)

      const foundGift = giftList.find(
        (gift) => gift.owner._id === value.person._id
      )

      if (foundGift) {
        console.log('Gift is available')
        setApplicantGifts((prev) => [...prev, foundGift])
      }
    }
  }

  return (
    <Autocomplete
      disablePortal
      id='combo-box-demo'
      options={applicantsOptionList}
      onChange={(event: any, value: any) => handleSelect(event, value)}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label='People' />}
      isOptionEqualToValue={(option, value) => option.id === value.id}
    />
  )
}

export default ApplicantList
