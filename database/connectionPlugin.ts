import mongoose from 'mongoose'
import { isConnected } from './connect'

const connectionPlugin = (schema: mongoose.Schema) => {
  // Save original model methods
  const originalMethods = {
    find: schema.statics.find,
    findOne: schema.statics.findOne,
    findById: schema.statics.findById,
    findOneAndUpdate: schema.statics.findOneAndUpdate,
    // etc
  }

  // Wrap methods to check connection
  for (const [methodName, originalMethod] of Object.entries(originalMethods)) {
    schema.statics[methodName] = async function (
      this: mongoose.Model<mongoose.Document>,
      ...args
    ) {
      if (!isConnected()) {
        throw new Error('Not connected to database')
      }

      return originalMethod.apply(this, args)
    }
  }
}

export default connectionPlugin
