import { convertFileToBase64 } from '@/utils/utils'
import { MuiFileInput } from 'mui-file-input'
import { FC } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
// import { textInputStyle } from '../../style/formStyle'
// import TextInput from './StyledTextInput'

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
    getValues,
  } = useFormContext()

  // const [file, setFile] = useState(null)

  const handleChange = async (newFile: any) => {
    const base64File = await convertFileToBase64(newFile)
    setValue(name, base64File)

    const formValues = getValues()
    // Log names
    console.log('formvalue', Object.keys(formValues))
    console.log('formvalue', name, formValues[name])
  }

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const { value } = field

        return (
          <MuiFileInput
            {...field}
            label={label}
            placeholder={label}
            value={value}
            onChange={handleChange}
            inputProps={{ accept: '.xls,.xlsx' }}
            helperText={fieldState.invalid ? 'File is invalid' : ''}
            error={!!errors[name]}
            {...rest}
          />
        )
      }}
    />
  )
}

export default ControlledFileInput
