/**
 * SelectUnclaimedGift.tsx
 *
 * Purpose: Component for searching applicants and assigning their gifts.
 *
 * Responsibilities:
 * - Allows users to search for people and automatically assign their unclaimed gifts
 * - Uses context hooks for applicant and gift state
 * - Optimizes performance with memoization
 * - Maintains local state for selected person and their gift
 *
 * Notes:
 * - No UI or styling changes are made in this file
 * - No new features are added; only code quality and structure improvements
 */

import React, { FC, useCallback, useMemo, useState } from "react";
import {
  useApplicantList,
  useSelectedApplicant,
} from "@/app/contexts/ApplicantContext";
import { useGiftContext } from "@/app/contexts/gift/GiftContext";
import { Gift } from "@/database/models/gift.model";
import { Person } from "@/database/models/person.model";
import PersonAutocomplete from "../PersonAutocomplete";
import GiftInfo from "../gift/GiftInfo";
import { PrimaryButton } from "@/ui/primitives";

/**
 * findPersonGift
 * Finds a gift for a specific person (claimed or unclaimed).
 * @param selectedPerson {Person} - The person to find a gift for
 * @param gifts {Gift[]} - Array of available gifts
 * @returns {Gift | undefined} The found gift or undefined if none available
 */
const findPersonGift = (
  selectedPerson: Person,
  gifts: Gift[]
): Gift | undefined =>
  gifts.find((gift) => gift.owner.publicId === selectedPerson.publicId);

/**
 * Utility to check if a gift is unclaimed.
 * @param gift {Gift}
 * @returns {boolean}
 */
const isGiftUnclaimed = (gift: Gift): boolean => !gift.applicant;

/**
 * SelectUnclaimedGift
 * Functional component for searching applicants and assigning gifts.
 * - Uses context hooks for state
 * - Memoizes applicants and gifts for performance
 * - Handles selection and assignment logic
 * @returns {JSX.Element} The applicant search and gift assignment UI
 */
const SelectUnclaimedGift: FC = () => {
  const applicantList = useApplicantList();
  const selectedApplicant = useSelectedApplicant();
  const giftContext = useGiftContext();
  const giftList =
    giftContext._tag === "Some" ? giftContext.value.state.data.giftList : [];
  const giftDispatch =
    giftContext._tag === "Some" ? giftContext.value.dispatch : undefined;

  // Local state for selected person and their gift
  const initialPerson =
    selectedApplicant._tag === "Some" ? selectedApplicant.value : null;
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(
    initialPerson
  );
  const [personGift, setPersonGift] = useState<Gift | undefined>(undefined);

  /**
   * addGift
   * Dispatches an action to add a gift if actions are available.
   * @param gift {Gift} - The gift to add
   */
  const addGift = useCallback(
    (gift: Gift) => {
      if (giftDispatch) {
        giftDispatch({ type: "ADD_GIFT", payload: gift });
      }
    },
    [giftDispatch]
  );

  /**
   * availableApplicants
   * Memoized list of applicants from context.
   */
  const availableApplicants = useMemo(
    () => (Array.isArray(applicantList) ? applicantList : []),
    [applicantList]
  );

  /**
   * availableGifts
   * Memoized list of gifts from context.
   */
  const availableGifts = useMemo(() => giftList, [giftList]);

  /**
   * handleGiftSelection
   * Handles person selection and gift assignment logic.
   * @param person {Person}
   */
  const handleGiftSelection = useCallback(
    (person: Person) => {
      if (!person) return;
      setSelectedPerson(person);
      const gift = findPersonGift(person, availableGifts);
      setPersonGift(gift);
    },
    [availableGifts]
  );

  return (
    <div>
      <PersonAutocomplete
        peopleList={availableApplicants}
        onSelectPerson={handleGiftSelection}
        value={selectedPerson}
      />
      {personGift && <GiftInfo gift={personGift} />}
      {personGift && isGiftUnclaimed(personGift) && (
        <PrimaryButton onClick={() => addGift(personGift)}>
          Add Gift
        </PrimaryButton>
      )}
      {!personGift && selectedPerson && (
        <div>No gift found for this person.</div>
      )}
    </div>
  );
};

export default SelectUnclaimedGift;
