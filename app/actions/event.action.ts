'use server'

import { connectToDatabase } from '@/database/connect'
import EventModel, { Event } from '@/database/models/event.model'
import GiftModel from '@/database/models/gift.model'
import PersonModel, { Person } from '@/database/models/person.model'
import { handleError } from '@/utils/utils'

type PersonWithoutId = Omit<Person, '_id'>

type EventForm = Omit<
  Event,
  '_id' | 'giftList' | 'applicantList' | 'approverList'
> & {
  applicantList: PersonWithoutId[]
  approverList: PersonWithoutId[]
}

export const createEvent = async (event: EventForm) => {
  const {
    name,
    email,
    eventId,
    ownerId,
    eventQRCodeBase64,
    ownerIdQRCodeBase64,
    applicantList,
    approverList,
  } = event

  try {
    await connectToDatabase()

    // Creates person for every applicant
    const applicantIds = await Promise.all(
      applicantList.map(async (person) => {
        const personDoc = await PersonModel.create(person)
        return personDoc._id
      })
    )

    // Creates person for every approver
    const approverIds = await Promise.all(
      approverList.map(async (person) => {
        const personDoc = await PersonModel.create(person)
        return personDoc._id
      })
    )

    // Creates gift for every applicant
    const giftIds = await Promise.all(
      applicantIds.map(async (applicantId) => {
        const giftDoc = await GiftModel.create({ owner: applicantId })
        return giftDoc._id
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
      giftList: giftIds,
      approverList: approverIds,
    })

    console.log('newEvent created:', newEvent)

    return newEvent ? true : false
  } catch (error) {
    console.log('Error in createEvent')
    handleError(error)
  }
}

export const getEventApplicants = async (eventId: string) => {
  try {
    await connectToDatabase()

    const event = await populateEventApplicants(
      EventModel.findOne(
        { eventId },
        { name: 1, applicantList: 1, giftList: 1 }
      )
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

    // error is here, event is not found
    console.log('getEventDetails, eventId:', eventId)
    const event = await populateEvent(
      EventModel.findOne(
        { eventId },
        { name: 1, email: 1, applicantList: 1, giftList: 1, approverList: 1 }
      )
    )
    if (!event) throw new Error('Event not found')

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

const populateEventApplicants = async (query: any) => {
  return query.populate({
    path: 'applicantList',
    model: 'Person',
    select: 'firstName lastName',
  })
}

const populateEvent = async (query: any) => {
  return query
    .populate({
      path: 'applicantList',
      model: 'Person',
      select: 'firstName lastName',
    })
    .populate({
      path: 'giftList',
      model: 'Gift',
      select: 'owner receiver order',
      populate: {
        path: 'owner',
        model: 'Person',
      },
    })
    .populate({
      path: 'approverList',
      model: 'Person',
      select: 'firstName lastName',
    })
}
