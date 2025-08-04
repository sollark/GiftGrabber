"use client";

import { Person } from "@/database/models/person.model";
import { Autocomplete, TextField } from "@mui/material";
import { FC, SyntheticEvent, useState } from "react";
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

const PersonAutocomplete: FC<PersonAutocompleteProps> = ({
  peopleList,
  onSelectPerson,
  onChangePerson,
}) => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const optionList = mapPersonListToOptionList(peopleList);

  const handleOptionSelect = (
    event: SyntheticEvent,
    value: OptionType | null
  ) => {
    if (!value) return;

    setSelectedPerson(value.person);
    onChangePerson(value.person);
  };

  const handleConfirmSelection = () => {
    if (selectedPerson) {
      onSelectPerson(selectedPerson);
    }
  };

  return (
    <div className="flex flex-row align-start">
      <Autocomplete
        disablePortal
        className="input"
        options={optionList}
        onChange={handleOptionSelect}
        sx={{ width: 300 }}
        renderInput={(params) => <TextField {...params} label="Type name" />}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />
      <SecondaryButton onClick={handleConfirmSelection}>Select</SecondaryButton>
    </div>
  );
};

const mapPersonListToOptionList = (people: Person[]): OptionType[] => {
  return people.map((person) => ({
    id: person._id.toString(),
    label: `${person.firstName} ${person.lastName}`,
    person,
  }));
};

export default PersonAutocomplete;
