import { makeOrder } from '@/app/actions/order.action'
import { ApplicantContext } from '@/app/contexts/ApplicantContext'
import { useSafeContext } from '@/app/hooks/useSafeContext'
import { Gift } from '@/database/models/gift.model'
import { generateOrderId, getQRcodeBuffer } from '@/utils/utils'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import GiftComponent from '../GiftComponent'
import QRcode from '../QRcode'
import StyledButton from '../buttons/AccentButton'
import SecondaryButton from '../buttons/SecondaryButton'
import { Box } from '@mui/material'

const URL = 'https://gift-grabber.onrender.com'
const orderId = generateOrderId()

const GiftList = () => {
  const router = useRouter()
  const {
    eventId,
    approverList,
    applicant,
    applicantGifts,
    setApplicantGifts,
  } = useSafeContext(ApplicantContext)

  const orderUrl = `${URL}/events/${eventId}/orders/${orderId}`
  const orderQRCodeRef = useRef<HTMLDivElement>(null)

  const handleRemove = (giftToRemove: Gift) => {
    setApplicantGifts((prev) =>
      prev.filter((gift) => gift._id !== giftToRemove._id)
    )
  }

  const handleOrder = async () => {
    if (!applicant) return

    const orderQRCodeBuffer = await getQRcodeBuffer(orderQRCodeRef)
    if (!orderQRCodeBuffer) {
      //  setErrorMessage('Error getting QR code')
      return
    }
    const orderQRCodeBase64 = orderQRCodeBuffer.toString('base64')

    const response = await makeOrder(
      approverList,
      applicant,
      applicantGifts,
      orderId,
      orderQRCodeBase64
    )

    if (response) router.push(`/events/${eventId}/orders/${orderId}`)
    else console.log('Error creating event')
    // if (response) router.push(`/events/${eventId}`)
  }

  return (
    <Box sx={{ paddingTop: '3rem' }}>
      <h3>{applicant?.firstName} gifts:</h3>
      <ul>
        {applicantGifts.map((gift: Gift) => (
          <li key={gift._id.toString()}>
            <div className='flex flex-row' style={{ marginBottom: '1rem' }}>
              <GiftComponent gift={gift} />
              <SecondaryButton onClick={() => handleRemove(gift)}>
                Remove
              </SecondaryButton>
            </div>
          </li>
        ))}
      </ul>
      <StyledButton onClick={handleOrder}>Take</StyledButton>
      <QRcode url={orderUrl} qrRef={orderQRCodeRef} />
    </Box>
  )
}

export default GiftList
