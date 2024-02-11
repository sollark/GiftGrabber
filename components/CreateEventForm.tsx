'use client'

import { createEvent } from '@/app/actions/event.action'
import { Person } from '@/database/models/person.model'
import { convertExcelToJson } from '@/utils/excelToJson'
import { generateEventId, generateOwnerId } from '@/utils/utils'
import { EventSchema } from '@/utils/validator'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect, useRef, useState } from 'react'
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

async function excelToList(file: File) {
  const eventListJson = await convertExcelToJson(file)
  console.log('excelToList, eventListJson:', eventListJson)

  const applicantList: Person[] = eventListJson.map((record) => ({
    firstName: record['firstName'],
    lastName: record['lastName'],
    orders: [],
  }))
  console.log('excelToList, applicantList:', applicantList)
  return applicantList
}

const CreateEventForm = () => {
  const router = useRouter()

  const [eventQRCodeB, setEventQRCode] = useState<ReactNode>(null)
  const [ownerIdQRCode, setOwnerIdQRCode] = useState<ReactNode>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const eventQRCodeRef = useRef<HTMLDivElement>(null)
  const ownerIdQRCodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const url = `${URL}/${eventId}`
    console.log('url', url)
    const qrCodeNode = QRcode({ url, qrRef: eventQRCodeRef })
    setEventQRCode(qrCodeNode)
  }, [])
  useEffect(() => {
    const url = `${URL}/${eventId}/${ownerId}`
    console.log('url', url)
    const qrCodeNode = QRcode({ url, qrRef: ownerIdQRCodeRef })
    setOwnerIdQRCode(qrCodeNode)
  }, [])

  const handleSubmit = async (data: any) => {
    console.log('handleSubmit', data)

    const { eventName: name, eventEmail: email, eventFile } = data
    const applicantList = await excelToList(eventFile)
    if (!applicantList) {
      setErrorMessage('Error getting an applicant list')
      return
    }
    console.log('eventQRCodeRef', eventQRCodeRef.current)
    console.log('ownerIdQRCodeRef', ownerIdQRCodeRef.current)

    const response = await createEvent({
      name,
      email,
      applicantList,
      // eventQRCodeBuffer,
      // ownerIdQRCodeBuffer,
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
      {eventQRCodeB ? eventQRCodeB : <div>No QR code</div>}
      {ownerIdQRCode ? ownerIdQRCode : <div>No QR code</div>}
    </>
  )
}

export default CreateEventForm
