'use server'

import EventModel from '@/database/models/event.model'
import { handleError } from '@/utils/utils'

export const createEvent = async (event: Event) => {
  try {
    const newEvent = await EventModel.create(event)
    return JSON.parse(JSON.stringify(newEvent))
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
