/**
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
import { useEventActions } from "@/app/contexts/EventContext";
import { useApplicantActions } from "@/app/contexts/ApplicantContext";
import { useApproverActions } from "@/app/contexts/ApproverContext";
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
  // Context action hooks
  const eventActions = useEventActions();
  const applicantActions = useApplicantActions();
  const approverActions = useApproverActions();

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

  // Main form submission handler
  /**
   * handleSubmit
   * Public API (passed to Form).
   * Handles form submission: validates, processes, generates QR codes, sends email, creates event.
   * @param data { eventName: string, eventEmail: string, applicantsFile: File, approversFile?: File }
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
      const processedResult = await processFormData(data, ERROR_MESSAGES);
      if (processedResult._tag === "Failure") {
        setErrorMessage(processedResult.error);
        return;
      }
      const processedData = processedResult.value;

      const qrResult = await generateQRCodes(
        eventQRCodeRef,
        ownerQRCodeRef,
        ERROR_MESSAGES
      );
      if (qrResult._tag === "Failure") {
        setErrorMessage(qrResult.error);
        return;
      }
      const qrCodes = qrResult.value;

      // --- Validate contexts before saving data ---
      if (
        eventActions._tag === "None" ||
        applicantActions._tag === "None" ||
        approverActions._tag === "None"
      ) {
        setErrorMessage("Context not available. Please refresh the page.");
        return;
      }

      // --- Save data to contexts ---
      // Save event id to EventContext (only the eventId string)
      const eventResult = eventActions.value.dispatchSafe({
        type: "SET_EVENT_ID",
        payload: eventId, // Pass eventId string directly, not object
      });
      if (eventResult._tag === "Failure") {
        setErrorMessage("Failed to save event data");
        return;
      }

      // Save applicant list to ApplicantContext
      const applicantResult = applicantActions.value.dispatchSafe({
        type: "SET_EVENT_APPLICANTS",
        payload: { applicantList: processedData.applicantList },
      });
      if (applicantResult._tag === "Failure") {
        setErrorMessage("Failed to save applicant data");
        return;
      }

      // Save approver list to ApproverContext
      const approverResult = approverActions.value.dispatchSafe({
        type: "SET_EVENT_APPROVERS",
        payload: { approverList: processedData.approverList },
      });
      if (approverResult._tag === "Failure") {
        setErrorMessage("Failed to save approver data");
        return;
      }

      const mailResult = await sendMailToClient(
        processedData.email,
        qrCodes.eventQRCodeBase64,
        qrCodes.ownerIdQRCodeBase64
      );
      if (mailResult._tag === "Failure") {
        setErrorMessage(mailResult.error);
        return;
      }

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
    [eventId, ownerId, router]
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
