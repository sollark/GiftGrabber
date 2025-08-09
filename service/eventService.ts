import EventModel, { Event } from "@/database/models/event.model";
import GiftModel from "@/database/models/gift.model";
import PersonModel, { Person } from "@/database/models/person.model";
import { handleError } from "@/lib/fp-utils";

type PersonWithoutId = Omit<Person, "_id">;
type EventForm = Omit<
  Event,
  "_id" | "giftList" | "applicantList" | "approverList"
> & {
  applicantList: PersonWithoutId[];
  approverList: PersonWithoutId[];
};

interface CreateEventData {
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

const createPersonList = async (
  personList: PersonWithoutId[]
): Promise<string[]> => {
  return Promise.all(
    personList.map(async (person) => {
      const personDoc = await PersonModel.create(person);
      return personDoc._id.toString();
    })
  );
};

const createGiftList = async (applicantIds: string[]): Promise<string[]> => {
  return Promise.all(
    applicantIds.map(async (applicantId) => {
      const giftDoc = await GiftModel.create({ owner: applicantId });
      return giftDoc._id.toString();
    })
  );
};

const createEventRecord = async (
  eventData: CreateEventData
): Promise<Event> => {
  const {
    name,
    email,
    eventId,
    ownerId,
    eventQRCodeBase64,
    ownerIdQRCodeBase64,
    applicantIds,
    giftIds,
    approverIds,
  } = eventData;

  return EventModel.create({
    name,
    email,
    eventId,
    ownerId,
    eventQRCodeBase64,
    ownerIdQRCodeBase64,
    applicantList: applicantIds,
    giftList: giftIds,
    approverList: approverIds,
  });
};

export const createApplicantsAndApprovers = async (
  applicantList: PersonWithoutId[],
  approverList: PersonWithoutId[]
): Promise<{ applicantIds: string[]; approverIds: string[] }> => {
  const applicantIds = await createPersonList(applicantList);
  const approverIds = await createPersonList(approverList);
  return { applicantIds, approverIds };
};

export const createEventInternal = async (
  event: EventForm
): Promise<boolean | undefined> => {
  const {
    name,
    email,
    eventId,
    ownerId,
    eventQRCodeBase64,
    ownerIdQRCodeBase64,
    applicantList,
    approverList,
  } = event;

  try {
    const { applicantIds, approverIds } = await createApplicantsAndApprovers(
      applicantList,
      approverList
    );
    const giftIds = await createGiftList(applicantIds);
    const eventData: CreateEventData = {
      name,
      email,
      eventId,
      ownerId,
      eventQRCodeBase64,
      ownerIdQRCodeBase64,
      applicantIds,
      giftIds,
      approverIds,
    };
    const newEvent = await createEventRecord(eventData);
    return Boolean(newEvent);
  } catch (error) {
    handleError(error);
  }
};
