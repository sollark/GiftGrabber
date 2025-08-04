import { makeOrder } from "@/app/actions/order.action";
import { ApplicantContext } from "@/app/contexts/ApplicantContext";
import { useSafeContext } from "@/app/hooks/useSafeContext";
import { Gift } from "@/database/models/gift.model";
import { generateOrderId, getQRcodeBuffer } from "@/utils/utils";
import { useRouter } from "next/navigation";
import { useRef, useCallback, useMemo } from "react";
import GiftComponent from "../GiftComponent";
import QRcode from "../QRcode";
import StyledButton from "../buttons/AccentButton";
import SecondaryButton from "../buttons/SecondaryButton";
import { Box } from "@mui/material";

const BASE_URL = "https://gift-grabber.onrender.com";

const GIFT_LIST_STYLES = {
  container: { paddingTop: "3rem" },
  giftItem: { marginBottom: "1rem" },
} as const;

const MESSAGES = {
  NO_GIFTS: "No gifts selected",
  QR_CODE_ERROR: "Failed to generate QR code buffer",
  NO_APPLICANT_ERROR: "No applicant selected",
  ORDER_ERROR: "Error creating order:",
} as const;

const GiftList = () => {
  const router = useRouter();
  const {
    eventId,
    approverList,
    applicant,
    applicantGifts,
    setApplicantGifts,
  } = useSafeContext(ApplicantContext);

  const orderQRCodeRef = useRef<HTMLDivElement>(null!);

  // Memoize computed values that don't change frequently
  const orderId = useMemo(() => generateOrderId(), []);
  const orderUrl = useMemo(
    () => `${BASE_URL}/events/${eventId}/orders/${orderId}`,
    [eventId, orderId]
  );

  const applicantDisplayName = useMemo(
    () => applicant?.firstName || "Unknown",
    [applicant?.firstName]
  );

  const hasGifts = useMemo(
    () => applicantGifts.length > 0,
    [applicantGifts.length]
  );

  const handleRemoveGift = useCallback(
    (giftToRemove: Gift) => {
      setApplicantGifts((previousGifts) =>
        previousGifts.filter((gift) => gift._id !== giftToRemove._id)
      );
    },
    [setApplicantGifts]
  );

  const generateQRCodeData = useCallback(async (): Promise<string | null> => {
    const orderQRCodeBuffer = await getQRcodeBuffer(orderQRCodeRef);
    if (!orderQRCodeBuffer) {
      console.error(MESSAGES.QR_CODE_ERROR);
      return null;
    }
    return orderQRCodeBuffer.toString("base64");
  }, []);

  const submitOrder = useCallback(
    async (qrCodeData: string): Promise<boolean> => {
      if (!applicant) {
        console.error(MESSAGES.NO_APPLICANT_ERROR);
        return false;
      }

      try {
        const response = await makeOrder(
          approverList,
          applicant,
          applicantGifts,
          orderId,
          qrCodeData
        );
        return !!response;
      } catch (error) {
        console.error(MESSAGES.ORDER_ERROR, error);
        return false;
      }
    },
    [approverList, applicant, applicantGifts, orderId]
  );

  const processOrder = useCallback(async () => {
    if (!applicant) return;

    const qrCodeData = await generateQRCodeData();
    if (!qrCodeData) return;

    const isSuccess = await submitOrder(qrCodeData);
    if (isSuccess) {
      router.push(`/events/${eventId}/orders/${orderId}`);
    }
  }, [applicant, eventId, orderId, router, generateQRCodeData, submitOrder]);

  const renderGiftItem = useCallback(
    (gift: Gift) => (
      <li key={gift._id.toString()}>
        <div className="flex flex-row" style={GIFT_LIST_STYLES.giftItem}>
          <GiftComponent gift={gift} />
          <SecondaryButton onClick={() => handleRemoveGift(gift)}>
            Remove
          </SecondaryButton>
        </div>
      </li>
    ),
    [handleRemoveGift]
  );

  const renderGiftsList = useCallback(() => {
    if (!hasGifts) {
      return <p>{MESSAGES.NO_GIFTS}</p>;
    }
    return <ul>{applicantGifts.map(renderGiftItem)}</ul>;
  }, [hasGifts, applicantGifts, renderGiftItem]);

  return (
    <Box sx={GIFT_LIST_STYLES.container}>
      <h3>{applicantDisplayName} gifts:</h3>
      {renderGiftsList()}
      <StyledButton onClick={processOrder}>Take</StyledButton>
      <QRcode url={orderUrl} qrRef={orderQRCodeRef} />
    </Box>
  );
};

export default GiftList;
