import { useGiftSelector } from "@/app/contexts/GiftContext";

/**
 * Returns the list of selected gifts for the current applicant (typed)
 */
export const useSelectedGifts = () => {
  const applicantGifts = useGiftSelector((state: any) => state.applicantGifts);
  return applicantGifts._tag === "Some" && Array.isArray(applicantGifts.value)
    ? applicantGifts.value
    : [];
};
