import { useGiftSelector } from "@/app/contexts/GiftContext";

/**
 * Returns true if the user can submit an order (at least one gift selected)
 */
export const useCanSubmitOrder = () => {
  const applicantGifts = useGiftSelector((state: any) => state.applicantGifts);
  return (
    applicantGifts._tag === "Some" &&
    Array.isArray(applicantGifts.value) &&
    applicantGifts.value.length > 0
  );
};
