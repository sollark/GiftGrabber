import { Gift } from '@/database/models/gift.model'
import { FC } from 'react'

type GiftProps = {
  gift: Gift
}

const GiftComponent: FC<GiftProps> = ({ gift }) => {
  if (!gift) return <></>

  const { owner, receiver } = gift
  const giftStatus = receiver ? 'Claimed' : 'Available'

  return <p>{`${owner.firstName} ${owner.lastName}: ${giftStatus}`}</p>
}

export default GiftComponent
