import { ErrorMessage } from '@hookform/error-message'
import { TextField } from '@mui/material'
import { FC } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
// import { textInputStyle } from '../../style/formStyle'
// import TextInput from './StyledTextInput'

type InputProps = {
  name: string
  label: string
  [key: string]: any // allow any other prop that is not explicitly defined
}

const ControlledTextInput: FC<InputProps> = (props: InputProps) => {
  const { label, name, ...rest } = props

  const {
    formState: { errors },
    control,
  } = useFormContext()

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          {...field}
          className='input'
          label={label}
          placeholder={label}
          error={!!errors[name]}
          helperText={<ErrorMessage name={name} />}
          //   {...textInputStyle}
          {...rest}
        />
      )}
    />
  )
}

export default ControlledTextInput
