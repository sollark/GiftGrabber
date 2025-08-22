/**
 * CreateEventForm.tsx
 *
 * Purpose: Comprehensive form component for event creation with Excel import, QR generation, and email integration
 *
 * Main Responsibilities:
 * - Handles complete event creation workflow from form input to database persistence
 * - Manages Excel file uploads for applicant and approver data import
 * - Generates QR codes for event access and owner verification
 * - Validates form data and processes multi-format Excel imports
 * - Coordinates email delivery with QR codes and event details
 * - Manages complex form state with multiple file inputs and validation steps
 *
 * Architecture Role:
 * - Central component orchestrating event creation business logic
 * - Integration point between UI form components and backend services
 * - Coordinates multiple context providers for form state management
 * - Bridge between file processing utilities and database services
 * - Critical component in event organizer onboarding workflow
 *
 * @businessLogic
 * - Generates unique event and owner IDs for security and identification
 * - Processes Excel files with automatic format detection and validation
 * - Creates QR codes linking to event pages and owner verification
 * - Sends confirmation emails with embedded QR codes for offline access
 * - Validates all input data before database operations
 *
 * File: CreateEventForm.tsx
 * Purpose: UI and logic for creating a new event, including form handling, validation, QR code generation, and event creation.
 * Responsibilities:
 *   - Renders the event creation form and handles user input.
 *   - Validates and processes form data.
 *   - Generates unique event and owner IDs.
 *   - Generates and displays QR codes for the event and owner.
 *   - Sends confirmation emails and creates the event in the backend.
 * Architecture:
 *   - Top-level page component in the event creation workflow.
 *   - Integrates with service, utility, and UI modules for modularity.
 */
"use client";

import { createEvent } from "@/app/actions/event.action";
import { generateEventId, generateOwnerId } from "@/utils/utils";
import { EventSchema } from "@/utils/validator";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback, useMemo, FC } from "react";
import ErrorMessage from "@/ui/form/ErrorMessage";
import Form from "@/ui/form/Form";
import FormInputSection from "./FormInputSection";
import FormFileSection from "./FormFileSection";
import QRCodeSection from "./QRCodeSection";
import { processFormData } from "@/service/createEventFormService";
import { generateQRCodes } from "@/utils/qrcodeUtils";
import { useEventFormContexts } from "@/utils/context-composers";
import {
  FORM_CONFIG,
  BASE_URL,
  ERROR_MESSAGES,
} from "@/config/eventFormConfig";
import { sendMailToClient } from "@/service/mailService";

/**
 * Main CreateEventForm component.
 * Public API.
 * Renders the event creation form, handles submission, and coordinates all event creation logic.
 * Side effects: Navigates, updates state, triggers backend calls, sends email.
 */
