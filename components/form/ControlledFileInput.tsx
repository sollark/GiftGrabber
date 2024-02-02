import { convertFileToBase64 } from '@/utils/utils'
import { MuiFileInput } from 'mui-file-input'
import { FC } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
// import { textInputStyle } from '../../style/formStyle'

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
    setValue,
    setError,
  } = useFormContext()

  const handleChange = async (newFile: any) => {
    setValue(name, newFile)
    try {
      const base64File = await convertFileToBase64(newFile)
      setValue('base64File', base64File)
    } catch (e: any) {
      setError(name, {
        type: 'error',
        message: 'Error converting file',
      })
    }
  }

  const getErrorMessage = (fieldState: any) => {
    const errorMessages = []
    for (const prop in fieldState.error) {
      if (fieldState.error[prop]?.message) {
        errorMessages.push(fieldState.error[prop].message)
      }
    }
    return errorMessages.join(' ')
  }

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const errorMessage = getErrorMessage(fieldState)
        return (
          <MuiFileInput
            {...field}
            label={label}
            placeholder={label}
            onChange={handleChange}
            InputProps={{
              inputProps: {
                accept: '.xls,.xlsx',
              },
            }}
            error={!!errors[name]}
            helperText={errorMessage}
            {...rest}
          />
        )
      }}
    />
  )
}

export default ControlledFileInput
