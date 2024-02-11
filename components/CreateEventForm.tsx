'use client'

import { createEvent } from '@/app/actions/event.action'
import {
  excelToPersonList,
  generateEventId,
  generateOwnerId,
  getQRcodeBuffer,
} from '@/utils/utils'
import { EventSchema } from '@/utils/validator'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import QRcode from './QRcode'
import ControlledFileInput from './form/ControlledFileInput'
import ControlledTextInput from './form/ControlledTextInput'
import ErrorMessage from './form/ErrorMessage'
import Form from './form/Form'

const defaultValues = {
  eventName: '',
  eventEmail: '',
  eventFile: undefined,
}

const URL = 'http://gift-grabber.onrender.com'
const eventId = generateEventId()
const ownerId = generateOwnerId()
const eventUrl = `${URL}/${eventId}}`
const ownerUrl = `${URL}/${eventId}/${ownerId}`

const CreateEventForm = () => {
  const router = useRouter()

  const [errorMessage, setErrorMessage] = useState('')
  const eventQRCodeRef = useRef<HTMLDivElement>(null)
  const ownerIdQRCodeRef = useRef<HTMLDivElement>(null)
  const handleSubmit = async (data: any) => {
    console.log('handleSubmit', data)

    const { eventName: name, eventEmail: email, eventFile } = data
    const applicantList = await excelToPersonList(eventFile)
    if (!applicantList) {
      setErrorMessage('Error getting an applicant list')
      return
    }

    const eventQRCodeBuffer = await getQRcodeBuffer(eventQRCodeRef)
    const ownerIdQRCodeBuffer = await getQRcodeBuffer(ownerIdQRCodeRef)
    if (!eventQRCodeBuffer || !ownerIdQRCodeBuffer) {
      setErrorMessage('Error getting QR code')
      return
    }

    const response = await createEvent({
      name,
      email,
      applicantList,
      eventQRCodeBuffer,
      ownerIdQRCodeBuffer,
    })
    console.log('handleSubmit, response:', response)

    // const newEvent = createEvent()
    // router.push(`/`)
  }

  return (
    <>
      <Form
        schema={EventSchema}
        defaultValues={defaultValues}
        submit={handleSubmit}>
        <ControlledTextInput
          name='eventName'
          label='Event name'
          type='text'
          variant='outlined'
          inputProps={{ style: { fontSize: 24 } }}
        />
        <ControlledTextInput
          name='eventEmail'
          label='Event email'
          type='email'
          variant='outlined'
          inputProps={{ style: { fontSize: 24 } }}
        />
        <ControlledFileInput
          name='eventFile'
          label='List of participants'
          type='file'
          variant='outlined'
          inputProps={{ style: { fontSize: 24 } }}
        />
        <ErrorMessage message={errorMessage} />
      </Form>
      <QRcode url={eventUrl} qrRef={eventQRCodeRef} />
      <QRcode url={ownerUrl} qrRef={ownerIdQRCodeRef} />
    </>
  )
}

export default CreateEventForm
