/**
 * PersonAutocomplete.tsx
 *
 * This file defines the PersonAutocomplete component, which provides a search and selection UI for people using MUI Autocomplete.
 *
 * Responsibilities:
 * - Display a list of people for selection with search
 * - Require explicit confirmation to select a person
 * - Remain decoupled and reusable
 *
 * Constraints:
 * - No styling or UI changes
 * - No new features or business logic
 * - Only code quality, structure, and documentation improvements
 */

"use client";

import { FC, useState, useCallback, useMemo, SyntheticEvent } from "react";
import { Person } from "@/database/models/person.model";
import { Autocomplete, TextField } from "@mui/material";
import { SecondaryButton } from "@/ui/primitives";

/**
 * Option structure for the autocomplete component
 */
export interface OptionType {
  id: string;
  label: string;
  person: Person;
}

/**
 * Props for the PersonAutocomplete component
 */
interface PersonAutocompleteProps {
  peopleList: Person[];
  onSelectPerson: (person: Person) => void;
  onChangePerson: (person: Person) => void;
}

/**
 * Configuration constants for the autocomplete component
 */
const AUTOCOMPLETE_CONFIG = {
  WIDTH: 300,
  LABEL: "Type name",
  CLASS_NAME: "input",
} as const;

/**
 * mapPersonListToOptions
 * Maps a list of Person objects to OptionType objects for the autocomplete.
 * Moved outside component to avoid recreation on every render.
 * @param people - Array of Person objects
 * @returns Array of OptionType objects
 */
const mapPersonListToOptions = (people: Person[]): OptionType[] =>
  people.map((person, index) => ({
    id: person.publicId || `${person.firstName}-${person.lastName}-${index}`,
    label: `${person.firstName} ${person.lastName}`,
    person,
  }));

/**
 * isOptionEqualToValue
 * Compares two options for equality by ID.
 * Moved outside component for consistent reference equality.
 */
const isOptionEqualToValue = (option: OptionType, value: OptionType): boolean =>
  option.id === value.id;

/**
 * PersonAutocomplete component with focused performance optimizations.
 * Provides search functionality and requires explicit selection confirmation.
 * Optimized without over-engineering for better maintainability.
 */
const PersonAutocomplete: FC<PersonAutocompleteProps> = ({
  peopleList,
  onSelectPerson,
  onChangePerson,
}) => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Memoized option list to prevent unnecessary recalculation
  const optionList = useMemo(
    () => mapPersonListToOptions(peopleList),
    [peopleList]
  );

  /**
   * handleOptionSelect
   * Handles selection from the autocomplete dropdown (does not confirm selection).
   */
  const handleOptionSelect = useCallback(
    (event: SyntheticEvent, value: OptionType | null) => {
      if (!value) return;
      const { person } = value;
      setSelectedPerson(person);
      onChangePerson(person);
    },
    [onChangePerson]
  );

  /**
   * handleConfirmSelection
   * Handles the explicit confirmation of the selected person.
   */
  const handleConfirmSelection = useCallback(() => {
    if (selectedPerson) {
      onSelectPerson(selectedPerson);
    }
  }, [selectedPerson, onSelectPerson]);

  /**
   * renderInput
   * Simple render function for the autocomplete input.
   */
  const renderInput = useCallback(
    (params: any) => (
      <TextField {...params} label={AUTOCOMPLETE_CONFIG.LABEL} />
    ),
    []
  );

  return (
    <div className="flex flex-row align-start">
      <Autocomplete
        disablePortal
        className={AUTOCOMPLETE_CONFIG.CLASS_NAME}
        options={optionList}
        onChange={handleOptionSelect}
        sx={{ width: AUTOCOMPLETE_CONFIG.WIDTH }}
        renderInput={renderInput}
        isOptionEqualToValue={isOptionEqualToValue}
      />
      <SecondaryButton onClick={handleConfirmSelection}>Select</SecondaryButton>
    </div>
  );
};

export default PersonAutocomplete;
