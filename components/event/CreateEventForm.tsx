"use client";
/**
 * CreateEventForm.tsx
 *
 * Purpose: Comprehensive form component for event creation with Excel import, QR generation, and email integration.
 *
 * Main Responsibilities:
 * - Orchestrates the entire event creation workflow, from user input to backend persistence.
 * - Manages Excel file uploads for applicant data import and validation.
 * - Generates QR codes for event access and owner verification.
 * - Validates form data and processes multi-format Excel imports.
 * - Coordinates email delivery with QR codes and event details.
 * - Manages complex form state, error handling, and validation steps.
 *
 * Architecture Role:
 * - Central UI component integrating business logic, context providers, and backend services.
 * - Bridge between file processing utilities, QR code generation, and database/email services.
 * - Critical entry point for event organizer onboarding and event creation.
 *
 * Business Logic Rules:
 * - Generates unique event and owner IDs for security and identification.
 * - Processes Excel files with automatic format detection and validation.
 * - Creates QR codes linking to event pages and owner verification.
 * - Sends confirmation emails with embedded QR codes for offline access.
 * - Validates all input data before database operations.
 *
 * Constraints:
 * - No new UI elements or styling changes.
 * - No new features; only code quality, structure, and maintainability improvements.
 */

import { createEvent } from "@/app/actions/event.action";
import { generateEventId, generateOwnerId } from "@/utils/utils";
import { EventSchema } from "@/utils/validator";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback, useMemo, FC } from "react";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useErrorHandler } from "@/components/ErrorBoundary";
import Form from "@/ui/form/Form";
import FormInputSection from "./FormInputSection";
import FormFileSection from "./FormFileSection";
import QRCodeSection from "./QRCodeSection";
import { processFormData } from "@/service/createEventFormService";
import { generateQRCodes } from "@/utils/qrcodeUtils";
import { success, isFailure } from "@/utils/fp";
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
 *
 * Side effects:
 * - Navigates using Next.js router
 * - Updates React state
 * - Triggers backend calls and email delivery
 * - Logs to console
 */

const CreateEventForm: FC = () => {
  // --- Enhanced Error Tracking ---
  const { handleError, errorCount, lastError, clearErrors } =
    useErrorHandler("CreateEventForm");

  // --- State and Contexts ---
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fileProcessingErrors, setFileProcessingErrors] = useState<string[]>(
    []
  );

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
   * Used to generate and capture QR code images for event access.
   */
  // These refs must be RefObject<HTMLDivElement> (not HTMLDivElement | null)
  const eventQRCodeRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  /**
   * Ref for the owner QR code element (for image capture).
   * Used to generate and capture QR code images for owner verification.
   */
  const ownerQRCodeRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  // --- Helper: Aggregate error messages for display ---
  /**
   * Aggregates all error messages for display.
   *
   * @returns {string} Combined error message string or empty string if no errors.
   * @sideEffects None
   * @notes Ensures user sees all relevant errors at once.
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
   *
   * @param error {string} Error message from file format detection.
   * @sideEffects Updates fileProcessingErrors state.
   * @notes Ensures all file errors are tracked.
   */
  const handleFileError = useCallback((error: string) => {
    setFileProcessingErrors((prev) => [...prev, error]);
  }, []);

  /**
   * Handles successful file processing by clearing related errors.
   *
   * @param formatInfo {any} Successfully detected format information.
   * @sideEffects Updates fileProcessingErrors state.
   * @notes Resets error state after successful file handling.
   */
  const handleFileSuccess = useCallback((_formatInfo: any) => {
    setFileProcessingErrors([]);
  }, []);

  // --- Form Processing Helpers ---
  /**
   * Processes and validates form data with consistent Result pattern.
   *
   * @param data {object} Form input data containing eventName, eventEmail, applicantsFile.
   * @returns {Promise<Result<ProcessFormDataOutput, string>>} Success or error result.
   * @sideEffects Calls external service for processing.
   * @notes Uses Result pattern for error handling.
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
   *
   * @returns {Promise<Result<GenerateQRCodesOutput, string>>} Success or error result.
   * @sideEffects Calls QR code utility.
   * @notes Ensures QR codes are generated before event creation.
   */
  const generateAndValidateQRCodes = useCallback(
    async () => generateQRCodes(eventQRCodeRef, ownerQRCodeRef),
    []
  );

  /**
   * Saves processed data to contexts with consistent Result pattern.
   *
   * @param processedData {any} The validated form data to save to contexts.
   * @returns {Promise<Result<void, string>>} Success or error result.
   * @sideEffects Logs to console; intended to update context state.
   * @notes Context saving is temporarily disabled.
   */
  const saveToContexts = useCallback(
    async (processedData: any) => {
      console.log("CHECK: Save to contexts is currently disabled.");

      // Context saving temporarily disabled - will be re-enabled when contexts are properly configured
      console.log("Event data processed:", {
        eventId,
        applicantCount: processedData.applicantList?.length,
      });
      return success(undefined);
    },
    [eventId]
  );

  // --- Main Form Submission Handler ---
  /**
   * Handles form submission and orchestrates the event creation workflow.
   *
   * @param data {object} Form data from user input.
   * @returns {Promise<void>} (async)
   * @sideEffects Updates error state, triggers backend and email services, navigates on success.
   * @notes Implements stepwise workflow; uses Result pattern for error handling.
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
      if (isFailure(qrResult)) {
        setErrorMessage(qrResult.error);
        return;
      }
      const qrCodes = qrResult.value;
      // Step 3: Save to contexts
      const contextResult = (await saveToContexts(
        processedData
      )) as import("@/utils/fp").Result<void, string>;
      if (isFailure(contextResult)) {
        setErrorMessage(
          typeof contextResult.error === "string"
            ? contextResult.error
            : String(contextResult.error)
        );
        return;
      }
      // Step 4: Send confirmation email
      const mailResult = await sendMailToClient(
        processedData.email,
        qrCodes.eventQRCodeBase64,
        qrCodes.ownerIdQRCodeBase64
      );
      if (isFailure(mailResult)) {
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
        {errorCount > 1 && (
          <div
            style={{ fontSize: "0.8em", color: "#666", marginTop: "0.5rem" }}
          >
            Total errors in this session: {errorCount}
          </div>
        )}
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
