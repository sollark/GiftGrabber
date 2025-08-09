import { Event } from "@/database/models/event.model";
import { Person } from "@/database/models/person.model";

export type PersonWithoutId = Omit<Person, "_id">;

export type EventForm = Omit<
  Event,
  "_id" | "giftList" | "applicantList" | "approverList"
> & {
  applicantList: PersonWithoutId[];
  approverList: PersonWithoutId[];
};

export interface CreateEventData {
  name: string;
  email: string;
  eventId: string;
  ownerId: string;
  eventQRCodeBase64: string;
  ownerIdQRCodeBase64: string;
  applicantIds: string[];
  giftIds: string[];
  approverIds: string[];
}
