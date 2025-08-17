import {
  PersonWithoutId,
  CreateEventData,
  EventFormData,
} from "./common.types";

// ============================================================================
// FORM DATA TYPES - Event Form Processing
// ============================================================================

/**
 * Input type for processing event form data
 * Contains event name, email, and applicant/approver files from user input
 */
export interface ProcessFormDataInput {
  eventName: string;
  eventEmail: string;
  applicantsFile: File;
  approversFile?: File;
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

// ============================================================================
// RE-EXPORTS - For backwards compatibility
// ============================================================================

/**
 * Re-export commonly used types from common module
 */
export type { PersonWithoutId, CreateEventData, EventFormData };

/**
 * Legacy alias for EventFormData - for backwards compatibility
 * @deprecated Use EventFormData instead
 */
export type EventForm = EventFormData;
