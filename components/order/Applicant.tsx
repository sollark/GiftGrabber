"use client";

import { ApplicantContext } from "@/app/contexts/ApplicantContext";
import { MultistepContext } from "@/app/contexts/MultistepContext";
import { useSafeContext } from "@/app/hooks/useSafeContext";
import { Person } from "@/database/models/person.model";
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

  const handleApplicantSelection = (selectedPerson: Person) => {
    if (!selectedPerson) return;

    setApplicant(selectedPerson);
    setSelectedPerson(selectedPerson);

    const applicantGift = giftList.find(
      (gift) => gift.owner._id === selectedPerson._id && !gift.receiver
    );

    if (applicantGift) {
      setApplicantGifts((previousGifts) => [...previousGifts, applicantGift]);
    }

    goToNextStep();
  };

  const handlePersonChange = () => {
    // No-op for this component
  };

  return (
    <PersonAutocomplete
      peopleList={applicantList}
      onSelectPerson={handleApplicantSelection}
      onChangePerson={handlePersonChange}
    />
  );
};

export default Applicant;
