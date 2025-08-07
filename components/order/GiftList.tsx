import { makeOrder } from "@/app/actions/order.action";
import {
  useApplicantSelection,
  useGiftManagement,
  useApplicantSelector,
} from "@/app/contexts/ApplicantContext";
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
  const { selectedApplicant } = useApplicantSelection();
  const { applicantGifts, removeGift } = useGiftManagement();
  const eventId = useApplicantSelector((state: any) => state.eventId);
  const approverList = useApplicantSelector((state: any) => state.approverList);

  const orderQRCodeRef = useRef<HTMLDivElement>(null!);

  // Memoize computed values that don't change frequently
  const orderId = useMemo(() => generateOrderId(), []);
  const orderUrl = useMemo(
    () => `${BASE_URL}/events/${eventId}/orders/${orderId}`,
    [eventId, orderId]
  );

  const applicant = useMemo(() => {
    return selectedApplicant._tag === "Some" &&
      selectedApplicant.value._tag === "Some"
      ? selectedApplicant.value.value
      : null;
  }, [selectedApplicant]);

  const applicantDisplayName = useMemo(
    () => applicant?.firstName || "Unknown",
    [applicant?.firstName]
  );

  const gifts = useMemo(() => {
    return applicantGifts._tag === "Some" ? applicantGifts.value : [];
  }, [applicantGifts]);

  const hasGifts = useMemo(() => gifts.length > 0, [gifts.length]);

  const handleRemoveGift = useCallback(
    (giftToRemove: Gift) => {
      removeGift(giftToRemove._id.toString());
    },
    [removeGift]
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
          approverList._tag === "Some" ? approverList.value : [],
          applicant,
          gifts,
          orderId,
          qrCodeData
        );
        return !!response;
      } catch (error) {
        console.error(MESSAGES.ORDER_ERROR, error);
        return false;
      }
    },
    [approverList, applicant, gifts, orderId]
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
    return <ul>{gifts.map(renderGiftItem)}</ul>;
  }, [hasGifts, gifts, renderGiftItem]);

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
