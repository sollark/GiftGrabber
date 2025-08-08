import { Gift } from '@/database/models/gift.model'
import { Box } from '@mui/material'
import { FC } from 'react'

type GiftProps = {
  gift: Gift
}

/**
 * Functional GiftComponent.
 * Displays gift owner and status.
 */
const GiftComponent: FC<GiftProps> = ({ gift }) => {
  if (!gift) return <></>

  const { owner, receiver } = gift
  const giftStatus = receiver ? 'Claimed' : 'Available'

  return (
    <Box
      sx={{
        padding: '1rem',
      }}>{`${owner.firstName} ${owner.lastName}: ${giftStatus}`}</Box>
  )
}

export default GiftComponent
