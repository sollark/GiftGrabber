import mongoose from 'mongoose'

let isConnected = false
const mongoUrl = process.env.MONGO_URL

if (!mongoUrl) {
  throw new Error('MongoDB URL not found in .env file')
}

export const connectToDatabase = async () => {
  mongoose.set('strictQuery', true)

  if (isConnected) {
    console.log('Already connected to MongoDB')
    return
  }

  try {
    await mongoose.connect(mongoUrl)

    isConnected = true
    console.log('Connected to MongoDB')
  } catch (error) {
    console.log(error)
  }

  return
}
