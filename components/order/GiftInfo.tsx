import { useApplicantSelector } from "@/app/contexts/ApplicantContext";
import { useGiftSelector } from "@/app/contexts/GiftContext";
import { flatMapMaybe, getMaybeOrElse } from "@/lib/fp-utils";
import type { Maybe } from "@/lib/fp-utils";
import GiftComponent from "../GiftComponent";
import { Gift } from "@/database/models/gift.model";
import { Person } from "@/database/models/person.model";

/**
 * GiftInfo component
 * Displays the first unclaimed gift for the currently selected person, if any.
 * Uses ApplicantContext for person, GiftContext for gifts.
 */

const GiftInfo = () => {
  // TODO fix this wrapping mess
  // Use ApplicantContext for selected person (correct: state.data.selectedPerson)
  const selectedPersonMaybeMaybe = useApplicantSelector(
    (state) => state.data.selectedPerson
  );
  const selectedPersonMaybe: Maybe<Person> = flatMapMaybe(
    (x: Maybe<Person>) => x
  )(selectedPersonMaybeMaybe);
  const selectedPerson = getMaybeOrElse<Person | null>(null)(
    selectedPersonMaybe
  );

  // Use GiftContext for gift list (correct: state.data.giftList)
  const giftListMaybe = useGiftSelector((state) => state.data.giftList);
  const giftList = getMaybeOrElse<Gift[]>([])(giftListMaybe);

  if (!selectedPerson) return null;

  // Finds the first unclaimed gift belonging to the selected person.
  const gift = giftList.find(
    (gift) =>
      gift.owner && selectedPerson._id === gift.owner._id && !gift.receiver
  );

  if (!gift) return null;

  return <GiftComponent gift={gift} />;
};

export default GiftInfo;
