import { Schema, Types, model, models } from 'mongoose'

export type Person = {
  firstName: string
  lastName: string
}

type PersonDoc = {
  _id: Types.ObjectId
  firstName: string
  lastName: string
}

const personSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
})

const PersonModel = models.Person || model<PersonDoc>('Person', personSchema)

export default PersonModel
