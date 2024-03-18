import { FC } from 'react'
import HeroButton from './HeroButton'

const HeroSection: FC = () => {
  return (
    <section className='hero-section'>
      <h1>Welcome to Gift Grabber</h1>
      <h3>Effortless Gift-Giving with Our Event Management App</h3>
      <p>
        Our web application simplifies the process of gift-giving. Upload your
        applicant and approver lists, monitor gift receipt, and ensure everyone
        feels special at your event.
      </p>
      <p>
        Guests can easily claim their gifts by scanning the event QR code and
        sending their name.Every guest leaves happy.
      </p>
      <HeroButton />
    </section>
  )
}

export default HeroSection
