import { ErrorMessage } from '@hookform/error-message'
import { TextField } from '@mui/material'
import { FC } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
// import { textInputStyle } from '../../style/formStyle'
// import TextInput from './StyledTextInput'

type InputProps = {
  name: string
  type: string
  label: string
  [key: string]: any // allow any other prop that is not explicitly defined
}

const ControlledTextInput: FC<InputProps> = (props: InputProps) => {
  const { type, label, name, ...rest } = props

  const {
    formState: { errors },
    control,
    setValue,
  } = useFormContext()

  const errorMessage = errors[name]?.message as string
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    // validate on change only after the first onBlur validation
    setValue(name, value, { shouldValidate: errorMessage ? true : false })
  }

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          {...field}
          type={type}
          label={label}
          id={name}
          placeholder={label}
          onChange={handleChange}
          error={!!errors[name]}
          helperText={
            <ErrorMessage
              name={name}
              message={('* ' + errors[name]?.message) as string}
            />
          }
          //   {...textInputStyle}
          {...rest}
        />
      )}
    />
  )
}

export default ControlledTextInput
