"use client";

import { ApplicantContext } from "@/app/contexts/ApplicantContext";
import { useSafeContext } from "@/app/hooks/useSafeContext";
import { Gift } from "@/database/models/gift.model";
import { Person } from "@/database/models/person.model";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { FC, SyntheticEvent } from "react";

type OptionType = {
  id: string;
  label: string;
  person: Person;
};

const ApplicantList: FC = () => {
  const { applicantList, setSelectedPerson, giftList, setApplicantGifts } =
    useSafeContext(ApplicantContext);
  const applicantsOptionList = mapPersonListToOptionList(applicantList);

  const handlePersonSelect = (
    event: SyntheticEvent,
    value: OptionType | null
  ) => {
    if (!value) return;

    setSelectedPerson(value.person);

    const availableGift = findAvailableGiftForPerson(value.person, giftList);
    if (availableGift) {
      setApplicantGifts((previousGifts) => [...previousGifts, availableGift]);
    }
  };

  return (
    <Autocomplete
      disablePortal
      options={applicantsOptionList}
      onChange={handlePersonSelect}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label="People" />}
      isOptionEqualToValue={(option, value) => option.id === value.id}
    />
  );
};

const mapPersonListToOptionList = (people: Person[]): OptionType[] => {
  return people.map((person) => ({
    id: person._id.toString(),
    label: `${person.firstName} ${person.lastName}`,
    person,
  }));
};

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

export default ApplicantList;
