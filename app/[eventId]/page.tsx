import GrabGift from '@/components/GrabGift'
import React from 'react'

const PeoplePage: React.FC = () => {
  const people = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Bob Johnson' },
  ]

  return (
    <div>
      <h1>List of People</h1>
      <ul>
        {people.map((person) => (
          <li key={person.id}>{person.name}</li>
        ))}
      </ul>
      <GrabGift />
    </div>
  )
}

export default PeoplePage
