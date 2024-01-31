import CreateEventForm from '@/components/CreateEventForm'

const NewEventPage: React.FC = () => {
  return (
    <section className='full-screen flex align-center justify-center flex-col'>
      <h1>Create New Event</h1>
      <CreateEventForm />
    </section>
  )
}

export default NewEventPage
