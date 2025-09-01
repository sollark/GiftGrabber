import React, { FC, useCallback, useMemo } from "react";
import { useApplicantList } from "@/app/contexts/ApplicantContext";
import {
  useGiftSelector,
  useGiftActions,
} from "@/app/contexts/gift/GiftContext";
import { Gift } from "@/database/models/gift.model";
import { Person } from "@/database/models/person.model";
import PersonAutocomplete from "../PersonAutocomplete";
import GiftInfo from "../gift/GiftInfo";

/**
 * Finds a gift for a specific person (claimed or unclaimed)
 * @param selectedPerson - The person to find a gift for
 * @param gifts - Array of available gifts
 * @returns The found gift or undefined if none available
 */
const findPersonGift = (
  selectedPerson: Person,
  gifts: Gift[]
): Gift | undefined =>
  gifts.find((gift) => gift.owner.publicId === selectedPerson.publicId);

/**
 * Functional SelectUnclaimedGift component.
 * Allows users to search for people and automatically assigns their unclaimed gifts.
 * Uses memo and strict typing for composability and performance.
 */
const SelectUnclaimedGift: FC = () => {
  const applicantList = useApplicantList();
  const giftListMaybe = useGiftSelector((state) => state.data.giftList);
  const giftList = React.useMemo(
    () =>
      giftListMaybe._tag === "Some" && Array.isArray(giftListMaybe.value)
        ? giftListMaybe.value
        : [],
    [giftListMaybe]
  );
  // Local state for selected person and their gift
  const [selectedPerson, setSelectedPerson] = React.useState<Person | null>(
    null
  );
  const [personGift, setPersonGift] = React.useState<Gift | undefined>(
    undefined
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

  // Handler for gift selection and assignment
  const handleGiftSelection = useCallback(
    (person: Person) => {
      if (!person) return;
      setSelectedPerson(person);
      const gift = findPersonGift(person, availableGifts);
      setPersonGift(gift);
      if (gift && !(gift as any).applicant) {
        addGift(gift);
      }
    },
    [availableGifts, addGift]
  );

  return (
    <div>
      <PersonAutocomplete
        peopleList={availableApplicants}
        onSelectPerson={handleGiftSelection}
      />
      {personGift && <GiftInfo gift={personGift} />}
    </div>
  );
};

export default SelectUnclaimedGift;
