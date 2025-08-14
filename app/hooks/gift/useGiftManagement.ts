import { useGiftActions, useGiftSelector } from "@/app/contexts/GiftContext";
import { Gift } from "@/database/models/gift.model";
import { failure } from "@/utils/fp";
import React from "react";

/**
 * Hook for gift management operations (modular, from GiftContext)
 */
export const useGiftManagement = () => {
  const actions = useGiftActions();
  const applicantGifts = useGiftSelector((state: any) => state.applicantGifts);
  const giftList = useGiftSelector((state: any) => state.giftList);
  const searchQuery = useGiftSelector((state: any) => state.searchQuery);
  const filters = useGiftSelector((state: any) => state.filters);

  const addGift = React.useCallback(
    (gift: Gift) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "ADD_GIFT",
          payload: gift,
        });
      }
      return failure(new Error("Gift context not available"));
    },
    [actions]
  );

  const removeGift = React.useCallback(
    (giftId: string) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "REMOVE_GIFT",
          payload: giftId,
        });
      }
      return failure(new Error("Gift context not available"));
    },
    [actions]
  );

  const clearGifts = React.useCallback(() => {
    if (actions._tag === "Some") {
      return actions.value.dispatchSafe({
        type: "CLEAR_GIFTS",
      });
    }
    return failure(new Error("Gift context not available"));
  }, [actions]);

  const setSearchQuery = React.useCallback(
    (query: string) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "SET_SEARCH_QUERY",
          payload: query,
        });
      }
      return failure(new Error("Gift context not available"));
    },
    [actions]
  );

  const updateFilters = React.useCallback(
    (newFilters: Partial<any>) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({
          type: "UPDATE_FILTERS",
          payload: newFilters,
        });
      }
      return failure(new Error("Gift context not available"));
    },
    [actions]
  );

  // Computed filtered gifts
  const filteredGifts = React.useMemo(() => {
    if (
      giftList._tag !== "Some" ||
      filters._tag !== "Some" ||
      searchQuery._tag !== "Some"
    ) {
      return [];
    }

    const gifts = giftList.value;
    const currentFilters = filters.value;
    const query = searchQuery.value.toLowerCase();

    return gifts.filter((gift: any) => {
      // Search query filter
      if (query && !gift.name.toLowerCase().includes(query)) {
        return false;
      }
      // Available filter
      if (currentFilters.showAvailable && gift.claimed) {
        return false;
      }
      // Price range filter
      if (
        gift.price < currentFilters.priceRange.min ||
        gift.price > currentFilters.priceRange.max
      ) {
        return false;
      }
      // Category filter
      if (
        currentFilters.categories.length > 0 &&
        !currentFilters.categories.includes(gift.category)
      ) {
        return false;
      }
      return true;
    });
  }, [giftList, filters, searchQuery]);

  return {
    applicantGifts,
    giftList,
    filteredGifts,
    searchQuery,
    filters,
    addGift,
    removeGift,
    clearGifts,
    setSearchQuery,
    updateFilters,
    giftCount: applicantGifts._tag === "Some" ? applicantGifts.value.length : 0,
    canAddMore:
      applicantGifts._tag === "Some" ? applicantGifts.value.length < 5 : true,
  };
};
