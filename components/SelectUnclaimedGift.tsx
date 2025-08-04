import { ApplicantContext } from "@/app/contexts/ApplicantContext";
import { useSafeContext } from "@/app/hooks/useSafeContext";
import { Person } from "@/database/models/person.model";
import { FC } from "react";
import PersonAutocomplete from "./form/PersonAutocomplete";

const SelectUnclaimedGift: FC = () => {
  const { giftList, setApplicantGifts, applicantList, setSelectedPerson } =
    useSafeContext(ApplicantContext);

  const handlePersonChange = (selectedPerson: Person) => {
    setSelectedPerson(selectedPerson);
  };

  const handleGiftSelection = (selectedPerson: Person) => {
    if (!selectedPerson) return;

    const availableGift = giftList.find(
      (gift) => gift.owner._id === selectedPerson._id && !gift.receiver
    );

    if (availableGift) {
      setApplicantGifts((previousGifts) => [...previousGifts, availableGift]);
    }
  };

  return (
    <div>
      <PersonAutocomplete
        peopleList={applicantList}
        onSelectPerson={handleGiftSelection}
        onChangePerson={handlePersonChange}
      />
    </div>
  );
};

export default SelectUnclaimedGift;
