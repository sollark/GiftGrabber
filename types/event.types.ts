import { Event } from "@/database/models/event.model";
import { Person } from "@/database/models/person.model";

// --- Utility Types ---
// Utility type: removes _id from Person for form usage
export type PersonWithoutId = Omit<Person, "_id">;

// --- Form Data Types ---
/**
 * Input type for processing event form data
 * Contains event name, email, and applicant/approver files
 */
export interface ProcessFormDataInput {
  eventName: string;
  eventEmail: string;
  applicantsFile: File;
  approversFile: File;
}

/**
 * Output type for processed event form data
 * Contains normalized event name, email, and applicant/approver lists
 */
export interface ProcessFormDataOutput {
  name: string;
  email: string;
  applicantList: PersonWithoutId[];
  approverList: PersonWithoutId[];
}

// --- Event Types ---
export interface EventForm
  extends Omit<Event, "_id" | "giftList" | "applicantList" | "approverList"> {
  applicantList: PersonWithoutId[];
  approverList: PersonWithoutId[];
}

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
