import { Gift } from '@/database/models/gift.model'
import { FC } from 'react'

type GiftListProps = {
  gifts: Gift[]
}

const GiftList: FC<GiftListProps> = ({ gifts }) => {
  return (
    <div>
      <h3>GiftList</h3>
      <ul>
        {gifts.map((gift: Gift) => (
          <li key={gift._id.toString()}>
            {gift.owner.firstName} {gift.owner.lastName}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default GiftList
