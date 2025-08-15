/**
 * GiftInfo.tsx
 *
 * This file defines the GiftInfo component, which displays the first unclaimed gift for the currently selected person.
 *
 * Responsibilities:
 * - Use context to get the selected person and the list of gifts
 * - Find and display the first unclaimed gift for that person
 * - Remain performant and maintainable
 *
 * Constraints:
 * - No styling or UI changes
 * - No new features or business logic
 * - Only code quality, structure, and documentation improvements
 */

import { FC, useState } from "react";
import { none, Maybe, getMaybeOrElse } from "@/utils/fp";
import { useGiftSelector } from "@/app/contexts/gift/GiftContext";
import GiftComponent from "./GiftComponent";
import { Gift } from "@/database/models/gift.model";
import { Person } from "@/database/models/person.model";

/**
 * GiftInfo
 * Displays the first unclaimed gift for the currently selected person, if any.
 * Uses context for person and gifts.
 * @returns The GiftComponent for the first unclaimed gift, or null if none
 */
const GiftInfo: FC = () => {
  // State for the currently selected person (Maybe<Person>)
  const [selectedPerson] = useState<Maybe<Person>>(none);
  // Get the list of gifts from context (Maybe<Gift[]>)
  const giftListMaybe = useGiftSelector((state) => state.data.giftList);
  const giftList = getMaybeOrElse<Gift[]>([])(giftListMaybe);

  if (selectedPerson._tag !== "Some") return null;
  const person = selectedPerson.value;
  // Find the first unclaimed gift for the selected person
  const gift = giftList.find(
    (gift) => gift.owner && person._id === gift.owner._id && !gift.receiver
  );

  if (!gift) return null;
  return <GiftComponent gift={gift} />;
};

export default GiftInfo;
