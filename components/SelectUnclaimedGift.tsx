import {
  useApplicantSelection,
  useGiftManagement,
  usePersonSelection,
} from "@/app/contexts/EnhancedApplicantContext";
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
  const { applicantList } = useApplicantSelection();
  const { giftList, addGift } = useGiftManagement();
  const { selectPerson } = usePersonSelection();

  // Memoized handler for person selection changes
  const handlePersonChange = useCallback(
    (selectedPerson: Person) => {
      selectPerson(selectedPerson);
    },
    [selectPerson]
  );

  // Memoized handler for gift selection process
  const handleGiftSelection = useCallback(
    (selectedPerson: Person) => {
      if (!selectedPerson) return;

      const availableGift = findAvailableGiftForPerson(
        selectedPerson,
        giftList._tag === "Some" ? giftList.value : []
      );
      if (availableGift) {
        addGift(availableGift);
      }
    },
    [giftList, addGift]
  );

  return (
    <COMPONENT_CONFIG.CONTAINER_ELEMENT>
      <PersonAutocomplete
        peopleList={applicantList._tag === "Some" ? applicantList.value : []}
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

export default SelectUnclaimedGift;
