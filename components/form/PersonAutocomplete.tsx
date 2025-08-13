"use client";

import {
  FC,
  memo,
  useState,
  useCallback,
  useMemo,
  SyntheticEvent,
} from "react";
import { Person } from "@/database/models/person.model";
import { Autocomplete, TextField } from "@mui/material";
import { SecondaryButton } from "../../ui/primitives";

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

const mapPersonListToOptions = (people: Person[]): OptionType[] =>
  people.map((person) => ({
    id: person._id.toString(),
    label: `${person.firstName} ${person.lastName}`,
    person,
  }));

/**
 * Functional PersonAutocomplete component.
 * Provides search functionality and requires explicit selection confirmation.
 * Uses memo and strict typing for composability and performance.
 */
const PersonAutocomplete: FC<PersonAutocompleteProps> = ({
  peopleList,
  onSelectPerson,
  onChangePerson,
}) => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const optionList = useMemo(
    () => mapPersonListToOptions(peopleList),
    [peopleList]
  );
  const handleOptionSelect = useCallback(
    (event: SyntheticEvent, value: OptionType | null) => {
      if (!value) return;

      const { person } = value;
      setSelectedPerson(person);
      onChangePerson(person);
    },
    [onChangePerson]
  );

  // Handles final selection confirmation
  const handleConfirmSelection = useCallback(() => {
    if (selectedPerson) {
      onSelectPerson(selectedPerson);
    }
  }, [selectedPerson, onSelectPerson]);

  // Option equality comparison for autocomplete
  const isOptionEqualToValue = useCallback(
    (option: OptionType, value: OptionType) => option.id === value.id,
    []
  );
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
