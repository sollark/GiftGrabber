import { ApplicantContext } from "@/app/contexts/ApplicantContext";
import { useSafeContext } from "@/app/hooks/useSafeContext";
import { Gift } from "@/database/models/gift.model";
import { Person } from "@/database/models/person.model";
import { FC, useCallback } from "react";
import PersonAutocomplete from "./form/PersonAutocomplete";

/**
 * Configuration constants for the SelectUnclaimedGift component
 */
const COMPONENT_CONFIG = {
  CONTAINER_ELEMENT: "div",
} as const;

/**
 * Main component for selecting unclaimed gifts through person selection
 */
const SelectUnclaimedGift: FC = () => {
  const { giftList, setApplicantGifts, applicantList, setSelectedPerson } =
    useSafeContext(ApplicantContext);

  // Memoized handler for person selection changes
  const handlePersonChange = useCallback(
    (selectedPerson: Person) => {
      setSelectedPerson(selectedPerson);
    },
    [setSelectedPerson]
  );

  // Memoized handler for gift selection process
  const handleGiftSelection = useCallback(
    (selectedPerson: Person) => {
      if (!selectedPerson) return;

      const availableGift = findAvailableGiftForPerson(
        selectedPerson,
        giftList
      );
      if (availableGift) {
        addGiftToApplicantList(availableGift, setApplicantGifts);
      }
    },
    [giftList, setApplicantGifts]
  );

  return (
    <COMPONENT_CONFIG.CONTAINER_ELEMENT>
      <PersonAutocomplete
        peopleList={applicantList}
        onSelectPerson={handleGiftSelection}
        onChangePerson={handlePersonChange}
      />
    </COMPONENT_CONFIG.CONTAINER_ELEMENT>
  );
};

/**
 * Finds an available unclaimed gift for a specific person
 * @param selectedPerson - The person to find a gift for
 * @param giftList - Array of available gifts
 * @returns Gift | undefined - The found unclaimed gift or undefined if none available
 */
const findAvailableGiftForPerson = (
  selectedPerson: Person,
  giftList: Gift[]
): Gift | undefined => {
  return giftList.find(
    (gift) => gift.owner._id === selectedPerson._id && !gift.receiver
  );
};

/**
 * Adds a gift to the applicant gifts list
 * @param availableGift - The gift to add to the list
 * @param setApplicantGifts - Function to update the applicant gifts state
 */
const addGiftToApplicantList = (
  availableGift: Gift,
  setApplicantGifts: React.Dispatch<React.SetStateAction<Gift[]>>
): void => {
  setApplicantGifts((previousGifts) => [...previousGifts, availableGift]);
};

export default SelectUnclaimedGift;