const CreateEventForm: FC = () => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Use composed context hook for better separation of concerns
  const contextActions = useEventFormContexts();

  const eventId = useMemo(generateEventId, []);
  const ownerId = useMemo(generateOwnerId, []);
  const urls = useMemo(
    () => ({
      EVENT_URL: `${BASE_URL}/${eventId}`,
      OWNER_URL: `${BASE_URL}/${eventId}/${ownerId}`,
    }),
    []
  );

  // Initialize QR code refs for capturing QR code elements
  /**
   * Ref for the event QR code element (for image capture).
   * @type {React.RefObject<HTMLDivElement>}
   */
  const eventQRCodeRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  /**
   * Ref for the owner QR code element (for image capture).
   * @type {React.RefObject<HTMLDivElement>}
   */
  const ownerQRCodeRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  // Form processing helpers
  const processAndValidateForm = useCallback(
    async (data: {
      eventName: string;
      eventEmail: string;
      applicantsFile: File;
      approversFile?: File;
    }) => {
      const processedResult = await processFormData(data, ERROR_MESSAGES);
      if (processedResult._tag === "Failure") {
        setErrorMessage(processedResult.error);
        return null;
      }
      return processedResult.value;
    },
    []
  );

  const generateAndValidateQRCodes = useCallback(async () => {
    const qrResult = await generateQRCodes(eventQRCodeRef, ownerQRCodeRef);
    if (qrResult._tag === "Failure") {
      setErrorMessage(qrResult.error);
      return null;
    }
    return qrResult.value;
  }, []);

  const saveToContexts = useCallback(
    async (processedData: any) => {
      if (contextActions._tag === "None") {
        setErrorMessage("Context not available. Please refresh the page.");
        return false;
      }

      const {
        event: eventActions,
        applicant: applicantActions,
        approver: approverActions,
      } = contextActions.value;

      // Save event id to EventContext (only the eventId string)
      const eventResult = eventActions.dispatchSafe({
        type: "SET_EVENT_ID",
        payload: eventId, // Pass eventId string directly, not object
      });
      if (eventResult._tag === "Failure") {
        setErrorMessage("Failed to save event data");
        return false;
      }

      // Save applicant list to ApplicantContext
      const applicantResult = applicantActions.dispatchSafe({
        type: "SET_EVENT_APPLICANTS",
        payload: { applicantList: processedData.applicantList },
      });
      if (applicantResult._tag === "Failure") {
        setErrorMessage("Failed to save applicant data");
        return false;
      }

      // Save approver list to ApproverContext
      const approverResult = approverActions.dispatchSafe({
        type: "SET_EVENT_APPROVERS",
        payload: { approverList: processedData.approverList },
      });
      if (approverResult._tag === "Failure") {
        setErrorMessage("Failed to save approver data");
        return false;
      }

      return true;
    },
    [contextActions, eventId]
  );

  // Main form submission handler - orchestrates the workflow
  /**
   * handleSubmit
   * Public API (passed to Form).
   * Orchestrates the event creation workflow by coordinating helper functions.
   * @param data Form data from user input
   * @returns {Promise<void>} (async)
   * Side effects: Updates error state, triggers backend and email services, navigates on success.
   * Notes: Memoized with useCallback to avoid unnecessary rerenders.
   */
  const handleSubmit = useCallback(
    async (data: {
      eventName: string;
      eventEmail: string;
      applicantsFile: File;
      approversFile?: File;
    }) => {
      // Step 1: Process and validate form data
      const processedData = await processAndValidateForm(data);
      if (!processedData) return;

      // Step 2: Generate QR codes
      const qrCodes = await generateAndValidateQRCodes();
      if (!qrCodes) return;

      // Step 3: Save to contexts
      const contextsSaved = await saveToContexts(processedData);
      if (!contextsSaved) return;

      // Step 4: Send confirmation email
      const mailResult = await sendMailToClient(
        processedData.email,
        qrCodes.eventQRCodeBase64,
        qrCodes.ownerIdQRCodeBase64
      );
      if (mailResult._tag === "Failure") {
        setErrorMessage(mailResult.error);
        return;
      }

      // Step 5: Create event in database
      const success = await createEvent({
        name: processedData.name,
        email: processedData.email,
        eventId,
        ownerId,
        eventQRCodeBase64: qrCodes.eventQRCodeBase64,
        ownerIdQRCodeBase64: qrCodes.ownerIdQRCodeBase64,
        applicantList: processedData.applicantList,
        approverList: processedData.approverList,
      });

      if (success) {
        router.push(`/events/${eventId}/${ownerId}`);
      } else {
        setErrorMessage(ERROR_MESSAGES.EVENT_CREATION_ERROR);
      }
    },
    [
      processAndValidateForm,
      generateAndValidateQRCodes,
      saveToContexts,
      eventId,
      ownerId,
      router,
    ]
  );

  return (
    <>
      <Form
        schema={EventSchema}
        defaultValues={FORM_CONFIG.DEFAULT_VALUES}
        submit={handleSubmit}
      >
        <FormInputSection />
        <FormFileSection />
        <ErrorMessage message={errorMessage} />
      </Form>
      <QRCodeSection
        eventQRCodeRef={eventQRCodeRef}
        ownerQRCodeRef={ownerQRCodeRef}
        eventUrl={urls.EVENT_URL}
        ownerUrl={urls.OWNER_URL}
      />
    </>
  );
};

export default CreateEventForm;
