import { convertFileToBase64 } from '@/utils/utils'
import { ErrorMessage } from '@hookform/error-message'
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

  // const handleChange = async (newFile: any) => {
  //   setValue(name, newFile)

  // try {
  //   const arrayBuffer = await newFile.arrayBuffer()
  //   setValue('arrayBuffer', arrayBuffer)
  // } catch (e: any) {
  //   setError(name, {
  //     type: 'error',
  //     message: 'Error buffering file',
  //   })
  // }

  // try {
  //   const base64File = await convertFileToBase64(newFile)
  //   setValue('base64File', base64File)
  // } catch (e: any) {
  //   setError(name, {
  //     type: 'error',
  //     message: 'Error converting file',
  //   })
  // }
  // }

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <MuiFileInput
          {...field}
          label={label}
          placeholder={label}
          // onChange={handleChange}
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
