import { FC, useCallback, useMemo, memo } from "react";
import {
  useApplicantSelection,
  usePersonSelection,
} from "@/app/contexts/ApplicantContext";
import { useGiftSelector, useGiftActions } from "@/app/contexts/GiftContext";
import { Gift } from "@/database/models/gift.model";
import { Person } from "@/database/models/person.model";
import PersonAutocomplete from "./form/PersonAutocomplete";

/**
 * Finds an available unclaimed gift for a specific person
 * @param selectedPerson - The person to find a gift for
 * @param gifts - Array of available gifts
 * @returns The found unclaimed gift or undefined if none available
 */
const findUnclaimedGift = (
  selectedPerson: Person,
  gifts: Gift[]
): Gift | undefined =>
  gifts.find((gift) => gift.owner._id === selectedPerson._id && !gift.receiver);

/**
 * Functional SelectUnclaimedGift component.
 * Allows users to search for people and automatically assigns their unclaimed gifts.
 * Uses memo and strict typing for composability and performance.
 */
const SelectUnclaimedGift: FC = memo(() => {
  const { applicantList } = useApplicantSelection();
  const giftListMaybe = useGiftSelector((state) => state.data.giftList);
  const giftList =
    giftListMaybe._tag === "Some" && Array.isArray(giftListMaybe.value)
      ? giftListMaybe.value
      : [];
  const { selectPerson } = usePersonSelection();
  const actions = useGiftActions();
  const addGift =
    actions._tag === "Some"
      ? actions.value.dispatchSafe.bind(null, { type: "ADD_GIFT" })
      : () => {};

  // Extract values from Maybe types for easier consumption
  const availableApplicants = useMemo(
    () => (applicantList._tag === "Some" ? applicantList.value : []),
    [applicantList]
  );
  const availableGifts = useMemo(() => giftList, [giftList]);

  // Handler for person selection changes (tracking only)
  const handlePersonChange = useCallback(
    (selectedPerson: Person) => {
      selectPerson(selectedPerson);
    },
    [selectPerson]
  );

  // Handler for gift selection and assignment
  const handleGiftSelection = useCallback(
    (selectedPerson: Person) => {
      if (!selectedPerson) return;

      const unclaimedGift = findUnclaimedGift(selectedPerson, availableGifts);

      if (unclaimedGift) {
        addGift(unclaimedGift);
      }
    },
    [availableGifts, addGift]
  );

  return (
    <div>
      <PersonAutocomplete
        peopleList={availableApplicants}
        onSelectPerson={handleGiftSelection}
        onChangePerson={handlePersonChange}
      />
    </div>
  );
});

export default SelectUnclaimedGift;
