import { useApplicantSelector } from "@/app/contexts/ApplicantContext";
import { flatMapMaybe, getMaybeOrElse } from "@/lib/fp-utils";
import type { Maybe } from "@/lib/fp-utils";
import GiftComponent from "../GiftComponent";
import type { ApplicantState } from "@/app/contexts/ApplicantContext";
import { Gift } from "@/database/models/gift.model";
import { Person } from "@/database/models/person.model";

/**
 * GiftInfo component
 * Displays the first unclaimed gift for the currently selected person, if any.
 * Utilizes functional context selectors and Maybe unwrapping for robust state access.
 */

const giftListMaybe = useApplicantSelector((state) => state.data.giftList);

const GiftInfo = () => {
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

  // Selects the list of all gifts from the ApplicantContext. New
  const giftListMaybe = useApplicantSelector((state) => state.data.giftList);

  // Unwraps the Maybe<Gift[]> to an array of gifts or an empty array.
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
