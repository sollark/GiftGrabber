/**
 * Applicant.tsx
 *
 * This file defines the Applicant component, which manages applicant selection and gift assignment in the Gift Grabber app.
 *
 * Responsibilities:
 * - Display an autocomplete for selecting an applicant
 * - Handle applicant selection and update context
 * - Assign gifts to the selected applicant if available
 * - Advance to the next step in the flow
 *
 * Constraints:
 * - No styling or UI changes
 * - No new features or business logic
 * - Only code quality, structure, and documentation improvements
 */

"use client";
import React, { FC, useCallback } from "react";
import { useApplicantSelection } from "@/app/contexts/ApplicantContext";
import { useState } from "react";
import { Maybe, some, none } from "@/utils/fp";
import { useGiftSelector, useGiftActions } from "@/app/contexts/GiftContext";
import { useStepNavigationActions } from "@/app/contexts/multistep/useStepNavigationActions";
import { Person } from "@/database/models/person.model";
import { Gift } from "@/database/models/gift.model";
import PersonAutocomplete from "../PersonAutocomplete";

/**
 * Applicant
 * Handles applicant selection, gift assignment, and step navigation.
 * Uses context for applicant, gift, and navigation state.
 * @returns The applicant selection UI
 */
const Applicant: FC = () => {
  const { applicantList, selectApplicant } = useApplicantSelection();
  const giftListMaybe = useGiftSelector((state) => state.data.giftList);
  const giftList = React.useMemo(
    () =>
      giftListMaybe._tag === "Some" && Array.isArray(giftListMaybe.value)
        ? giftListMaybe.value
        : [],
    [giftListMaybe]
  );
  const actions = useGiftActions();
  const addGift = React.useMemo(
    () =>
      actions._tag === "Some"
        ? actions.value.dispatchSafe.bind(null, { type: "ADD_GIFT" })
        : () => {},
    [actions]
  );
  // Local state for selected person
  const [selectedPerson, setSelectedPerson] = useState<Maybe<Person>>(none);
  const { goToNextStep } = useStepNavigationActions();

  /**
   * findApplicantGift
   * Finds the first unclaimed gift for the given person.
   * @param person - The person to find a gift for
   * @returns The first unclaimed gift or undefined
   */
  const findApplicantGift = useCallback(
    (person: Person): Gift | undefined =>
      giftList.find(
        (gift: Gift) => gift.owner._id === person._id && !gift.receiver
      ),
    [giftList]
  );

  /**
   * updateApplicantGifts
   * Adds a gift to the applicant's list.
   * @param gift - The gift to add
   */
  const updateApplicantGifts = useCallback(
    (gift: Gift) => addGift(gift),
    [addGift]
  );

  /**
   * processApplicantSelection
   * Handles the full applicant selection process: updates state, assigns gift, and advances step.
   * @param person - The selected applicant
   */
  const processApplicantSelection = useCallback(
    (person: Person) => {
      setSelectedPerson(some(person));
      selectApplicant(person);
      const applicantGift = findApplicantGift(person);
      if (applicantGift) updateApplicantGifts(applicantGift);
      goToNextStep();
    },
    [selectApplicant, findApplicantGift, updateApplicantGifts, goToNextStep]
  );

  /**
   * handleApplicantSelection
   * Handles the selection of an applicant from the autocomplete.
   * @param person - The selected person
   */
  const handleApplicantSelection = useCallback(
    (person: Person) => {
      if (!person) return;
      processApplicantSelection(person);
    },
    [processApplicantSelection]
  );

  /**
   * handlePersonChange
   * Placeholder for handling person change events (currently a no-op).
   */
  const handlePersonChange = useCallback(() => {}, []);

  return (
    <PersonAutocomplete
      peopleList={applicantList._tag === "Some" ? applicantList.value : []}
      onSelectPerson={handleApplicantSelection}
      onChangePerson={handlePersonChange}
    />
  );
};
// Applicant.displayName = "Applicant";

export default Applicant;
