import { FC, memo } from "react";
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
  const selectedPersonMaybeMaybe = useApplicantSelector(
    (state) => state.data.selectedPerson
  );
  const selectedPersonMaybe: Maybe<Person> = flatMapMaybe(
    (x: Maybe<Person>) => x
  )(selectedPersonMaybeMaybe);
  const selectedPerson = getMaybeOrElse<Person | null>(null)(
    selectedPersonMaybe
  );
  const giftListMaybe = useGiftSelector((state) => state.data.giftList);
  const giftList = getMaybeOrElse<Gift[]>([])(giftListMaybe);

  if (!selectedPerson) return null;
  const gift = giftList.find(
    (gift) =>
      gift.owner && selectedPerson._id === gift.owner._id && !gift.receiver
  );

  if (!gift) return null;

  return <GiftComponent gift={gift} />;
});

export default GiftInfo;
