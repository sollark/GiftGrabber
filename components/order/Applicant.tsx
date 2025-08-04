"use client";

import {
  useApplicantSelection,
  useGiftManagement,
  usePersonSelection,
} from "@/app/contexts/EnhancedApplicantContext";
import { useStepNavigation } from "@/app/contexts/EnhancedMultistepContext";
import { Person } from "@/database/models/person.model";
import { Gift } from "@/database/models/gift.model";
import { useCallback } from "react";
import PersonAutocomplete from "../form/PersonAutocomplete";

const Applicant = () => {
  const { applicantList, selectApplicant } = useApplicantSelection();
  const { giftList, addGift } = useGiftManagement();
  const { selectPerson } = usePersonSelection();
  const { goToNextStep } = useStepNavigation();

  const findApplicantGift = useCallback(
    (person: Person): Gift | undefined => {
      const gifts = giftList._tag === "Some" ? giftList.value : [];
      return gifts.find(
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
