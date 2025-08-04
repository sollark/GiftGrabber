"use client";

import { Person } from "@/database/models/person.model";
import { Autocomplete, TextField } from "@mui/material";
import { FC, SyntheticEvent, useState, useCallback, useMemo } from "react";
import SecondaryButton from "../buttons/SecondaryButton";

export type OptionType = {
  id: string;
  label: string;
  person: Person; // {_id: Types.ObjectId, firstName: string, lastName: string}
};

type PersonAutocompleteProps = {
  peopleList: Person[];
  onSelectPerson: (person: Person) => void;
  onChangePerson: (person: Person) => void;
};

const AUTOCOMPLETE_CONFIG = {
  width: 300,
  label: "Type name",
  className: "input",
} as const;

const PersonAutocomplete: FC<PersonAutocompleteProps> = ({
  peopleList,
  onSelectPerson,
  onChangePerson,
}) => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const optionList = useMemo(
    () => mapPersonListToOptionList(peopleList),
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

  const handleConfirmSelection = useCallback(() => {
    if (selectedPerson) {
      onSelectPerson(selectedPerson);
    }
  }, [selectedPerson, onSelectPerson]);

  const isOptionEqualToValue = useCallback(
    (option: OptionType, value: OptionType) => option.id === value.id,
    []
  );

  const renderInput = useCallback(
    (params: any) => (
      <TextField {...params} label={AUTOCOMPLETE_CONFIG.label} />
    ),
    []
  );

  return (
    <div className="flex flex-row align-start">
      <Autocomplete
        disablePortal
        className={AUTOCOMPLETE_CONFIG.className}
        options={optionList}
        onChange={handleOptionSelect}
        sx={{ width: AUTOCOMPLETE_CONFIG.width }}
        renderInput={renderInput}
        isOptionEqualToValue={isOptionEqualToValue}
      />
      <SecondaryButton onClick={handleConfirmSelection}>Select</SecondaryButton>
    </div>
  );
};

/**
 * Maps a list of Person objects to autocomplete options
 * @param people - Array of Person objects to transform
 * @returns Array of OptionType objects for the autocomplete component
 */
const mapPersonListToOptionList = (people: Person[]): OptionType[] => {
  return people.map((person) => ({
    id: person._id.toString(),
    label: `${person.firstName} ${person.lastName}`,
    person,
  }));
};

export default PersonAutocomplete;
