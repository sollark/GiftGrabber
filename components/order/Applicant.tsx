"use client";
import React, { FC, memo, useCallback } from "react";
import { useApplicantSelection } from "@/app/contexts/ApplicantContext";
import { useState } from "react";
import { Maybe, some, none } from "@/lib/fp-utils";
import { useGiftSelector, useGiftActions } from "@/app/contexts/GiftContext";
import { useStepNavigation } from "@/app/contexts/MultistepContext";
import { Person } from "@/database/models/person.model";
import { Gift } from "@/database/models/gift.model";
import PersonAutocomplete from "../form/PersonAutocomplete";

/**
 * Functional Applicant component.
 * Handles applicant selection and gift assignment with strict typing and composable error handling.
 * Uses memo for performance.
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
  const navResult = useStepNavigation();
  const goToNextStep = React.useMemo(() => {
    if (navResult._tag === "Success") {
      return () => {
        const result = navResult.value.goToNextStep();
        if (result._tag === "Success") {
          // Dispatch navigation action here if needed
        } else {
          // Handle navigation error (e.g., show notification)
        }
      };
    }
    return () => {};
  }, [navResult]);

  const findApplicantGift = useCallback(
    (person: Person): Gift | undefined =>
      giftList.find(
        (gift: Gift) => gift.owner._id === person._id && !gift.receiver
      ),
    [giftList]
  );

  const updateApplicantGifts = useCallback(
    (gift: Gift) => addGift(gift),
    [addGift]
  );

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

  const handleApplicantSelection = useCallback(
    (person: Person) => {
      if (!person) return;
      processApplicantSelection(person);
    },
    [processApplicantSelection]
  );

  const handlePersonChange = useCallback(() => {}, []);

  return (
    <PersonAutocomplete
      peopleList={applicantList._tag === "Some" ? applicantList.value : []}
      onSelectPerson={handleApplicantSelection}
      onChangePerson={handlePersonChange}
    />
  );
};
Applicant.displayName = "Applicant";

export default Applicant;
