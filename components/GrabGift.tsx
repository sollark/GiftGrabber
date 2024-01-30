'use client'

import React from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'

const GrabGift = () => {
  const people = [
    { id: 1, label: 'John Doe' },
    { id: 2, label: 'Jane Smith' },
    { id: 3, label: 'Bob Johnson' },
  ]

  return (
    <Autocomplete
      disablePortal
      id='combo-box-demo'
      options={people}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label='People' />}
    />
  )
}

export default GrabGift
