import CreateEventForm from '@/components/createEventForm'

const Home = () => {
  return (
    <section className='full-screen flex align-center justify-center flex-col'>
      <h1>Create an event</h1>
      <CreateEventForm />
    </section>
  )
}

export default Home
