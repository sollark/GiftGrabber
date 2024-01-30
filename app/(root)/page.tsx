import HeroSection from '@/components/HeroSection'
import CreateEventForm from '@/components/createEventForm'

const Home = () => {
  return (
    <>
      <HeroSection />
      <section
        style={{
          paddingTop: '10rem',
        }}
        className='flex align-center justify-center flex-col'>
        <h1>Create an event</h1>
        <CreateEventForm />
      </section>
    </>
  )
}

export default Home
