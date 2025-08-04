"use client";

import { ApplicantContext } from "@/app/contexts/ApplicantContext";
import { MultistepContext } from "@/app/contexts/MultistepContext";
import { useSafeContext } from "@/app/hooks/useSafeContext";
import { Person } from "@/database/models/person.model";
import { Gift } from "@/database/models/gift.model";
import { useCallback } from "react";
import PersonAutocomplete from "../form/PersonAutocomplete";

const Applicant = () => {
  const {
    applicantList,
    setApplicant,
    setSelectedPerson,
    giftList,
    setApplicantGifts,
  } = useSafeContext(ApplicantContext);
  const { goToNextStep } = useSafeContext(MultistepContext);

  const findApplicantGift = useCallback(
    (person: Person): Gift | undefined => {
      return giftList.find(
        (gift) => gift.owner._id === person._id && !gift.receiver
      );
    },
    [giftList]
  );

  const updateApplicantGifts = useCallback(
    (gift: Gift) => {
      setApplicantGifts((previousGifts) => [...previousGifts, gift]);
    },
    [setApplicantGifts]
  );

  const processApplicantSelection = useCallback(
    (selectedPerson: Person) => {
      setApplicant(selectedPerson);
      setSelectedPerson(selectedPerson);

      const applicantGift = findApplicantGift(selectedPerson);
      if (applicantGift) {
        updateApplicantGifts(applicantGift);
      }

      goToNextStep();
    },
    [
      setApplicant,
      setSelectedPerson,
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
      peopleList={applicantList}
      onSelectPerson={handleApplicantSelection}
      onChangePerson={handlePersonChange}
    />
  );
};

export default Applicant;
