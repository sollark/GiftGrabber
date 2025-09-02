/**
 * Configuration constants for the event creation form.
 * All values are exported for use in form components and services.
 */

/**
 * Default form values and input styles for event creation.
 */
export const FORM_CONFIG = {
  DEFAULT_VALUES: {
    eventName: "",
    eventEmail: "",
    applicantsFile: undefined,
  },
  INPUT_STYLES: { style: { fontSize: 24 } },
} as const;

/**
 * Base URL for event-related API calls.
 */
export const BASE_URL = "https://gift-grabber.onrender.com/events";

/**
 * Error messages for various event creation failures.
 */
export const ERROR_MESSAGES = {
  APPLICANT_LIST_ERROR: "Error getting an applicant list",
  QR_CODE_ERROR: "Error getting QR code",
  EVENT_CREATION_ERROR: "Error creating event",
} as const;
