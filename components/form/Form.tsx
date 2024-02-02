'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FC, ReactElement, ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import StyledButton from '../StyledButton'

type Props = {
  children: ReactNode
  submit: (data: any) => void
  schema: any
  defaultValues?: any
  submitButton?: ReactElement
  [key: string]: any // allow any other prop that is not explicitly defined
}

const Form: FC<Props> = (props: Props) => {
  const { children, schema, defaultValues, submit, ...rest } = props

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    criteriaMode: 'all',
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  })
  const { handleSubmit, getValues } = methods

  const onSubmit = (data: any) => {
    const { getValues } = methods
    console.log('getValues in submit', getValues()) // i see file here
    console.log('data in submit', data) // no file in data

    submit(data)
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} {...rest}>
        {children}
        <div>
          <StyledButton type='submit'>Create</StyledButton>
        </div>
      </form>
    </FormProvider>
  )
}

export default Form
