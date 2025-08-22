import React, { FC, useCallback, useMemo, memo } from "react";
import { useApplicantSelection } from "@/app/contexts/ApplicantContext";
import {
  useGiftSelector,
  useGiftActions,
} from "@/app/contexts/gift/GiftContext";
import { Gift } from "@/database/models/gift.model";
import { Person } from "@/database/models/person.model";
import PersonAutocomplete from "../PersonAutocomplete";

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
  gifts.find(
    (gift) =>
      gift.owner.publicId === selectedPerson.publicId &&
      !(gift as any).applicant
  );

/**
 * Functional SelectUnclaimedGift component.
 * Allows users to search for people and automatically assigns their unclaimed gifts.
 * Uses memo and strict typing for composability and performance.
 */
const SelectUnclaimedGift: FC = () => {
  const { applicantList } = useApplicantSelection();
  const giftListMaybe = useGiftSelector((state) => state.data.giftList);
  const giftList = React.useMemo(
    () =>
      giftListMaybe._tag === "Some" && Array.isArray(giftListMaybe.value)
        ? giftListMaybe.value
        : [],
    [giftListMaybe]
  );
  // Local state for selected person
  const [selectedPerson, setSelectedPerson] = React.useState<Person | null>(
    null
  );
  const actions = useGiftActions();
  const addGift = React.useCallback(
    (gift: Gift) => {
      if (actions._tag === "Some") {
        actions.value.dispatchSafe({ type: "ADD_GIFT", payload: gift });
      }
    },
    [actions]
  );

  // Extract values from Maybe types for easier consumption
  const availableApplicants = useMemo(
    () => (applicantList._tag === "Some" ? applicantList.value : []),
    [applicantList]
  );
  const availableGifts = useMemo(() => giftList, [giftList]);

  // Handler for person selection changes (tracking only)
  const handlePersonChange = useCallback((person: Person) => {
    setSelectedPerson(person);
  }, []);

  // Handler for gift selection and assignment
  const handleGiftSelection = useCallback(
    (person: Person) => {
      if (!person) return;
      setSelectedPerson(person);
      const unclaimedGift = findUnclaimedGift(person, availableGifts);
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
};
SelectUnclaimedGift.displayName = "SelectUnclaimedGift";

export default SelectUnclaimedGift;
