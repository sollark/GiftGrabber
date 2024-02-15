import { FC } from 'react'

type SearchParamProps = {
  params: {
    ownerId: string
  }
}

const EventDetails: FC<SearchParamProps> = ({
  params: { ownerId },
}: SearchParamProps) => {
  return (
    <div>
      <h1>Event Details</h1>
    </div>
  )
}

export default EventDetails
