'use server'

import { connectToDatabase } from '@/database/connect'
import EventModel, { Event } from '@/database/models/event.model'
import PersonModel from '@/database/models/person.model'
import { handleError } from '@/utils/utils'

export const createEvent = async (event: Event) => {
  const {
    name,
    email,
    eventId,
    ownerId,
    eventQRCodeBase64,
    ownerIdQRCodeBase64,
    applicantList,
  } = event

  console.log('in action, event"', event)

  try {
    await connectToDatabase()

    const applicantIds = await Promise.all(
      applicantList.map(async (person) => {
        const personDoc = await PersonModel.create(person)
        return personDoc._id
      })
    )

    const newEvent = await EventModel.create({
      name,
      email,
      eventId,
      ownerId,
      eventQRCodeBase64,
      ownerIdQRCodeBase64,
      applicantList: applicantIds,
    })

    return newEvent ? true : false
  } catch (error) {
    console.log('Error in createEvent')
    handleError(error)
  }
}

export const getEventApplicants = async (eventId: string) => {
  try {
    await connectToDatabase()

    const event = await populateEvent(
      EventModel.findOne({ eventId }, { name: 1, applicantList: 1 })
    )
    if (!event) throw new Error('Event not found')

    return JSON.parse(JSON.stringify(event))
  } catch (error) {
    console.log('Error in createEvent')
    handleError(error)
  }
}

export const getEventDetails = async (eventId: string) => {
  try {
    await connectToDatabase()

    const event = await populateEvent(
      EventModel.findOne({ eventId }, { name: 1, email: 1, applicantList: 1 })
    )
    if (!event) throw new Error('Event not found')

    // const gifts =

    return JSON.parse(JSON.stringify(event))
  } catch (error) {
    console.log('Error in createEvent')
    handleError(error)
  }
}

export const getAllEvents = async () => {
  try {
    const events = await EventModel.find()
    return JSON.parse(JSON.stringify(events))
  } catch (error) {
    console.log('Error in createEvent')
    handleError(error)
  }
}

const populateEvent = async (query: any) => {
  return query.populate({
    path: 'applicantList',
    model: 'Person',
    select: 'firstName lastName',
  })
}
