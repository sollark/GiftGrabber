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
import { sendQRCodesToOwner } from '@/app/actions/email.action'

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

    const eventQRCodeBase64 = eventQRCodeBuffer.toString('base64')
    const ownerIdQRCodeBase64 = ownerIdQRCodeBuffer.toString('base64')

    const emailResponse = await sendQRCodesToOwner({
      to: email,
      html: `<html>
      <h1>QR codes</h1>
      </html>`,
      attachments: [
        {
          filename: 'event QR code.png',
          content: eventQRCodeBase64,
          encoding: 'base64',
        },
        {
          filename: 'owner QR code.png',
          content: ownerIdQRCodeBase64,
          encoding: 'base64',
        },
      ],
    })

    const response = await createEvent({
      _id: '',
      name,
      email,
      eventId,
      ownerId,
      eventQRCodeBase64,
      ownerIdQRCodeBase64,
      applicantList,
    })
    if (response) router.push(`/events/${eventId}/${ownerId}`)
    // if (response) router.push(`/events/${eventId}`)
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
