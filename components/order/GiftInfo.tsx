import { FC, memo, useState } from "react";
import { none } from "@/lib/fp-utils";
import { useApplicantSelector } from "@/app/contexts/ApplicantContext";
import { useGiftSelector } from "@/app/contexts/GiftContext";
import { flatMapMaybe, getMaybeOrElse } from "@/lib/fp-utils";
import type { Maybe } from "@/lib/fp-utils";
import GiftComponent from "../GiftComponent";
import { Gift } from "@/database/models/gift.model";
import { Person } from "@/database/models/person.model";

/**
 * Functional GiftInfo component.
 * Displays the first unclaimed gift for the currently selected person, if any.
 * Uses ApplicantContext for person, GiftContext for gifts.
 * Uses memo for performance.
 */
const GiftInfo: FC = memo(() => {
  // TODO fix this wrapping mess
  const [selectedPerson, setSelectedPerson] = useState<Maybe<Person>>(none);
  const giftListMaybe = useGiftSelector((state) => state.data.giftList);
  const giftList = getMaybeOrElse<Gift[]>([])(giftListMaybe);

  if (selectedPerson._tag !== "Some") return null;
  const person = selectedPerson.value;
  const gift = giftList.find(
    (gift) => gift.owner && person._id === gift.owner._id && !gift.receiver
  );

  if (!gift) return null;

  return <GiftComponent gift={gift} />;
});

export default GiftInfo;
