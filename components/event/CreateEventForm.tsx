/**
 * CreateEventForm.tsx
 *
 * Purpose: Comprehensive form component for event creation with Excel import, QR generation, and email integration
 *
 * Main Responsibilities:
 * - Handles complete event creation workflow from form input to database persistence
 * - Manages Excel file uploads for applicant data import
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

/**
 * @file CreateEventForm.tsx
 * @description
 * Comprehensive form component for event creation with Excel import, QR generation, and email integration.
 * Handles the complete event creation workflow, including form input, file upload, QR code generation, validation, email delivery, and context/database updates.
 *
 * Responsibilities:
 * - Renders the event creation form and manages user input
 * - Validates and processes form data
 * - Generates unique event and owner IDs
 * - Generates and displays QR codes for the event and owner
 * - Sends confirmation emails and creates the event in the backend
 * - Integrates with service, utility, and UI modules for modularity
 * - Coordinates multiple context providers for form state management
 *
 * Constraints:
 * - No new UI elements or styling changes
 * - No new features; only code quality, structure, and maintainability improvements
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
import { success, failure } from "@/utils/fp";
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
  // --- State and Contexts ---
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fileProcessingErrors, setFileProcessingErrors] = useState<string[]>(
    []
  );
  const contextActions = useAppContexts();

  // --- IDs and URLs ---
  const eventId = useMemo(generateEventId, []);
  const ownerId = useMemo(generateOwnerId, []);
  const urls = useMemo(
    () => ({
      EVENT_URL: `${BASE_URL}/${eventId}`,
      OWNER_URL: `${BASE_URL}/${eventId}/${ownerId}`,
    }),
    [eventId, ownerId]
  );

  // --- QR Code Refs ---
  /**
   * Ref for the event QR code element (for image capture).
   */
  // These refs must be RefObject<HTMLDivElement> (not HTMLDivElement | null)
  const eventQRCodeRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  /**
   * Ref for the owner QR code element (for image capture).
   */
  const ownerQRCodeRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  // --- Helper: Aggregate error messages for display ---
  /**
   * Aggregates all error messages for display.
   * @returns {string} Combined error message string or empty string if no errors.
   */
  const getAggregatedErrorMessage = useCallback((): string => {
    const errors = [
      ...(errorMessage ? [errorMessage] : []),
      ...fileProcessingErrors,
    ];
    return errors.join("; ");
  }, [errorMessage, fileProcessingErrors]);

  // --- File Processing Error Handlers ---
  /**
   * Handles file processing errors by aggregating them for display.
   * @param error Error message from file format detection.
   */
  const handleFileError = useCallback((error: string) => {
    setFileProcessingErrors((prev) => [...prev, error]);
  }, []);

  /**
   * Handles successful file processing by clearing related errors.
   * @param formatInfo Successfully detected format information.
   */
  const handleFileSuccess = useCallback((_formatInfo: any) => {
    setFileProcessingErrors([]);
  }, []);

  // --- Form Processing Helpers ---
  /**
   * Processes and validates form data with consistent Result pattern.
   * @param data Form input data containing event name, email, and files.
   * @returns Promise<Result<ProcessFormDataOutput, string>>
   */
  const processAndValidateForm = useCallback(
    async (data: {
      eventName: string;
      eventEmail: string;
      applicantsFile: File;
    }) => processFormData(data, ERROR_MESSAGES),
    []
  );

  /**
   * Generates QR codes from DOM refs with consistent Result pattern.
   * @returns Promise<Result<GenerateQRCodesOutput, string>>
   */
  const generateAndValidateQRCodes = useCallback(
    async () => generateQRCodes(eventQRCodeRef, ownerQRCodeRef),
    []
  );

  /**
   * Saves processed data to contexts with consistent Result pattern.
   * @param processedData The validated form data to save to contexts.
   * @returns Promise<Result<void, string>>
   */
  const saveToContexts = useCallback(
    async (processedData: any) => {
      const { event: eventActions, applicant: applicantActions } =
        contextActions;
      // All are Maybe types, so check _tag and use .value
      if (eventActions._tag !== "Some" || applicantActions._tag !== "Some") {
        return failure("Context not available. Please refresh the page.");
      }
      // Save event id to EventContext
      const eventResult = eventActions.value.dispatchSafe({
        type: "SET_EVENT_ID",
        payload: eventId,
      });
      if (eventResult._tag === "Failure")
        return failure("Failed to save event data");
      // Save applicant list to ApplicantContext
      const applicantResult = applicantActions.value.dispatchSafe({
        type: "SET_EVENT_APPLICANTS",
        payload: { applicantList: processedData.applicantList },
      });
      if (applicantResult._tag === "Failure")
        return failure("Failed to save applicant data");

      return success(undefined);
    },
    [contextActions, eventId]
  );

  // --- Main Form Submission Handler ---
  /**
   * Handles form submission and orchestrates the event creation workflow.
   * @param data Form data from user input.
   * @returns {Promise<void>} (async)
   * Side effects: Updates error state, triggers backend and email services, navigates on success.
   */
  const handleSubmit = useCallback(
    async (data: {
      eventName: string;
      eventEmail: string;
      applicantsFile: File;
    }) => {
      setErrorMessage("");
      setFileProcessingErrors([]);
      // Step 1: Process and validate form data
      const processedResult = await processAndValidateForm(data);
      if (processedResult._tag === "Failure") {
        setErrorMessage(processedResult.error);
        return;
      }
      const processedData = processedResult.value;
      // Step 2: Generate QR codes
      const qrResult = await generateAndValidateQRCodes();
      if (qrResult._tag === "Failure") {
        setErrorMessage(qrResult.error);
        return;
      }
      const qrCodes = qrResult.value;
      // Step 3: Save to contexts
      const contextResult = await saveToContexts(processedData);
      if (contextResult._tag === "Failure") {
        setErrorMessage(contextResult.error);
        return;
      }
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
      const successResult = await createEvent({
        name: processedData.name,
        email: processedData.email,
        eventId,
        ownerId,
        eventQRCodeBase64: qrCodes.eventQRCodeBase64,
        ownerIdQRCodeBase64: qrCodes.ownerIdQRCodeBase64,
        applicantList: processedData.applicantList,
      });
      if (successResult) {
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

  // --- Render ---
  return (
    <>
      <Form
        schema={EventSchema}
        defaultValues={FORM_CONFIG.DEFAULT_VALUES}
        submit={handleSubmit}
      >
        <FormInputSection />
        <FormFileSection
          onFormatError={handleFileError}
          onFormatSuccess={handleFileSuccess}
        />
        <ErrorMessage message={getAggregatedErrorMessage()} />
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
