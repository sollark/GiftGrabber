import React, { FC, memo, useRef, useCallback, useMemo } from "react";
import { makeOrder } from "@/app/actions/order.action";
import {
  useApplicantSelection,
  useApplicantSelector,
} from "@/app/contexts/ApplicantContext";
import { useApproverSelection } from "@/app/contexts/ApproverContext";
import { useGiftSelector, useGiftActions } from "@/app/contexts/GiftContext";
import { Gift } from "@/database/models/gift.model";
import { generateOrderId, getQRcodeBuffer } from "@/utils/utils";
import { useRouter } from "next/navigation";
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

/**
 * GiftList - Renders a list of gifts for an applicant.
 * Props:
 *   - applicantGifts: Array of gift objects for the applicant
 *   - onRemoveGift: Function to remove a gift
 */
const GiftList: FC = () => {
  const router = useRouter();
  const { selectedApplicant } = useApplicantSelection();
  const { approverList } = useApproverSelection();
  const applicantGiftsMaybe = useGiftSelector(
    (state) => state.data.applicantGifts
  );
  const applicantGifts =
    applicantGiftsMaybe._tag === "Some" &&
    Array.isArray(applicantGiftsMaybe.value)
      ? applicantGiftsMaybe.value
      : [];
  const actions = useGiftActions();
  const removeGift =
    actions._tag === "Some"
      ? (id: string) =>
          actions.value.dispatchSafe({ type: "REMOVE_GIFT", payload: id })
      : () => {};
  const eventIdMaybe = useApplicantSelector((state) => state.data.eventId);
  const eventId = eventIdMaybe._tag === "Some" ? eventIdMaybe.value : "";
  const orderQRCodeRef = useRef<HTMLDivElement>(null!);
  const orderId = useMemo(() => generateOrderId(), []);
  const orderUrl = useMemo(
    () => `${BASE_URL}/events/${eventId}/orders/${orderId}`,
    [eventId, orderId]
  );
  const applicant = useMemo(
    () =>
      selectedApplicant._tag === "Some" &&
      selectedApplicant.value._tag === "Some"
        ? selectedApplicant.value.value
        : null,
    [selectedApplicant]
  );
  const applicantDisplayName = useMemo(
    () => applicant?.firstName || "Unknown",
    [applicant?.firstName]
  );
  const gifts = useMemo(() => applicantGifts, [applicantGifts]);
  const hasGifts = useMemo(() => gifts.length > 0, [gifts.length]);

  const handleRemoveGift = useCallback(
    (gift: Gift) => removeGift(gift._id.toString()),
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
