import CreateEventForm from "@/components/CreateEventForm";
import { Section } from "@/ui/layout";
import { FC } from "react";

const CreatePage: FC = () => {
  return (
    <Section>
      <Section.Title>Create New Event</Section.Title>
      <CreateEventForm />
    </Section>
  );
};

export default CreatePage;
