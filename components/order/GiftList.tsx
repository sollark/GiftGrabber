import { makeOrder } from '@/app/actions/order.action'
import { Gift } from '@/database/models/gift.model'
import { ApplicantContext } from '@/lib/ApplicantContext'
import { generateOrderId, getQRcodeBuffer } from '@/utils/utils'
import { useContext, useRef } from 'react'
import QRcode from '../QRcode'
import StyledButton from '../StyledButton'

const URL = 'https://gift-grabber.onrender.com/orders'
const orderId = generateOrderId()
const orderUrl = `${URL}/${orderId}`

const GiftList = () => {
  const { applicant, applicantGifts, setApplicantGifts } =
    useContext(ApplicantContext)!

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
      applicant,
      applicantGifts,
      orderId,
      orderQRCodeBase64
    )
  }

  return (
    <>
      <h3>Gift list</h3>
      <ul>
        {applicantGifts.map((gift: Gift) => (
          <li key={gift._id.toString()}>
            {gift.owner.firstName} {gift.owner.lastName}
            <StyledButton onClick={() => handleRemove(gift)}>
              Remove
            </StyledButton>
          </li>
        ))}
      </ul>
      <StyledButton onClick={handleOrder}>Take</StyledButton>
      <QRcode url={orderUrl} qrRef={orderQRCodeRef} />
    </>
  )
}

export default GiftList
