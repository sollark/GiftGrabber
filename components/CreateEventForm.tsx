'use client'

import { sendQRCodesToOwner } from '@/app/actions/email.action'
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
  applicantsFile: undefined,
  approversFile: undefined,
}

const URL = 'https://gift-grabber.onrender.com/events'
const eventId = generateEventId()
const ownerId = generateOwnerId()
const eventUrl = `${URL}/${eventId}`
const ownerUrl = `${URL}/${eventId}/${ownerId}`

const CreateEventForm = () => {
  const router = useRouter()

  const [errorMessage, setErrorMessage] = useState('')
  const eventQRCodeRef = useRef<HTMLDivElement>(null)
  const ownerQRCodeRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (data: any) => {
    console.log('Submitting...')

    const {
      eventName: name,
      eventEmail: email,
      applicantsFile,
      approversFile,
    } = data

    const applicantList = await excelToPersonList(applicantsFile)
    if (!applicantList) {
      setErrorMessage('Error getting an applicant list')
      return
    }

    const approverList = await excelToPersonList(approversFile)
    if (!approverList) {
      setErrorMessage('Error getting an approvers list')
      return
    }

    const eventQRCodeBuffer = await getQRcodeBuffer(eventQRCodeRef)
    const ownerIdQRCodeBuffer = await getQRcodeBuffer(ownerQRCodeRef)
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
      name,
      email,
      eventId,
      ownerId,
      eventQRCodeBase64,
      ownerIdQRCodeBase64,
      applicantList,
      approverList,
    })
    if (response) router.push(`/events/${eventId}/${ownerId}`)
    else console.log('Error creating event')
    // if (response) router.push(`/events/${eventId}`)
  }

  return (
    <>
      <Form
        schema={EventSchema}
        defaultValues={defaultValues}
        submit={handleSubmit}>
        <div>
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
        </div>
        <div>
          <ControlledFileInput
            name='applicantsFile'
            label='List of applicants'
            type='file'
            variant='outlined'
            inputProps={{ style: { fontSize: 24 } }}
          />
          <ControlledFileInput
            name='approversFile'
            label='List of approvers'
            type='file'
            variant='outlined'
            inputProps={{ style: { fontSize: 24 } }}
          />
        </div>
        <ErrorMessage message={errorMessage} />
      </Form>
      <QRcode url={eventUrl} qrRef={eventQRCodeRef} />
      <QRcode url={ownerUrl} qrRef={ownerQRCodeRef} />
    </>
  )
}

export default CreateEventForm
