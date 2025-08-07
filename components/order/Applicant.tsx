"use client";

import {
  useApplicantSelection,
  usePersonSelection,
} from "@/app/contexts/ApplicantContext";
import { useGiftSelector, useGiftActions } from "@/app/contexts/GiftContext";
import { useStepNavigation } from "@/app/contexts/MultistepContext";
import { Person } from "@/database/models/person.model";
import { Gift } from "@/database/models/gift.model";
import { useCallback } from "react";
import PersonAutocomplete from "../form/PersonAutocomplete";

const Applicant = () => {
  const { applicantList, selectApplicant } = useApplicantSelection();
  const giftListMaybe = useGiftSelector((state) => state.data.giftList);
  const giftList =
    giftListMaybe._tag === "Some" && Array.isArray(giftListMaybe.value)
      ? giftListMaybe.value
      : [];
  const actions = useGiftActions();
  const addGift =
    actions._tag === "Some"
      ? actions.value.dispatchSafe.bind(null, { type: "ADD_GIFT" })
      : () => {};
  const { selectPerson } = usePersonSelection();
  const { goToNextStep } = useStepNavigation();

  const findApplicantGift = useCallback(
    (person: Person): Gift | undefined => {
      return giftList.find(
        (gift: Gift) => gift.owner._id === person._id && !gift.receiver
      );
    },
    [giftList]
  );

  const updateApplicantGifts = useCallback(
    (gift: Gift) => {
      addGift(gift);
    },
    [addGift]
  );

  const processApplicantSelection = useCallback(
    (selectedPerson: Person) => {
      selectApplicant(selectedPerson);
      selectPerson(selectedPerson);

      const applicantGift = findApplicantGift(selectedPerson);
      if (applicantGift) {
        updateApplicantGifts(applicantGift);
      }

      goToNextStep();
    },
    [
      selectApplicant,
      selectPerson,
      findApplicantGift,
      updateApplicantGifts,
      goToNextStep,
    ]
  );

  const handleApplicantSelection = useCallback(
    (selectedPerson: Person) => {
      if (!selectedPerson) return;
      processApplicantSelection(selectedPerson);
    },
    [processApplicantSelection]
  );

  const handlePersonChange = useCallback(() => {
    // Intentionally empty - required by PersonAutocomplete interface
  }, []);

  return (
    <PersonAutocomplete
      peopleList={applicantList._tag === "Some" ? applicantList.value : []}
      onSelectPerson={handleApplicantSelection}
      onChangePerson={handlePersonChange}
    />
  );
};

export default Applicant;
