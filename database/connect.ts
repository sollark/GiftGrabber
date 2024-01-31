import mongoose from 'mongoose'

const mongoUrl = process.env.MONGO_URL

export const connectToDatabase = async () => {
  if (!mongoUrl) {
    throw new Error('MongoDB URL not found in .env file')
  }

  if (mongoose.connection.readyState) {
    console.log('Already connected to MongoDB')
    return
  }

  mongoose.set('strictQuery', true)

  try {
    await mongoose.connect(mongoUrl)
    console.log('Connected to MongoDB')
  } catch (error) {
    console.log(error)
  }

  return
}

export const isConnected = () => {
  return mongoose.connection.readyState === 1
}
