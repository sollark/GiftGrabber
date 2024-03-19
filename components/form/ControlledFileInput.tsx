import { ErrorMessage } from '@hookform/error-message'
import { MuiFileInput } from 'mui-file-input'
import { FC } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

type InputProps = {
  name: string
  label: string
  [key: string]: any // allow any other prop that is not explicitly defined
}

const ControlledFileInput: FC<InputProps> = (props: InputProps) => {
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
        <MuiFileInput
          {...field}
          className='input'
          label={label}
          placeholder={label}
          InputProps={{
            inputProps: {
              accept: '.xls,.xlsx',
            },
          }}
          error={!!errors[name]}
          helperText={<ErrorMessage name={name} />}
          {...rest}
        />
      )}
    />
  )
}

export default ControlledFileInput
