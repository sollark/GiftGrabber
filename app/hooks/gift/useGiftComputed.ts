import { useGiftSelector } from "@/app/contexts/GiftContext";
import React from "react";

/**
 * Hook for computed gift data (summary, totals, etc.)
 */
export const useGiftComputed = () => {
  const applicantGifts = useGiftSelector((state: any) => state.applicantGifts);

  const totalGiftValue = React.useMemo(() => {
    if (applicantGifts._tag !== "Some") return 0;
    return applicantGifts.value.reduce(
      (sum: any, gift: any) => sum + gift.price,
      0
    );
  }, [applicantGifts]);

  const giftSummary = React.useMemo(() => {
    if (applicantGifts._tag !== "Some") return null;
    const gifts = applicantGifts.value;
    return {
      count: gifts.length,
      totalValue: totalGiftValue,
      categories: [...new Set(gifts.map((g: any) => g.category))],
      averagePrice: gifts.length > 0 ? totalGiftValue / gifts.length : 0,
    };
  }, [applicantGifts, totalGiftValue]);

  return {
    applicantGifts,
    totalGiftValue,
    giftSummary,
  };
};
