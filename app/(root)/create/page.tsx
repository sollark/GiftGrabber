import CreateEventForm from "@/components/event/CreateEventForm";
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
