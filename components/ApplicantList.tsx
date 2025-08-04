"use client";

import { ApplicantContext } from "@/app/contexts/ApplicantContext";
import { useSafeContext } from "@/app/hooks/useSafeContext";
import { Gift } from "@/database/models/gift.model";
import { Person } from "@/database/models/person.model";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { FC, SyntheticEvent, useMemo, useCallback } from "react";

/**
 * Configuration constants for the ApplicantList component
 */
const AUTOCOMPLETE_CONFIG = {
  WIDTH: 300,
  LABEL: "People",
  DISABLE_PORTAL: true,
} as const;

type OptionType = {
  id: string;
  label: string;
  person: Person;
};

const ApplicantList: FC = () => {
  const { applicantList, setSelectedPerson, giftList, setApplicantGifts } =
    useSafeContext(ApplicantContext);

  // Memoize the option list to prevent unnecessary recalculations
  const applicantsOptionList = useMemo(
    () => mapPersonListToOptionList(applicantList),
    [applicantList]
  );

  // Handle person selection with gift assignment
  const handlePersonSelect = useCallback(
    (event: SyntheticEvent, value: OptionType | null) => {
      if (!value) return;

      setSelectedPerson(value.person);
      processGiftAssignment(value.person, giftList, setApplicantGifts);
    },
    [setSelectedPerson, giftList, setApplicantGifts]
  );

  // Optimize option equality check
  const isOptionEqualToValue = useCallback(
    (option: OptionType, value: OptionType) => option.id === value.id,
    []
  );

  // Optimize render input function
  const renderInput = useCallback(
    (params: any) => (
      <TextField {...params} label={AUTOCOMPLETE_CONFIG.LABEL} />
    ),
    []
  );

  return (
    <Autocomplete
      disablePortal={AUTOCOMPLETE_CONFIG.DISABLE_PORTAL}
      options={applicantsOptionList}
      onChange={handlePersonSelect}
      sx={{ width: AUTOCOMPLETE_CONFIG.WIDTH }}
      renderInput={renderInput}
      isOptionEqualToValue={isOptionEqualToValue}
    />
  );
};

/**
 * Maps a list of Person objects to OptionType objects for the autocomplete
 * @param people - Array of Person objects
 * @returns Array of OptionType objects with id, label, and person properties
 */
const mapPersonListToOptionList = (people: Person[]): OptionType[] => {
  return people.map((person) => ({
    id: person._id.toString(),
    label: `${person.firstName} ${person.lastName}`,
    person,
  }));
};

/**
 * Finds an available gift for a specific person
 * @param person - The person to find a gift for
 * @param giftList - Array of available gifts
 * @returns The found gift or null if none available
 */
const findAvailableGiftForPerson = (
  person: Person,
  giftList: Gift[]
): Gift | null => {
  return (
    giftList.find(
      (gift) => gift.owner._id === person._id && gift.receiver !== null
    ) || null
  );
};

/**
 * Processes gift assignment for the selected person
 * @param person - The selected person
 * @param giftList - Array of available gifts
 * @param setApplicantGifts - Function to update applicant gifts
 */
const processGiftAssignment = (
  person: Person,
  giftList: Gift[],
  setApplicantGifts: React.Dispatch<React.SetStateAction<Gift[]>>
): void => {
  const availableGift = findAvailableGiftForPerson(person, giftList);
  if (availableGift) {
    setApplicantGifts((previousGifts) => [...previousGifts, availableGift]);
  }
};

export default ApplicantList;
