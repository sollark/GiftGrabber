import { makeOrder } from "@/app/actions/order.action";
import { ApplicantContext } from "@/app/contexts/ApplicantContext";
import { useSafeContext } from "@/app/hooks/useSafeContext";
import { Gift } from "@/database/models/gift.model";
import { generateOrderId, getQRcodeBuffer } from "@/utils/utils";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import GiftComponent from "../GiftComponent";
import QRcode from "../QRcode";
import StyledButton from "../buttons/AccentButton";
import SecondaryButton from "../buttons/SecondaryButton";
import { Box } from "@mui/material";

const BASE_URL = "https://gift-grabber.onrender.com";
const ORDER_ID = generateOrderId();

const GiftList = () => {
  const router = useRouter();
  const {
    eventId,
    approverList,
    applicant,
    applicantGifts,
    setApplicantGifts,
  } = useSafeContext(ApplicantContext);

  const orderUrl = `${BASE_URL}/events/${eventId}/orders/${ORDER_ID}`;
  const orderQRCodeRef = useRef<HTMLDivElement>(null!);

  const handleRemoveGift = (giftToRemove: Gift) => {
    setApplicantGifts((previousGifts) =>
      previousGifts.filter((gift) => gift._id !== giftToRemove._id)
    );
  };

  const processOrder = async () => {
    if (!applicant) return;

    const orderQRCodeBuffer = await getQRcodeBuffer(orderQRCodeRef);
    if (!orderQRCodeBuffer) {
      console.error("Error getting QR code");
      return;
    }

    const orderQRCodeBase64 = orderQRCodeBuffer.toString("base64");

    const response = await makeOrder(
      approverList,
      applicant,
      applicantGifts,
      ORDER_ID,
      orderQRCodeBase64
    );

    if (response) {
      router.push(`/events/${eventId}/orders/${ORDER_ID}`);
    } else {
      console.error("Error creating order");
    }
  };

  const renderGiftItem = (gift: Gift) => (
    <li key={gift._id.toString()}>
      <div className="flex flex-row" style={{ marginBottom: "1rem" }}>
        <GiftComponent gift={gift} />
        <SecondaryButton onClick={() => handleRemoveGift(gift)}>
          Remove
        </SecondaryButton>
      </div>
    </li>
  );

  return (
    <Box sx={{ paddingTop: "3rem" }}>
      <h3>{applicant?.firstName} gifts:</h3>
      <ul>{applicantGifts.map(renderGiftItem)}</ul>
      <StyledButton onClick={processOrder}>Take</StyledButton>
      <QRcode url={orderUrl} qrRef={orderQRCodeRef} />
    </Box>
  );
};

export default GiftList;
